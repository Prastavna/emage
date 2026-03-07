import { ref, shallowRef } from 'vue'
import { Canvas, FabricImage, filters } from 'fabric'

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
  
  // Track current rotation angle for hidden canvas reconstruction
  const currentRotationAngle = ref(0)
  
  // Store original file info
  const originalFile = ref<File | null>(null)
  const originalFileFormat = ref<string>('image/jpeg')
  const originalFileName = ref<string>('edited-image')

  const initCanvas = (canvasElement: HTMLCanvasElement) => {
    canvas.value = new Canvas(canvasElement, {
      backgroundColor: '#f0f0f0',
      selection: false,
      width: 800,
      height: 600
    })
  }

  const loadImage = async (file: File): Promise<void> => {
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
          
          // Store original image
          const img = new Image()
          img.onload = async () => {
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
          }
          img.src = dataUrl
          
          // Load image into Fabric canvas (for preview)
          const fabricImg = await FabricImage.fromURL(dataUrl)
          
          if (canvas.value) {
            canvas.value.clear()
            
            // Scale image to fit canvas while maintaining aspect ratio
            const maxWidth = 800
            const maxHeight = 600
            const imgWidth = fabricImg.width
            const imgHeight = fabricImg.height
            
            const scale = Math.min(
              maxWidth / imgWidth,
              maxHeight / imgHeight,
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
              left: (maxWidth - scaledWidth) / 2,
              top: (maxHeight - scaledHeight) / 2,
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
    hiddenContext.value = hiddenCanvas.value.getContext('2d', { willReadFrequently: true })
    
    if (hiddenContext.value) {
      hiddenContext.value.drawImage(tempCanvas, 0, 0)
    }

    // Update the preview canvas
    updatePreviewFromHiddenCanvas()
  }

  const removeBorder = () => {
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
      const maxWidth = 800
      const maxHeight = 600
      const imgWidth = fabricImg.width
      const imgHeight = fabricImg.height

      const scale = Math.min(
        maxWidth / imgWidth,
        maxHeight / imgHeight,
        1
      )

      fabricImg.set({
        scaleX: scale,
        scaleY: scale
      })

      const scaledWidth = imgWidth * scale
      const scaledHeight = imgHeight * scale

      fabricImg.set({
        left: (maxWidth - scaledWidth) / 2,
        top: (maxHeight - scaledHeight) / 2,
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

  const resize = async (width: number, height: number, maintainAspect: boolean = true) => {
    if (!hiddenCanvas.value || !hiddenContext.value) return

    let newWidth = width
    let newHeight = height

    if (maintainAspect && hiddenCanvas.value) {
      const aspectRatio = hiddenCanvas.value.width / hiddenCanvas.value.height
      if (width && !height) {
        newHeight = width / aspectRatio
      } else if (height && !width) {
        newWidth = height * aspectRatio
      } else if (width && height) {
        const targetAspect = width / height
        if (aspectRatio > targetAspect) {
          newHeight = width / aspectRatio
        } else {
          newWidth = height * aspectRatio
        }
      }
    }

    // Create a temporary canvas for resizing the hidden canvas
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = Math.round(newWidth)
    tempCanvas.height = Math.round(newHeight)
    const ctx = tempCanvas.getContext('2d')

    if (ctx) {
      // Draw the hidden canvas (which has original quality) at the new size
      ctx.drawImage(
        hiddenCanvas.value,
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
      )

      // Convert to blob and reload to update both canvases
      const blob = await new Promise<Blob | null>(resolve => {
        tempCanvas.toBlob(resolve, 'image/png', 1)
      })

      if (blob) {
        const file = new File([blob], 'resized.png', { type: 'image/png' })
        await loadImage(file)
      }
    }
  }

  const resizeToFileSize = async (targetKB: number, format: string = 'image/jpeg'): Promise<boolean> => {
    if (!hiddenCanvas.value || !hiddenContext.value) return false

    let quality = 0.92
    let scaleFactor = 1.0
    let blob: Blob | null = null
    let currentDims = getCurrentDimensions()
    
    if (!currentDims) return false
    
    // Try compression first, then dimension reduction if needed
    for (let attempt = 0; attempt < 15; attempt++) {
      // Create a temp canvas at current scale
      const tempCanvas = document.createElement('canvas')
      const targetWidth = Math.round(currentDims.width * scaleFactor)
      const targetHeight = Math.round(currentDims.height * scaleFactor)
      
      tempCanvas.width = targetWidth
      tempCanvas.height = targetHeight
      const ctx = tempCanvas.getContext('2d')
      
      if (!ctx) return false
      
      // Draw scaled image from hidden canvas
      ctx.drawImage(
        hiddenCanvas.value,
        0,
        0,
        targetWidth,
        targetHeight
      )
      
      blob = await new Promise<Blob | null>(resolve => {
        tempCanvas.toBlob(resolve, format, quality)
      })
      
      if (!blob) return false
      
      const sizeKB = blob.size / 1024
      
      // Within 5% tolerance is acceptable
      if (Math.abs(sizeKB - targetKB) < targetKB * 0.05 || sizeKB <= targetKB) {
        break
      }
      
      if (sizeKB > targetKB) {
        // Try reducing quality first
        if (quality > 0.3) {
          quality *= 0.85
        } else {
          // If quality is already low, reduce dimensions
          scaleFactor *= 0.92
          quality = 0.85 // Reset quality when changing dimensions
        }
      } else {
        // Size is too small, increase quality or scale
        if (scaleFactor < 1.0 && quality > 0.8) {
          scaleFactor = Math.min(1.0, scaleFactor * 1.05)
        } else {
          quality = Math.min(0.95, quality * 1.05)
        }
      }
    }
    
    // Reload the compressed/resized image back into both canvases
    if (blob) {
      const extension = format.split('/')[1]
      const file = new File([blob], `compressed.${extension}`, { type: format })
      await loadImage(file)
      return true
    }
    
    return false
  }

  const exportImage = async (format: string = 'image/png', quality: number = 1): Promise<Blob | null> => {
    if (!hiddenCanvas.value) return null

    // Export directly from hidden canvas (which has original quality)
    return new Promise((resolve) => {
      hiddenCanvas.value!.toBlob(
        (blob) => resolve(blob),
        format,
        quality
      )
    })
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
    if (!hiddenCanvas.value) return null
    
    // Return the hidden canvas dimensions (actual image dimensions)
    return {
      width: hiddenCanvas.value.width,
      height: hiddenCanvas.value.height
    }
  }

  const getCurrentFileSize = async (format?: string, quality?: number): Promise<number | null> => {
    if (!hiddenCanvas.value) return null
    
    // Use original format if not specified
    const useFormat = format || originalFileFormat.value
    // Use appropriate quality based on format
    const useQuality = quality !== undefined ? quality : (useFormat === 'image/png' ? 1 : 0.92)
    
    // Get file size directly from hidden canvas
    return new Promise((resolve) => {
      hiddenCanvas.value!.toBlob((blob) => {
        if (blob) {
          // Return size in KB
          resolve(blob.size / 1024)
        } else {
          resolve(null)
        }
      }, useFormat, useQuality)
    })
  }

  const estimateFileSizeForDimensions = async (width: number, height: number, format: string = 'image/png', quality: number = 1): Promise<number | null> => {
    if (!hiddenCanvas.value) return null
    
    // Create a temporary canvas at target dimensions
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = Math.round(width)
    tempCanvas.height = Math.round(height)
    const ctx = tempCanvas.getContext('2d')
    
    if (!ctx) return null
    
    // Draw the hidden canvas (original quality) scaled to target dimensions
    ctx.drawImage(
      hiddenCanvas.value,
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    )
    
    return new Promise((resolve) => {
      tempCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob.size / 1024)
        } else {
          resolve(null)
        }
      }, format, quality)
    })
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
    reset,
    getCurrentDimensions,
    getCurrentFileSize,
    estimateFileSizeForDimensions,
    estimateDimensionsForFileSize
  }
}
