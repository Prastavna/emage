/**
 * Pure, DOM-free image-resize math.
 *
 * Everything here is deterministic and side-effect free so it can be tested
 * exhaustively without a canvas or WASM runtime. The browser/WASM-specific
 * work (Lanczos resampling, WASM encoding) lives in `imageEncoder.ts`, which
 * consumes the dimensions and search results produced here.
 */

export interface Dimensions {
  width: number
  height: number
}

export interface ResizeDimensionsInput {
  srcWidth: number
  srcHeight: number
  /** Desired width in px. Omit/0 to derive from height. */
  targetWidth?: number
  /** Desired height in px. Omit/0 to derive from width. */
  targetHeight?: number
  /** When true, the result preserves the source aspect ratio. */
  maintainAspect?: boolean
}

/** Clamp to a positive integer (>= 1), rounding to the nearest pixel. */
export function clampToPositiveInt(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.max(1, Math.round(value))
}

/**
 * Resolve the final integer pixel dimensions for a resize request.
 *
 * Rules:
 * - maintainAspect + only one of width/height → the other is derived.
 * - maintainAspect + both width/height → the image is fit *inside* the box
 *   (contain), so neither dimension exceeds the request.
 * - maintainAspect + neither → source dimensions are returned unchanged.
 * - no maintainAspect → the provided width/height are used verbatim, each
 *   falling back to the source dimension when omitted.
 *
 * The output is always a pair of positive integers.
 */
export function computeResizeDimensions(input: ResizeDimensionsInput): Dimensions {
  const { srcWidth, srcHeight } = input
  const maintainAspect = input.maintainAspect ?? true

  // Guard against a degenerate source; nothing sensible can be derived.
  if (!Number.isFinite(srcWidth) || !Number.isFinite(srcHeight) || srcWidth <= 0 || srcHeight <= 0) {
    return { width: 1, height: 1 }
  }

  const reqWidth = input.targetWidth && input.targetWidth > 0 ? input.targetWidth : 0
  const reqHeight = input.targetHeight && input.targetHeight > 0 ? input.targetHeight : 0

  if (!maintainAspect) {
    return {
      width: clampToPositiveInt(reqWidth || srcWidth),
      height: clampToPositiveInt(reqHeight || srcHeight)
    }
  }

  const aspect = srcWidth / srcHeight

  let width = reqWidth
  let height = reqHeight

  if (reqWidth && !reqHeight) {
    height = reqWidth / aspect
  } else if (reqHeight && !reqWidth) {
    width = reqHeight * aspect
  } else if (reqWidth && reqHeight) {
    // Fit inside the requested box without distortion (contain).
    const targetAspect = reqWidth / reqHeight
    if (aspect > targetAspect) {
      // Source is wider than the box → width is the limiting dimension.
      height = reqWidth / aspect
    } else {
      height = reqHeight
      width = reqHeight * aspect
    }
  } else {
    // Neither provided → unchanged.
    width = srcWidth
    height = srcHeight
  }

  return {
    width: clampToPositiveInt(width),
    height: clampToPositiveInt(height)
  }
}

export interface SearchOptions {
  /**
   * Measures the encoded size (in KB) produced for a given parameter value.
   * The parameter is monotonic: a larger value must never produce a smaller
   * size (true for both JPEG/WebP quality and for scale factor).
   */
  measure: (param: number) => Promise<number>
  /** Target size in KB. */
  targetKB: number
  /** Lower bound of the search range (inclusive). */
  min: number
  /** Upper bound of the search range (inclusive). */
  max: number
  /**
   * Acceptable closeness, as a fraction of targetKB. When a feasible
   * (under-target) candidate lands within this band, the search stops early.
   * Default 0.05 (5%).
   */
  tolerance?: number
  /** Maximum bisection steps. Default 12. */
  maxIterations?: number
}

export interface SearchResult {
  /** The chosen parameter value. */
  param: number
  /** The encoded size (KB) measured at `param`. */
  sizeKB: number
  /** True when `sizeKB <= targetKB` (the target was actually met). */
  withinTarget: boolean
  /** Number of `measure` calls performed. */
  iterations: number
}

/**
 * Find the LARGEST parameter value whose measured size stays at or under
 * `targetKB`, via binary search. "Largest under target" maximises quality (or
 * scale) while respecting the size budget.
 *
 * Because size is monotonic in the parameter, this converges in O(log range).
 * If even `min` exceeds the target, the result reports `withinTarget: false`
 * and returns the `min` candidate so callers can fall back (e.g. shrink
 * dimensions and search again).
 */
export async function findLargestParamUnderTarget(options: SearchOptions): Promise<SearchResult> {
  const { measure, targetKB, min, max } = options
  const tolerance = options.tolerance ?? 0.05
  const maxIterations = options.maxIterations ?? 12

  let iterations = 0

  // Establish the floor. If the smallest parameter already overshoots, there
  // is nothing feasible in this range.
  const minSize = await measure(min)
  iterations++

  let best: SearchResult = {
    param: min,
    sizeKB: minSize,
    withinTarget: minSize <= targetKB,
    iterations
  }

  if (minSize > targetKB) {
    return best
  }

  // Check the ceiling early: if the largest value is already under target,
  // we can't do better than max.
  const maxSize = await measure(max)
  iterations++
  if (maxSize <= targetKB) {
    return { param: max, sizeKB: maxSize, withinTarget: true, iterations }
  }

  let lo = min
  let hi = max

  for (let i = 0; i < maxIterations; i++) {
    const mid = (lo + hi) / 2
    const size = await measure(mid)
    iterations++

    if (size <= targetKB) {
      best = { param: mid, sizeKB: size, withinTarget: true, iterations }
      lo = mid // try to push higher (better quality/scale)
      // Close enough below the target — stop refining.
      if (targetKB - size <= targetKB * tolerance) break
    } else {
      hi = mid // overshoot — pull back
    }
  }

  best.iterations = iterations
  return best
}
