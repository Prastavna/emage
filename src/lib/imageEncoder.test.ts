import { describe, it, expect, vi } from 'vitest'
import {
  toCodecQuality,
  resizeCanvas,
  encodeCanvas,
  canvasToBlob,
  type EncodeFormat
} from './imageEncoder'

// --- Minimal canvas doubles -------------------------------------------------
// happy-dom's canvas doesn't implement getImageData/toBlob meaningfully, so we
// build explicit stubs to drive the wrapper's decision/fallback logic.

function makeCanvas(opts: {
  width?: number
  height?: number
  imageData?: any
  ctxNull?: boolean
  toBlobResult?: Blob | null
} = {}): any {
  const imageData = opts.imageData ?? { data: new Uint8ClampedArray(4), width: 1, height: 1 }
  const ctx = opts.ctxNull
    ? null
    : {
        imageSmoothingEnabled: false,
        getImageData: vi.fn(() => imageData),
        drawImage: vi.fn()
      }
  return {
    width: opts.width ?? 10,
    height: opts.height ?? 10,
    getContext: vi.fn(() => ctx),
    toBlob: vi.fn((cb: (b: Blob | null) => void, type?: string) => {
      cb(opts.toBlobResult !== undefined ? opts.toBlobResult : new Blob(['x'], { type: type || 'image/png' }))
    }),
    __ctx: ctx
  }
}

describe('toCodecQuality', () => {
  it('maps 0..1 to 1..100', () => {
    expect(toCodecQuality(0.92)).toBe(92)
    expect(toCodecQuality(0.5)).toBe(50)
    expect(toCodecQuality(1)).toBe(100)
  })

  it('clamps to the 1..100 range', () => {
    expect(toCodecQuality(0)).toBe(1)
    expect(toCodecQuality(-1)).toBe(1)
    expect(toCodecQuality(5)).toBe(100)
  })

  it('defaults non-finite input to 75', () => {
    // Infinity and NaN are both non-finite, so both hit the safe default.
    expect(toCodecQuality(NaN)).toBe(75)
    expect(toCodecQuality(Infinity)).toBe(75)
    expect(toCodecQuality(-Infinity)).toBe(75)
  })
})

describe('resizeCanvas', () => {
  it('produces a canvas at the requested target size via pica', async () => {
    const source = makeCanvas({ width: 100, height: 100 })
    const resize = vi.fn((_from: any, to: any) => Promise.resolve(to))
    const created: any[] = []

    const result = await resizeCanvas(source, 40, 20, {
      getPica: () => Promise.resolve({ resize }),
      createCanvas: (w, h) => {
        const c = makeCanvas({ width: w, height: h })
        created.push(c)
        return c as any
      }
    })

    expect(resize).toHaveBeenCalledOnce()
    expect(result.width).toBe(40)
    expect(result.height).toBe(20)
  })

  it('falls back to drawImage when pica throws, still returning a sized canvas', async () => {
    const source = makeCanvas({ width: 100, height: 100 })
    let destCanvas: any
    const result = await resizeCanvas(source, 50, 25, {
      getPica: () => Promise.reject(new Error('pica unavailable')),
      createCanvas: (w, h) => {
        destCanvas = makeCanvas({ width: w, height: h })
        return destCanvas as any
      }
    })

    expect(result.width).toBe(50)
    expect(result.height).toBe(25)
    // The 2d fallback path drew the source into the dest.
    expect(destCanvas.__ctx.drawImage).toHaveBeenCalledWith(source, 0, 0, 50, 25)
  })

  it('does not throw even if the fallback context is null', async () => {
    const source = makeCanvas({ width: 100, height: 100 })
    const result = await resizeCanvas(source, 10, 10, {
      getPica: () => Promise.reject(new Error('nope')),
      createCanvas: (w, h) => makeCanvas({ width: w, height: h, ctxNull: true }) as any
    })
    expect(result.width).toBe(10)
  })
})

