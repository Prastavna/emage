import { describe, it, expect, vi } from 'vitest'
import {
  clampToPositiveInt,
  computeResizeDimensions,
  findLargestParamUnderTarget
} from './resizeMath'

describe('clampToPositiveInt', () => {
  it('rounds to the nearest integer', () => {
    expect(clampToPositiveInt(10.4)).toBe(10)
    expect(clampToPositiveInt(10.5)).toBe(11)
    expect(clampToPositiveInt(10.6)).toBe(11)
  })

  it('clamps values below 1 up to 1', () => {
    expect(clampToPositiveInt(0)).toBe(1)
    expect(clampToPositiveInt(0.2)).toBe(1)
    expect(clampToPositiveInt(-50)).toBe(1)
  })

  it('handles non-finite input by returning 1', () => {
    expect(clampToPositiveInt(NaN)).toBe(1)
    expect(clampToPositiveInt(Infinity)).toBe(1)
    expect(clampToPositiveInt(-Infinity)).toBe(1)
  })
})

describe('computeResizeDimensions', () => {
  describe('maintainAspect (default)', () => {
    it('derives height from width', () => {
      const dims = computeResizeDimensions({ srcWidth: 1000, srcHeight: 500, targetWidth: 400 })
      expect(dims).toEqual({ width: 400, height: 200 })
    })

    it('derives width from height', () => {
      const dims = computeResizeDimensions({ srcWidth: 1000, srcHeight: 500, targetHeight: 100 })
      expect(dims).toEqual({ width: 200, height: 100 })
    })

    it('fits inside the box when both provided (wide source limited by width)', () => {
      // 2:1 source, asked for a 400x400 box → width limits, height becomes 200
      const dims = computeResizeDimensions({
        srcWidth: 1000,
        srcHeight: 500,
        targetWidth: 400,
        targetHeight: 400
      })
      expect(dims).toEqual({ width: 400, height: 200 })
    })

    it('fits inside the box when both provided (tall source limited by height)', () => {
      // 1:2 source, asked for a 400x400 box → height limits, width becomes 200
      const dims = computeResizeDimensions({
        srcWidth: 500,
        srcHeight: 1000,
        targetWidth: 400,
        targetHeight: 400
      })
      expect(dims).toEqual({ width: 200, height: 400 })
    })

    it('never exceeds either requested dimension when fitting', () => {
      const dims = computeResizeDimensions({
        srcWidth: 1920,
        srcHeight: 1080,
        targetWidth: 800,
        targetHeight: 800
      })
      expect(dims.width).toBeLessThanOrEqual(800)
      expect(dims.height).toBeLessThanOrEqual(800)
    })

    it('returns source dimensions when neither width nor height given', () => {
      const dims = computeResizeDimensions({ srcWidth: 640, srcHeight: 480 })
      expect(dims).toEqual({ width: 640, height: 480 })
    })

    it('preserves aspect ratio within rounding', () => {
      const dims = computeResizeDimensions({ srcWidth: 1333, srcHeight: 1000, targetWidth: 500 })
      // 1.333 aspect → 500 / 1.333 ≈ 375
      expect(dims.width).toBe(500)
      expect(dims.height).toBe(375)
    })

    it('treats a zero target dimension as "omitted"', () => {
      const dims = computeResizeDimensions({
        srcWidth: 1000,
        srcHeight: 500,
        targetWidth: 300,
        targetHeight: 0
      })
      expect(dims).toEqual({ width: 300, height: 150 })
    })
  })

  describe('maintainAspect = false', () => {
    it('uses width and height verbatim (allows distortion)', () => {
      const dims = computeResizeDimensions({
        srcWidth: 1000,
        srcHeight: 500,
        targetWidth: 300,
        targetHeight: 900,
        maintainAspect: false
      })
      expect(dims).toEqual({ width: 300, height: 900 })
    })

    it('falls back to source dimension when one side omitted', () => {
      const dims = computeResizeDimensions({
        srcWidth: 1000,
        srcHeight: 500,
        targetWidth: 300,
        maintainAspect: false
      })
      expect(dims).toEqual({ width: 300, height: 500 })
    })
  })

  describe('edge cases', () => {
    it('returns 1x1 for a zero-size source', () => {
      expect(computeResizeDimensions({ srcWidth: 0, srcHeight: 0, targetWidth: 100 }))
        .toEqual({ width: 1, height: 1 })
    })

    it('returns 1x1 for a non-finite source', () => {
      expect(computeResizeDimensions({ srcWidth: NaN, srcHeight: 100, targetWidth: 100 }))
        .toEqual({ width: 1, height: 1 })
    })

    it('clamps a sub-pixel derived dimension to at least 1', () => {
      // Extremely wide source, tiny target width → derived height < 1
      const dims = computeResizeDimensions({ srcWidth: 10000, srcHeight: 10, targetWidth: 5 })
      expect(dims.width).toBe(5)
      expect(dims.height).toBe(1)
    })

    it('always returns integers', () => {
      const dims = computeResizeDimensions({ srcWidth: 1001, srcHeight: 333, targetWidth: 257 })
      expect(Number.isInteger(dims.width)).toBe(true)
      expect(Number.isInteger(dims.height)).toBe(true)
    })
  })
})

