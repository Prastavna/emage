import { ref, shallowRef } from 'vue'
import { Canvas, FabricImage, filters } from 'fabric'

export interface ImageFilters {
  brightness: number
  contrast: number
  saturation: number
  grayscale: boolean
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
          
          // Store original image
          const img = new Image()
          img.onload = () => {
            originalImage.value = img
          }
          img.src = dataUrl
          
          // Load image into Fabric canvas
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
    if (fabricImage.value) {
      const currentAngle = fabricImage.value.angle || 0
      fabricImage.value.rotate(currentAngle + angle)
      canvas.value?.renderAll()
    }
  }

  const setRotation = (angle: number) => {
    if (fabricImage.value) {
      fabricImage.value.rotate(angle)
      canvas.value?.renderAll()
    }
  }

  const flipHorizontal = () => {
    if (fabricImage.value) {
      fabricImage.value.set('flipX', !fabricImage.value.flipX)
      canvas.value?.renderAll()
    }
  }

  const flipVertical = () => {
    if (fabricImage.value) {
      fabricImage.value.set('flipY', !fabricImage.value.flipY)
      canvas.value?.renderAll()
    }
  }

  const applyFilters = () => {
    if (!fabricImage.value) return

    const filterArray: any[] = []

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

    fabricImage.value.filters = filterArray
    fabricImage.value.applyFilters()
    canvas.value?.renderAll()
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
    if (!fabricImage.value || !canvas.value || !cropArea.value) return

    const img = fabricImage.value
    const imgBounds = img.getBoundingRect()
    
    // Calculate crop coordinates relative to the image
    const relX = (cropArea.value.x - imgBounds.left) / (img.scaleX || 1)
    const relY = (cropArea.value.y - imgBounds.top) / (img.scaleY || 1)
    const relWidth = cropArea.value.width / (img.scaleX || 1)
    const relHeight = cropArea.value.height / (img.scaleY || 1)

    // Create a temporary canvas for cropping
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = relWidth
    tempCanvas.height = relHeight
    const ctx = tempCanvas.getContext('2d')

    if (ctx && img._element) {
      ctx.drawImage(
        img._element as CanvasImageSource,
        relX,
        relY,
        relWidth,
        relHeight,
        0,
        0,
        relWidth,
        relHeight
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
    if (!fabricImage.value || !fabricImage.value._element) return

    let newWidth = width
    let newHeight = height

    if (maintainAspect) {
      const aspectRatio = fabricImage.value.width / fabricImage.value.height
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

    // Create a temporary canvas for resizing with actual pixel data
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = Math.round(newWidth)
    tempCanvas.height = Math.round(newHeight)
    const ctx = tempCanvas.getContext('2d')

    if (ctx) {
      // Draw the actual image (not the canvas) at the new size
      ctx.drawImage(
        fabricImage.value._element as CanvasImageSource,
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
      )

      // Convert to blob and reload to actually change the image data
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
    if (!canvas.value || !fabricImage.value) return false

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
      
      // Draw scaled image
      ctx.drawImage(
        canvas.value.getElement(),
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
    
    // Reload the compressed/resized image back into the canvas
    if (blob) {
      const extension = format.split('/')[1]
      const file = new File([blob], `compressed.${extension}`, { type: format })
      await loadImage(file)
      return true
    }
    
    return false
  }

  const exportImage = async (format: string = 'image/png', quality: number = 1): Promise<Blob | null> => {
    if (!canvas.value) return null

    return new Promise((resolve) => {
      canvas.value?.getElement().toBlob(
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
    if (!fabricImage.value) return null
    
    // Return the actual image dimensions (not the scaled display dimensions)
    return {
      width: Math.round(fabricImage.value.width),
      height: Math.round(fabricImage.value.height)
    }
  }

  const getCurrentFileSize = async (format: string = 'image/png', quality: number = 1): Promise<number | null> => {
    if (!canvas.value || !fabricImage.value) return null
    
    // Create a temporary canvas with just the image dimensions (not the canvas display size)
    const tempCanvas = document.createElement('canvas')
    const dims = getCurrentDimensions()
    if (!dims) return null
    
    tempCanvas.width = dims.width
    tempCanvas.height = dims.height
    const ctx = tempCanvas.getContext('2d')
    
    if (!ctx || !fabricImage.value._element) return null
    
    // Draw the actual image at its actual size
    ctx.drawImage(
      fabricImage.value._element as CanvasImageSource,
      0,
      0,
      dims.width,
      dims.height
    )
    
    return new Promise((resolve) => {
      tempCanvas.toBlob((blob) => {
        if (blob) {
          // Return size in KB
          resolve(blob.size / 1024)
        } else {
          resolve(null)
        }
      }, format, quality)
    })
  }

  const estimateFileSizeForDimensions = async (width: number, height: number, format: string = 'image/png', quality: number = 1): Promise<number | null> => {
    if (!fabricImage.value || !fabricImage.value._element) return null
    
    // Create a temporary canvas at target dimensions
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = Math.round(width)
    tempCanvas.height = Math.round(height)
    const ctx = tempCanvas.getContext('2d')
    
    if (!ctx) return null
    
    // Draw the actual image (not the canvas) scaled to target dimensions
    ctx.drawImage(
      fabricImage.value._element as CanvasImageSource,
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