describe('encodeCanvas', () => {
  it('encodes JPEG via the injected WASM encoder', async () => {
    const source = makeCanvas({ width: 8, height: 8 })
    const encode = vi.fn((_data: any, _opts?: { quality: number }) => Promise.resolve(new ArrayBuffer(128)))

    const blob = await encodeCanvas(source, 'image/jpeg', 0.8, {
      loadJpegEncoder: () => Promise.resolve(encode)
    })

    expect(encode).toHaveBeenCalledOnce()
    // Quality 0.8 → codec quality 80.
    expect(encode.mock.calls[0]![1]).toEqual({ quality: 80 })
    expect(blob).toBeInstanceOf(Blob)
    expect(blob!.type).toBe('image/jpeg')
    expect(blob!.size).toBe(128)
  })

  it('encodes WebP via the injected WASM encoder', async () => {
    const source = makeCanvas({ width: 8, height: 8 })
    const encode = vi.fn(() => Promise.resolve(new ArrayBuffer(64)))

    const blob = await encodeCanvas(source, 'image/webp', 0.5, {
      loadWebpEncoder: () => Promise.resolve(encode)
    })

    expect(encode).toHaveBeenCalledOnce()
    expect(blob!.type).toBe('image/webp')
    expect(blob!.size).toBe(64)
  })

  it('uses native toBlob for PNG (never the WASM path)', async () => {
    const source = makeCanvas({ width: 8, height: 8, toBlobResult: new Blob(['png'], { type: 'image/png' }) })
    const jpeg = vi.fn()
    const webp = vi.fn()

    const blob = await encodeCanvas(source, 'image/png', 1, {
      loadJpegEncoder: () => Promise.resolve(jpeg as any),
      loadWebpEncoder: () => Promise.resolve(webp as any)
    })

    expect(jpeg).not.toHaveBeenCalled()
    expect(webp).not.toHaveBeenCalled()
    expect(source.toBlob).toHaveBeenCalled()
    expect(blob!.type).toBe('image/png')
  })

  it('falls back to toBlob when the WASM encoder throws', async () => {
    const fallbackBlob = new Blob(['fallback'], { type: 'image/jpeg' })
    const source = makeCanvas({ width: 8, height: 8, toBlobResult: fallbackBlob })

    const blob = await encodeCanvas(source, 'image/jpeg', 0.9, {
      loadJpegEncoder: () => Promise.reject(new Error('wasm load failed'))
    })

    expect(source.toBlob).toHaveBeenCalled()
    expect(blob).toBe(fallbackBlob)
  })

  it('falls back to toBlob when there is no 2d context', async () => {
    const fallbackBlob = new Blob(['fallback'], { type: 'image/webp' })
    const source = makeCanvas({ width: 8, height: 8, ctxNull: true, toBlobResult: fallbackBlob })
    const encode = vi.fn(() => Promise.resolve(new ArrayBuffer(10)))

    const blob = await encodeCanvas(source, 'image/webp', 0.9, {
      loadWebpEncoder: () => Promise.resolve(encode)
    })

    expect(encode).not.toHaveBeenCalled()
    expect(blob).toBe(fallbackBlob)
  })
})

describe('canvasToBlob', () => {
  it('resolves with the produced blob', async () => {
    const expected = new Blob(['data'], { type: 'image/jpeg' })
    const canvas = makeCanvas({ toBlobResult: expected })
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.9)
    expect(blob).toBe(expected)
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.9)
  })

  it('resolves null when the encoder yields null', async () => {
    const canvas = makeCanvas({ toBlobResult: null })
    const blob = await canvasToBlob(canvas, 'image/png', 1)
    expect(blob).toBeNull()
  })
})

// Type-level guard: ensure EncodeFormat stays in sync with usage.
describe('EncodeFormat', () => {
  it('accepts the three supported formats', () => {
    const formats: EncodeFormat[] = ['image/jpeg', 'image/webp', 'image/png']
    expect(formats).toHaveLength(3)
  })
})
