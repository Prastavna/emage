import { ref, shallowRef } from 'vue'
import { Canvas, FabricImage, filters } from 'fabric'
import {
  computeResizeDimensions,
  clampToPositiveInt,
  findLargestParamUnderTarget
} from '../lib/resizeMath'
import { resizeCanvas, encodeCanvas, type EncodeFormat } from '../lib/imageEncoder'

/** Coerce an arbitrary mime string to a supported encode format (PNG default). */
function toEncodeFormat(format?: string): EncodeFormat {
  if (format === 'image/jpeg' || format === 'image/jpg') return 'image/jpeg'
  if (format === 'image/webp') return 'image/webp'
  return 'image/png'
}

/** Decode a Blob into a fully-loaded HTMLImageElement. */
function htmlImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    image.src = url
  })
}

export interface ImageFilters {
  brightness: number
  contrast: number
  saturation: number
  grayscale: boolean
}

export interface BorderSettings {
  width: number
  color: string
  radius: number
}

export interface ImageDimensions {
  width: number
  height: number
}

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export function useImageEditor() {
  const canvas = shallowRef<Canvas | null>(null)
  const fabricImage = shallowRef<FabricImage | null>(null)
  const originalImage = shallowRef<HTMLImageElement | null>(null)
  const imageLoaded = ref(false)
  const cropMode = ref(false)
  const cropArea = ref<CropArea>({ x: 0, y: 0, width: 0, height: 0 })
  const currentFilters = ref<ImageFilters>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    grayscale: false
  })
  
  const currentBorder = ref<BorderSettings | null>(null)
  
  // Hidden canvas for maintaining original image quality
  const hiddenCanvas = ref<HTMLCanvasElement | null>(null)
  const hiddenContext = ref<CanvasRenderingContext2D | null>(null)
  
  // Reactive tracking of hidden canvas dimensions (DOM properties aren't reactive)
  const hiddenCanvasWidth = ref(0)
  const hiddenCanvasHeight = ref(0)
  
  // Track current rotation angle for hidden canvas reconstruction
  const currentRotationAngle = ref(0)
  
  // Store original file info
  const originalFile = ref<File | null>(null)
  const originalFileFormat = ref<string>('image/jpeg')
  const originalFileName = ref<string>('edited-image')

  // Exact bytes produced by the last target-file-size operation. When present
  // and the requested export format matches, download/size queries serve these
  // bytes verbatim instead of re-encoding (which would change the size and
  // break "resize to 90 KB → download is 90 KB"). Any pixel mutation clears it.
  const exportBlob = shallowRef<Blob | null>(null)
  const exportBlobFormat = ref<EncodeFormat | null>(null)
  const invalidateExportBlob = () => {
    exportBlob.value = null
    exportBlobFormat.value = null
  }

  const initCanvas = (canvasElement: HTMLCanvasElement, width: number = 800, height: number = 600) => {
    canvas.value = new Canvas(canvasElement, {
      backgroundColor: '#f0f0f0',
      selection: false,
      width,
      height
    })
  }

  const loadImage = async (file: File): Promise<void> => {
    invalidateExportBlob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target?.result as string
          
          // Store original file and format
          originalFile.value = file
          originalFileFormat.value = file.type || 'image/jpeg'
          
          // Extract filename without extension
          const fileName = file.name.replace(/\.[^/.]+$/, '')
          originalFileName.value = fileName || 'edited-image'
          
          // Wait for the native image to load so we get correct dimensions
          const img = await new Promise<HTMLImageElement>((resolveImg, rejectImg) => {
            const image = new Image()
            image.onload = () => resolveImg(image)
            image.onerror = rejectImg
            image.src = dataUrl
          })
          
          originalImage.value = img
          
          // Initialize hidden canvas with original image dimensions
          if (!hiddenCanvas.value) {
            hiddenCanvas.value = document.createElement('canvas')
          }
          hiddenCanvas.value.width = img.width
          hiddenCanvas.value.height = img.height
          hiddenContext.value = hiddenCanvas.value.getContext('2d', { willReadFrequently: true })
          
          if (hiddenContext.value) {
            // Draw original image to hidden canvas
            hiddenContext.value.drawImage(img, 0, 0)
          }
          
          // Update reactive dimension tracking
          hiddenCanvasWidth.value = hiddenCanvas.value.width
          hiddenCanvasHeight.value = hiddenCanvas.value.height
          
          // Load image into Fabric canvas (for preview)
          const fabricImg = await FabricImage.fromURL(dataUrl)
          
          if (canvas.value) {
            canvas.value.clear()
            
            // Scale image to fit canvas while maintaining aspect ratio
            const canvasWidth = canvas.value.getWidth()
            const canvasHeight = canvas.value.getHeight()
            const imgWidth = fabricImg.width
            const imgHeight = fabricImg.height
            
            const scale = Math.min(
              canvasWidth / imgWidth,
              canvasHeight / imgHeight,
              1
            )
            
            // Set scale first
            fabricImg.set({
              scaleX: scale,
              scaleY: scale
            })
            
            // Calculate actual dimensions after scaling
            const scaledWidth = imgWidth * scale
            const scaledHeight = imgHeight * scale
            
            // Center the image on canvas
            // Using top-left positioning (Fabric.js default origin)
            fabricImg.set({
              left: (canvasWidth - scaledWidth) / 2,
              top: (canvasHeight - scaledHeight) / 2,
              originX: 'left',
              originY: 'top',
              selectable: false,
              hasControls: false,
              lockMovementX: true,
              lockMovementY: true,
              lockScalingX: true,
              lockScalingY: true,
              lockRotation: true
            })
            
            canvas.value.add(fabricImg)
            canvas.value.selection = false
            canvas.value.renderAll()
            
            fabricImage.value = fabricImg
            imageLoaded.value = true
            
            // Reset filters
            currentFilters.value = {
              brightness: 0,
              contrast: 0,
              saturation: 0,
              grayscale: false
            }
          }
          
          resolve()
        } catch (error) {
          console.error('Error loading image:', error)
          reject(error)
        }
      }
      
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const rotate = (angle: number) => {
    invalidateExportBlob()
    if (fabricImage.value && hiddenCanvas.value && hiddenContext.value) {
      const currentAngle = fabricImage.value.angle || 0
      const newAngle = currentAngle + angle
      
      // Update preview canvas
      fabricImage.value.rotate(newAngle)
      canvas.value?.renderAll()
      
      // Update hidden canvas
      applyRotationToHiddenCanvas(newAngle)
    }
  }

  const setRotation = (angle: number) => {
    invalidateExportBlob()
    if (fabricImage.value && hiddenCanvas.value && hiddenContext.value) {
      // Update preview canvas
      fabricImage.value.rotate(angle)
      canvas.value?.renderAll()
      
      // Update hidden canvas
      applyRotationToHiddenCanvas(angle)
    }
  }
  
  /**
   * Reconstructs the hidden canvas from the original image with the given rotation angle,
   * then applies current filters. Always works from the original image to avoid accumulation.
   */
  const applyRotationToHiddenCanvas = (angle: number) => {
    currentRotationAngle.value = angle
    reconstructHiddenCanvas()
  }
  
  /**
   * Reconstructs the hidden canvas from the original image with current rotation
   * and current filters applied. This is the single source of truth for the hidden
   * canvas content, ensuring no destructive accumulation of transformations.
   */
  const reconstructHiddenCanvas = () => {
    if (!hiddenCanvas.value || !hiddenContext.value || !originalImage.value) return
    
    const angle = currentRotationAngle.value
    const rad = (angle * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    
    const origWidth = originalImage.value.width
    const origHeight = originalImage.value.height
    
    // Calculate new dimensions after rotation
    const newWidth = Math.abs(origWidth * cos) + Math.abs(origHeight * sin)
    const newHeight = Math.abs(origWidth * sin) + Math.abs(origHeight * cos)
    
    // Update hidden canvas dimensions and redraw from original image
    hiddenCanvas.value.width = newWidth
    hiddenCanvas.value.height = newHeight
    hiddenCanvasWidth.value = newWidth
    hiddenCanvasHeight.value = newHeight
    hiddenContext.value = hiddenCanvas.value.getContext('2d', { willReadFrequently: true })
    
    if (!hiddenContext.value) return
    
    // Draw original image with rotation
    hiddenContext.value.translate(newWidth / 2, newHeight / 2)
    hiddenContext.value.rotate(rad)
    hiddenContext.value.drawImage(originalImage.value, -origWidth / 2, -origHeight / 2)
    hiddenContext.value.setTransform(1, 0, 0, 1, 0, 0)
    
    // Apply filters on the freshly drawn image
    applyFiltersToHiddenCanvas()
  }

  const flipHorizontal = () => {
    invalidateExportBlob()
    if (fabricImage.value && hiddenCanvas.value && hiddenContext.value) {
      // Update preview
      fabricImage.value.set('flipX', !fabricImage.value.flipX)
      canvas.value?.renderAll()
      
      // Update hidden canvas
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = hiddenCanvas.value.width
      tempCanvas.height = hiddenCanvas.value.height
      const tempCtx = tempCanvas.getContext('2d')
      
      if (tempCtx) {
        tempCtx.translate(tempCanvas.width, 0)
        tempCtx.scale(-1, 1)
        tempCtx.drawImage(hiddenCanvas.value, 0, 0)
        
        hiddenContext.value.clearRect(0, 0, hiddenCanvas.value.width, hiddenCanvas.value.height)
        hiddenContext.value.drawImage(tempCanvas, 0, 0)
      }
    }
  }

  const flipVertical = () => {
    invalidateExportBlob()
    if (fabricImage.value && hiddenCanvas.value && hiddenContext.value) {
      // Update preview
      fabricImage.value.set('flipY', !fabricImage.value.flipY)
      canvas.value?.renderAll()
      
      // Update hidden canvas
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = hiddenCanvas.value.width
      tempCanvas.height = hiddenCanvas.value.height
      const tempCtx = tempCanvas.getContext('2d')
      
      if (tempCtx) {
        tempCtx.translate(0, tempCanvas.height)
        tempCtx.scale(1, -1)
        tempCtx.drawImage(hiddenCanvas.value, 0, 0)
        
        hiddenContext.value.clearRect(0, 0, hiddenCanvas.value.width, hiddenCanvas.value.height)
        hiddenContext.value.drawImage(tempCanvas, 0, 0)
      }
    }
  }

  const applyFilters = () => {
    invalidateExportBlob()
    if (!fabricImage.value || !hiddenCanvas.value || !hiddenContext.value) return

    const filterArray: InstanceType<typeof filters.BaseFilter>[] = []

    if (currentFilters.value.brightness !== 0) {
      filterArray.push(new filters.Brightness({
        brightness: currentFilters.value.brightness
      }))
    }

    if (currentFilters.value.contrast !== 0) {
      filterArray.push(new filters.Contrast({
        contrast: currentFilters.value.contrast
      }))
    }

    if (currentFilters.value.saturation !== 0) {
      filterArray.push(new filters.Saturation({
        saturation: currentFilters.value.saturation
      }))
    }

    if (currentFilters.value.grayscale) {
      filterArray.push(new filters.Grayscale())
    }

    // Apply to preview canvas
    fabricImage.value.filters = filterArray
    fabricImage.value.applyFilters()
    canvas.value?.renderAll()
    
    // Reconstruct hidden canvas from original image with rotation + filters
    reconstructHiddenCanvas()
  }
  
  /**
   * Applies current filters to the hidden canvas pixel data.
   * This should only be called after the hidden canvas has been freshly drawn
   * from the original image (via reconstructHiddenCanvas), so filters are never compounded.
   */
  const applyFiltersToHiddenCanvas = () => {
    if (!hiddenCanvas.value || !hiddenContext.value) return
    
    const hasFilters = currentFilters.value.brightness !== 0 ||
      currentFilters.value.contrast !== 0 ||
      currentFilters.value.saturation !== 0 ||
      currentFilters.value.grayscale
    
    if (!hasFilters) return
    
    const imageData = hiddenContext.value.getImageData(0, 0, hiddenCanvas.value.width, hiddenCanvas.value.height)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      let r: number = data[i] ?? 0
      let g: number = data[i + 1] ?? 0
      let b: number = data[i + 2] ?? 0
      
      // Apply grayscale
      if (currentFilters.value.grayscale) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        r = g = b = gray
      }
      
      // Apply brightness
      if (currentFilters.value.brightness !== 0) {
        const brightness = currentFilters.value.brightness * 255
        r += brightness
        g += brightness
        b += brightness
      }
      
      // Apply contrast
      if (currentFilters.value.contrast !== 0) {
        const contrast = currentFilters.value.contrast + 1
        r = ((r / 255 - 0.5) * contrast + 0.5) * 255
        g = ((g / 255 - 0.5) * contrast + 0.5) * 255
        b = ((b / 255 - 0.5) * contrast + 0.5) * 255
      }
      
      // Apply saturation
      if (currentFilters.value.saturation !== 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        const saturation = currentFilters.value.saturation + 1
        r = gray + saturation * (r - gray)
        g = gray + saturation * (g - gray)
        b = gray + saturation * (b - gray)
      }
      
      // Clamp values
      data[i] = Math.max(0, Math.min(255, r))
      data[i + 1] = Math.max(0, Math.min(255, g))
      data[i + 2] = Math.max(0, Math.min(255, b))
    }
    
    hiddenContext.value.putImageData(imageData, 0, 0)
  }

  const setBrightness = (value: number) => {
    currentFilters.value.brightness = value
    applyFilters()
  }

  const setContrast = (value: number) => {
    currentFilters.value.contrast = value
    applyFilters()
  }

  const setSaturation = (value: number) => {
    currentFilters.value.saturation = value
    applyFilters()
  }

  const toggleGrayscale = (enabled: boolean) => {
    currentFilters.value.grayscale = enabled
    applyFilters()
  }

  const applyBorder = (width: number, color: string, radius: number = 0, borderType: string = 'solid') => {
    invalidateExportBlob()
    if (!hiddenCanvas.value || !hiddenContext.value || !originalImage.value) return

    // First, reconstruct the hidden canvas to remove any existing border
    reconstructHiddenCanvas()

    currentBorder.value = { width, color, radius }

    // Get the current hidden canvas (which now has no border, just rotation + filters)
    const sourceCanvas = hiddenCanvas.value
    
    // Create a temporary canvas for the bordered image
    const tempCanvas = document.createElement('canvas')
    const borderWidth2x = width * 2
    tempCanvas.width = sourceCanvas.width + borderWidth2x
    tempCanvas.height = sourceCanvas.height + borderWidth2x
    const ctx = tempCanvas.getContext('2d')

    if (!ctx) return

    // Apply different border types
    ctx.fillStyle = color
    
    if (borderType === 'dashed') {
      // Draw solid background first
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
      
      // Draw inner rectangle to create dashed effect
      ctx.clearRect(width, width, sourceCanvas.width, sourceCanvas.height)
      
      // Draw dashed border
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.setLineDash([15, 10])
      ctx.strokeRect(width / 2, width / 2, sourceCanvas.width + width, sourceCanvas.height + width)
      ctx.setLineDash([])
    } else if (borderType === 'dotted') {
      // Draw solid background first
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
      
      // Draw inner rectangle to create dotted effect
      ctx.clearRect(width, width, sourceCanvas.width, sourceCanvas.height)
      
      // Draw dotted border
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.setLineDash([5, 10])
      ctx.strokeRect(width / 2, width / 2, sourceCanvas.width + width, sourceCanvas.height + width)
      ctx.setLineDash([])
    } else if (borderType === 'double') {
      // Draw outer border
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
      
      // Clear middle area for double border effect
      const innerGap = Math.max(2, width / 3)
      ctx.clearRect(innerGap, innerGap, tempCanvas.width - innerGap * 2, tempCanvas.height - innerGap * 2)
      
      // Draw inner border
      const innerBorder = width - innerGap * 2
      if (innerBorder > 0) {
        ctx.fillRect(innerGap, innerGap, tempCanvas.width - innerGap * 2, tempCanvas.height - innerGap * 2)
      }
      
      // Clear center for image
      ctx.clearRect(width, width, sourceCanvas.width, sourceCanvas.height)
    } else if (radius > 0) {
      // Rounded border
      ctx.beginPath()
      const x = 0
      const y = 0
      const w = tempCanvas.width
      const h = tempCanvas.height
      const r = radius
      
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
      ctx.fill()
    } else {
      // Solid rectangle
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    }

    // Draw the image on top with border offset
    if (radius > 0 && borderType !== 'dashed' && borderType !== 'dotted' && borderType !== 'double') {
      // Clip to rounded rectangle for the image
      ctx.save()
      ctx.beginPath()
      const x = width
      const y = width
      const w = sourceCanvas.width
      const h = sourceCanvas.height
      const r = Math.max(0, radius - width)
      
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(sourceCanvas, width, width)
      ctx.restore()
    } else {
      ctx.drawImage(sourceCanvas, width, width)
    }

    // Update hidden canvas with bordered image
    hiddenCanvas.value.width = tempCanvas.width
    hiddenCanvas.value.height = tempCanvas.height
    hiddenCanvasWidth.value = tempCanvas.width
    hiddenCanvasHeight.value = tempCanvas.height
    hiddenContext.value = hiddenCanvas.value.getContext('2d', { willReadFrequently: true })
    
    if (hiddenContext.value) {
      hiddenContext.value.drawImage(tempCanvas, 0, 0)
    }

    // Update the preview canvas
    updatePreviewFromHiddenCanvas()
  }

  const removeBorder = () => {
    invalidateExportBlob()
    currentBorder.value = null
    // Reconstruct from original to remove border
    reconstructHiddenCanvas()
    updatePreviewFromHiddenCanvas()
  }

  const updatePreviewFromHiddenCanvas = async () => {
    if (!hiddenCanvas.value || !canvas.value) return

    // Convert hidden canvas to data URL and reload into preview
    const dataUrl = hiddenCanvas.value.toDataURL('image/png')
    const fabricImg = await FabricImage.fromURL(dataUrl)

    if (canvas.value) {
      // Clear existing image
      canvas.value.clear()

      // Scale image to fit canvas while maintaining aspect ratio
      const canvasWidth = canvas.value.getWidth()
      const canvasHeight = canvas.value.getHeight()
      const imgWidth = fabricImg.width
      const imgHeight = fabricImg.height

      const scale = Math.min(
        canvasWidth / imgWidth,
        canvasHeight / imgHeight,
        1
      )

      fabricImg.set({
        scaleX: scale,
        scaleY: scale
      })

      const scaledWidth = imgWidth * scale
      const scaledHeight = imgHeight * scale

      fabricImg.set({
        left: (canvasWidth - scaledWidth) / 2,
        top: (canvasHeight - scaledHeight) / 2,
        originX: 'left',
        originY: 'top',
        selectable: false,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true
      })

      canvas.value.add(fabricImg)
      canvas.value.renderAll()

      fabricImage.value = fabricImg
    }
  }

  const enterCropMode = () => {
    cropMode.value = true
    if (fabricImage.value) {
      const imgBounds = fabricImage.value.getBoundingRect()
      // Initialize crop area to 80% of image in the center
      const cropWidth = imgBounds.width * 0.8
      const cropHeight = imgBounds.height * 0.8
      cropArea.value = {
        x: imgBounds.left + (imgBounds.width - cropWidth) / 2,
        y: imgBounds.top + (imgBounds.height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight
      }
    }
  }

  const exitCropMode = () => {
    cropMode.value = false
  }

  const setCropArea = (area: CropArea) => {
    cropArea.value = area
  }

  const applyCrop = async () => {
    if (!fabricImage.value || !canvas.value || !cropArea.value || !hiddenCanvas.value || !hiddenContext.value) return

    const img = fabricImage.value
    const imgBounds = img.getBoundingRect()
    
    // Calculate crop coordinates relative to the preview image
    const relX = (cropArea.value.x - imgBounds.left) / (img.scaleX || 1)
    const relY = (cropArea.value.y - imgBounds.top) / (img.scaleY || 1)
    const relWidth = cropArea.value.width / (img.scaleX || 1)
    const relHeight = cropArea.value.height / (img.scaleY || 1)
    
    // Calculate the scale factor between hidden canvas and preview
    const scaleX = hiddenCanvas.value.width / img.width
    const scaleY = hiddenCanvas.value.height / img.height
    
    // Calculate crop coordinates on the hidden canvas
    const hiddenX = relX * scaleX
    const hiddenY = relY * scaleY
    const hiddenWidth = relWidth * scaleX
    const hiddenHeight = relHeight * scaleY

    // Crop the hidden canvas
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = hiddenWidth
    tempCanvas.height = hiddenHeight
    const ctx = tempCanvas.getContext('2d')

    if (ctx) {
      ctx.drawImage(
        hiddenCanvas.value,
        hiddenX,
        hiddenY,
        hiddenWidth,
        hiddenHeight,
        0,
        0,
        hiddenWidth,
        hiddenHeight
      )

      // Convert to blob and reload
      tempCanvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'cropped.png', { type: 'image/png' })
          await loadImage(file)
          exitCropMode()
        }
      })
    }
  }

  /**
   * Fast, low-quality scaled copy of a source canvas using the native 2D
   * context. Used only for cheap size *estimates* — the committed resize uses
   * pica's Lanczos path via `resizeCanvas`.
   */
  const drawScaledCanvas = (source: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement => {
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    const ctx = c.getContext('2d')
    if (ctx) {
      ctx.imageSmoothingEnabled = true
      ;(ctx as any).imageSmoothingQuality = 'high'
      ctx.drawImage(source, 0, 0, width, height)
    }
    return c
  }

  /** Adopt a freshly-rendered canvas as the new base image (hidden canvas + original ref). */
  const adoptCanvasAsBase = async (rendered: HTMLCanvasElement) => {
    if (!hiddenCanvas.value) {
      hiddenCanvas.value = document.createElement('canvas')
    }
    hiddenCanvas.value.width = rendered.width
    hiddenCanvas.value.height = rendered.height
    hiddenContext.value = hiddenCanvas.value.getContext('2d', { willReadFrequently: true })
    hiddenContext.value?.drawImage(rendered, 0, 0)

    // Keep originalImage in sync so rotation/filter reconstruction works from
    // the resized base instead of the stale full-resolution image.
    const dataUrl = rendered.toDataURL('image/png')
    originalImage.value = await new Promise<HTMLImageElement>((resolveImg, rejectImg) => {
      const image = new Image()
      image.onload = () => resolveImg(image)
      image.onerror = rejectImg
      image.src = dataUrl
    })

    // Resizing bakes in any prior rotation.
    currentRotationAngle.value = 0
    hiddenCanvasWidth.value = rendered.width
    hiddenCanvasHeight.value = rendered.height
  }

  const resize = async (width: number, height: number, maintainAspect: boolean = true) => {
    if (!hiddenCanvas.value || !hiddenContext.value) return
    invalidateExportBlob()

    const { width: finalWidth, height: finalHeight } = computeResizeDimensions({
      srcWidth: hiddenCanvas.value.width,
      srcHeight: hiddenCanvas.value.height,
      targetWidth: width,
      targetHeight: height,
      maintainAspect
    })

    // High-quality Lanczos resample (pica), with a native-draw fallback baked
    // into resizeCanvas itself.
    const resized = await resizeCanvas(hiddenCanvas.value, finalWidth, finalHeight)

    await adoptCanvasAsBase(resized)
    await updatePreviewFromHiddenCanvas()
  }

  /**
   * Compress/resize the working image so its encoded size lands at or under
   * `targetKB`.
   *
   * Strategy (size is monotonic in both quality and scale, so each phase is a
   * binary search rather than the old fixed-step guessing loop):
   *   1. Lossy formats: search ENCODER QUALITY at full resolution first —
   *      cheaper and preserves dimensions.
   *   2. If even the lowest quality overshoots (or PNG, where quality is
   *      irrelevant), search SCALE to shrink dimensions.
   * The chosen result is decoded back into the base image so the preview and
   * subsequent export reflect exactly what was produced.
   */
  const resizeToFileSize = async (targetKB: number, format: string = 'image/jpeg'): Promise<boolean> => {
    if (!hiddenCanvas.value || !hiddenContext.value) return false

    const dims = getCurrentDimensions()
    if (!dims) return false

    const fmt = toEncodeFormat(format)
    const isLossy = fmt !== 'image/png'
    const base = hiddenCanvas.value

    // Render the base at a given scale (1.0 = the base itself, no resampling).
    const renderScaled = async (scale: number): Promise<HTMLCanvasElement> => {
      if (scale >= 0.999) return base
      const w = clampToPositiveInt(dims.width * scale)
      const h = clampToPositiveInt(dims.height * scale)
      return resizeCanvas(base, w, h)
    }

    const sizeKBOf = async (canvas: HTMLCanvasElement, quality: number): Promise<number> => {
      const blob = await encodeCanvas(canvas, fmt, quality)
      return blob ? blob.size / 1024 : Infinity
    }

    let finalScale = 1
    let finalQuality = isLossy ? 0.92 : 1

    if (isLossy) {
      // Phase 1 — quality search at full resolution.
      const qRes = await findLargestParamUnderTarget({
        measure: (q) => sizeKBOf(base, q),
        targetKB,
        min: 0.1,
        max: 0.95
      })

      if (qRes.withinTarget) {
        finalQuality = qRes.param
      } else {
        // Phase 2 — even the lowest quality is too large; shrink dimensions
        // while holding a reasonable quality.
        finalQuality = 0.82
        const sRes = await findLargestParamUnderTarget({
          measure: async (s) => sizeKBOf(await renderScaled(s), finalQuality),
          targetKB,
          min: 0.05,
          max: 1
        })
        finalScale = sRes.param
      }
    } else {
      // PNG: only dimensions move the needle.
      const sRes = await findLargestParamUnderTarget({
        measure: async (s) => sizeKBOf(await renderScaled(s), 1),
        targetKB,
        min: 0.05,
        max: 1
      })
      finalScale = sRes.param
    }

    // Produce the committed result and bake it into the base image.
    const finalCanvas = await renderScaled(finalScale)
    const finalBlob = await encodeCanvas(finalCanvas, fmt, finalQuality)
    if (!finalBlob) return false

    // Decode the chosen blob so the baked-in pixels match what export will
    // produce (including lossy artifacts), then adopt as the new base image.
    const img = await htmlImageFromBlob(finalBlob)
    if (!hiddenCanvas.value) hiddenCanvas.value = document.createElement('canvas')
    hiddenCanvas.value.width = img.width
    hiddenCanvas.value.height = img.height
    hiddenContext.value = hiddenCanvas.value.getContext('2d', { willReadFrequently: true })
    hiddenContext.value?.drawImage(img, 0, 0)
    originalImage.value = img
    currentRotationAngle.value = 0
    hiddenCanvasWidth.value = img.width
    hiddenCanvasHeight.value = img.height

    // Cache the EXACT bytes the search produced. Download serves these verbatim
    // (when the export format matches `fmt`), so the file is exactly this size.
    exportBlob.value = finalBlob
    exportBlobFormat.value = fmt

    await updatePreviewFromHiddenCanvas()
    return true
  }

  const exportImage = async (format: string = 'image/png', quality: number = 1): Promise<Blob | null> => {
    if (!hiddenCanvas.value) return null

    const fmt = toEncodeFormat(format)

    // If a target-file-size operation produced exact bytes in this same format,
    // hand them back unchanged — re-encoding would shift the size.
    if (exportBlob.value && exportBlobFormat.value === fmt) {
      return exportBlob.value
    }

    // Otherwise encode the full-quality hidden canvas through the codec-grade
    // encoder (jSquash for JPEG/WebP, native for PNG).
    return encodeCanvas(hiddenCanvas.value, fmt, quality)
  }

  const downloadImage = async (filename: string, format: string = 'image/png', quality: number = 1) => {
    const blob = await exportImage(format, quality)
    if (!blob) return

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const reset = async () => {
    if (originalImage.value && canvas.value) {
      const blob = await fetch(originalImage.value.src).then(r => r.blob())
      const file = new File([blob], 'original.png', { type: 'image/png' })
      await loadImage(file)
    }
  }

  const getCurrentDimensions = (): ImageDimensions | null => {
    if (!hiddenCanvas.value || hiddenCanvasWidth.value === 0) return null
    
    // Return the reactive dimension refs (DOM properties aren't reactive)
    return {
      width: hiddenCanvasWidth.value,
      height: hiddenCanvasHeight.value
    }
  }

  const getCurrentFileSize = async (format?: string, quality?: number): Promise<number | null> => {
    if (!hiddenCanvas.value) return null
    
    // Use original format if not specified
    const useFormat = format || originalFileFormat.value
    // Use appropriate quality based on format
    const useQuality = quality !== undefined ? quality : (useFormat === 'image/png' ? 1 : 0.92)
    const fmt = toEncodeFormat(useFormat)

    // Mirror exportImage: report the cached target-size bytes so the displayed
    // size matches the downloaded file.
    if (exportBlob.value && exportBlobFormat.value === fmt) {
      return exportBlob.value.size / 1024
    }

    const blob = await encodeCanvas(hiddenCanvas.value, fmt, useQuality)
    return blob ? blob.size / 1024 : null
  }

  const estimateFileSizeForDimensions = async (width: number, height: number, format: string = 'image/png', quality: number = 1): Promise<number | null> => {
    if (!hiddenCanvas.value) return null

    // Estimates use the fast native-draw scale (not pica) — accuracy of the
    // size comes from the encoder, not the resampler, and estimates are called
    // repeatedly during binary search where speed matters.
    const scaled = drawScaledCanvas(hiddenCanvas.value, clampToPositiveInt(width), clampToPositiveInt(height))
    const blob = await encodeCanvas(scaled, toEncodeFormat(format), quality)
    return blob ? blob.size / 1024 : null
  }

  const estimateDimensionsForFileSize = async (targetKB: number, format: string = 'image/jpeg'): Promise<ImageDimensions | null> => {
    if (!fabricImage.value) return null
    
    const currentDims = getCurrentDimensions()
    if (!currentDims) return null
    
    // Start with current dimensions and scale down
    let scaleFactor = 1.0
    let quality = 0.85
    
    // Quick estimation with binary search on scale
    let low = 0.1
    let high = 1.0
    let bestScale = 1.0
    
    for (let i = 0; i < 8; i++) {
      scaleFactor = (low + high) / 2
      const testWidth = Math.round(currentDims.width * scaleFactor)
      const testHeight = Math.round(currentDims.height * scaleFactor)
      
      const estimatedSize = await estimateFileSizeForDimensions(testWidth, testHeight, format, quality)
      
      if (!estimatedSize) break
      
      if (Math.abs(estimatedSize - targetKB) < targetKB * 0.1) {
        bestScale = scaleFactor
        break
      }
      
      if (estimatedSize > targetKB) {
        high = scaleFactor
      } else {
        low = scaleFactor
        bestScale = scaleFactor
      }
    }
    
    return {
      width: Math.round(currentDims.width * bestScale),
      height: Math.round(currentDims.height * bestScale)
    }
  }

  return {
    canvas,
    fabricImage,
    imageLoaded,
    currentFilters,
    cropMode,
    cropArea,
    originalFileFormat,
    originalFileName,
    hiddenCanvasWidth,
    hiddenCanvasHeight,
    initCanvas,
    loadImage,
    rotate,
    setRotation,
    flipHorizontal,
    flipVertical,
    setBrightness,
    setContrast,
    setSaturation,
    toggleGrayscale,
    applyBorder,
    removeBorder,
    enterCropMode,
    exitCropMode,
    setCropArea,
    applyCrop,
    resize,
    resizeToFileSize,
    exportImage,
    downloadImage,
    invalidateExportBlob,
    reset,
    getCurrentDimensions,
    getCurrentFileSize,
    estimateFileSizeForDimensions,
    estimateDimensionsForFileSize
  }
}