describe('findLargestParamUnderTarget', () => {
  // A linear size model: size(param) = param * slope. Monotonic increasing,
  // which is the invariant the search relies on.
  const linearMeasure = (slope: number) => vi.fn((param: number) => Promise.resolve(param * slope))

  it('returns max when even the largest param is under target', () => {
    const measure = linearMeasure(100) // size at param=1 is 100
    return findLargestParamUnderTarget({ measure, targetKB: 200, min: 0.1, max: 1 }).then((res) => {
      expect(res.param).toBe(1)
      expect(res.sizeKB).toBe(100)
      expect(res.withinTarget).toBe(true)
    })
  })

  it('returns min (not within target) when even the smallest param overshoots', async () => {
    const measure = linearMeasure(1000) // size at param=0.1 is 100
    const res = await findLargestParamUnderTarget({ measure, targetKB: 50, min: 0.1, max: 1 })
    expect(res.param).toBe(0.1)
    expect(res.withinTarget).toBe(false)
    // Should not waste calls beyond establishing the floor.
    expect(measure).toHaveBeenCalledTimes(1)
  })

  it('converges to a value at or under the target', async () => {
    // size = param * 1000, target 500 → ideal param 0.5
    const measure = linearMeasure(1000)
    const res = await findLargestParamUnderTarget({
      measure,
      targetKB: 500,
      min: 0.1,
      max: 1,
      tolerance: 0.01,
      maxIterations: 30
    })
    expect(res.withinTarget).toBe(true)
    expect(res.sizeKB).toBeLessThanOrEqual(500)
    expect(res.param).toBeLessThanOrEqual(0.5 + 1e-6)
    // Close to the ideal boundary.
    expect(res.param).toBeGreaterThan(0.45)
  })

  it('stops early once within tolerance', async () => {
    const measure = linearMeasure(1000)
    const res = await findLargestParamUnderTarget({
      measure,
      targetKB: 500,
      min: 0.1,
      max: 1,
      tolerance: 0.1, // generous band → should stop quickly
      maxIterations: 30
    })
    expect(res.withinTarget).toBe(true)
    // 1 (floor) + 1 (ceiling) + a few bisections, far fewer than 30.
    expect(res.iterations).toBeLessThan(10)
  })

  it('respects the maxIterations budget', async () => {
    const measure = linearMeasure(1000)
    const res = await findLargestParamUnderTarget({
      measure,
      targetKB: 500,
      min: 0.1,
      max: 1,
      tolerance: 0, // never satisfied → always exhausts the budget
      maxIterations: 5
    })
    // floor + ceiling + 5 bisections
    expect(res.iterations).toBe(7)
  })

  it('picks the largest feasible param, never an overshooting one', async () => {
    // Step model: size jumps. Anything > 0.6 overshoots a 600 target.
    const measure = vi.fn((param: number) => Promise.resolve(param <= 0.6 ? 400 : 900))
    const res = await findLargestParamUnderTarget({
      measure,
      targetKB: 600,
      min: 0.1,
      max: 1,
      maxIterations: 20
    })
    expect(res.withinTarget).toBe(true)
    expect(res.sizeKB).toBe(400)
    expect(res.param).toBeLessThanOrEqual(0.6)
  })

  it('reports the number of measure calls in iterations', async () => {
    const measure = linearMeasure(1000)
    const res = await findLargestParamUnderTarget({ measure, targetKB: 500, min: 0.1, max: 1 })
    expect(res.iterations).toBe(measure.mock.calls.length)
  })
})
