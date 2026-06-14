/**
 * Browser/WASM image operations: high-quality resampling (pica) and
 * codec-grade encoding (jSquash mozjpeg / webp).
 *
 * Both entry points degrade gracefully: if the WASM path is unavailable or
 * throws (e.g. a test runtime without real canvas/WASM, or an unsupported
 * browser), they transparently fall back to the native `<canvas>` path so the
 * editor never hard-fails. The injectable `deps` parameter exists purely so
 * the fallback/decision logic can be unit-tested without loading real WASM.
 */

export type EncodeFormat = 'image/jpeg' | 'image/webp' | 'image/png'

/** Maps a 0..1 quality to jSquash's 1..100 integer scale. */
export function toCodecQuality(quality: number): number {
  if (!Number.isFinite(quality)) return 75
  return Math.max(1, Math.min(100, Math.round(quality * 100)))
}

// --- pica (Lanczos resampling) ---------------------------------------------

interface PicaLike {
  resize: (from: HTMLCanvasElement, to: HTMLCanvasElement) => Promise<HTMLCanvasElement>
}

let picaPromise: Promise<PicaLike> | null = null

async function defaultGetPica(): Promise<PicaLike> {
  if (!picaPromise) {
    picaPromise = import('pica').then((mod) => {
      const Pica = (mod as any).default ?? mod
      // Web workers + WASM features when available; pica picks the best path.
      return new Pica() as PicaLike
    })
  }
  return picaPromise
}

function createCanvasEl(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

export interface ResizeDeps {
  getPica?: () => Promise<PicaLike>
  createCanvas?: (width: number, height: number) => HTMLCanvasElement
}

/**
 * Resize `source` to `targetWidth` x `targetHeight` using pica's Lanczos
 * resampling. Returns a fresh canvas at the target size.
 *
 * Falls back to `drawImage` (browser bilinear) if pica is unavailable or
 * fails — callers always get a correctly-sized canvas back.
 */
export async function resizeCanvas(
  source: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
  deps: ResizeDeps = {}
): Promise<HTMLCanvasElement> {
  const createCanvas = deps.createCanvas ?? createCanvasEl
  const getPica = deps.getPica ?? defaultGetPica

  const dest = createCanvas(targetWidth, targetHeight)

  try {
    const pica = await getPica()
    await pica.resize(source, dest)
    return dest
  } catch {
    // Fallback: native scaled draw.
    const ctx = dest.getContext('2d')
    if (ctx) {
      ctx.imageSmoothingEnabled = true
      // `imageSmoothingQuality` is not in older lib DOM typings.
      ;(ctx as any).imageSmoothingQuality = 'high'
      ctx.drawImage(source, 0, 0, targetWidth, targetHeight)
    }
    return dest
  }
}

// --- jSquash encoding ------------------------------------------------------

type Encoder = (data: ImageData, options?: { quality: number }) => Promise<ArrayBuffer>

let jpegEncoderPromise: Promise<Encoder> | null = null
let webpEncoderPromise: Promise<Encoder> | null = null

async function defaultJpegEncoder(): Promise<Encoder> {
  if (!jpegEncoderPromise) {
    jpegEncoderPromise = import('@jsquash/jpeg').then((m) => (m as any).encode as Encoder)
  }
  return jpegEncoderPromise
}

async function defaultWebpEncoder(): Promise<Encoder> {
  if (!webpEncoderPromise) {
    webpEncoderPromise = import('@jsquash/webp').then((m) => (m as any).encode as Encoder)
  }
  return webpEncoderPromise
}

export interface EncodeDeps {
  loadJpegEncoder?: () => Promise<Encoder>
  loadWebpEncoder?: () => Promise<Encoder>
}

/** Promise-wrapped `canvas.toBlob`, the universal fallback. */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), format, quality)
  })
}

/**
 * Encode a canvas to a Blob.
 *
 * - JPEG / WebP go through jSquash (mozjpeg / libwebp compiled to WASM), whose
 *   rate-control is far more predictable than the browser encoder — this is
 *   what makes target-file-size search converge accurately.
 * - PNG is lossless; the native encoder is used directly.
 * - Any failure in the WASM path falls back to `canvas.toBlob`.
 */
export async function encodeCanvas(
  source: HTMLCanvasElement,
  format: EncodeFormat,
  quality: number,
  deps: EncodeDeps = {}
): Promise<Blob | null> {
  // PNG: native lossless encoder is the right tool.
  if (format === 'image/png') {
    return canvasToBlob(source, 'image/png', 1)
  }

  try {
    const ctx = source.getContext('2d')
    if (!ctx) throw new Error('no 2d context')
    const imageData = ctx.getImageData(0, 0, source.width, source.height)

    const loadEncoder = format === 'image/webp'
      ? deps.loadWebpEncoder ?? defaultWebpEncoder
      : deps.loadJpegEncoder ?? defaultJpegEncoder

    const encode = await loadEncoder()
    const buffer = await encode(imageData, { quality: toCodecQuality(quality) })
    return new Blob([buffer], { type: format })
  } catch {
    // Fallback: browser encoder.
    return canvasToBlob(source, format, quality)
  }
}

/** Reset memoized WASM/pica loaders. Test-only helper. */
export function __resetEncoderCachesForTest(): void {
  picaPromise = null
  jpegEncoderPromise = null
  webpEncoderPromise = null
}
