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

export function useImageEditor() {
  const canvas = shallowRef<Canvas | null>(null)
  const fabricImage = shallowRef<FabricImage | null>(null)
  const originalImage = shallowRef<HTMLImageElement | null>(null)
  const imageLoaded = ref(false)
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
    console.log('Canvas initialized:', canvas.value)
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
          
          console.log('FabricImage created:', fabricImg)
          console.log('Image dimensions:', fabricImg.width, fabricImg.height)
          
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
            
            console.log('Scale factor:', scale)
            
            const scaledWidth = imgWidth * scale
            const scaledHeight = imgHeight * scale
            
            fabricImg.scale(scale)
            fabricImg.set({
              left: (maxWidth - scaledWidth) / 2,
              top: (maxHeight - scaledHeight) / 2,
              selectable: true,
              hasControls: true
            })
            
            canvas.value.add(fabricImg)
            canvas.value.setActiveObject(fabricImg)
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
            
            console.log('Image loaded successfully', canvas.value)
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

  const crop = () => {
    if (!fabricImage.value || !canvas.value) return

    const obj = fabricImage.value
    const cropX = (obj.cropX || 0)
    const cropY = (obj.cropY || 0)
    const cropWidth = obj.width * (obj.scaleX || 1)
    const cropHeight = obj.height * (obj.scaleY || 1)

    // Create a new canvas for cropping
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = cropWidth
    tempCanvas.height = cropHeight
    const ctx = tempCanvas.getContext('2d')

    if (ctx && obj._element) {
      ctx.drawImage(
        obj._element as CanvasImageSource,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      )

      tempCanvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'cropped.png', { type: 'image/png' })
          await loadImage(file)
        }
      })
    }
  }

  const resize = async (width: number, height: number, maintainAspect: boolean = true) => {
    if (!fabricImage.value) return

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

    const scaleX = newWidth / fabricImage.value.width
    const scaleY = newHeight / fabricImage.value.height

    fabricImage.value.scale(maintainAspect ? scaleX : scaleX)
    if (!maintainAspect) {
      fabricImage.value.scaleY = scaleY
    }
    
    canvas.value?.renderAll()
  }

  const resizeToFileSize = async (targetKB: number, format: string = 'image/jpeg'): Promise<boolean> => {
    if (!canvas.value) return false

    let quality = 0.9
    let blob: Blob | null = null
    
    // Binary search for the right quality
    for (let i = 0; i < 10; i++) {
      blob = await new Promise<Blob | null>(resolve => {
        canvas.value?.getElement().toBlob(resolve, format, quality)
      })
      
      if (!blob) return false
      
      const sizeKB = blob.size / 1024
      
      if (Math.abs(sizeKB - targetKB) < targetKB * 0.05) {
        break
      }
      
      if (sizeKB > targetKB) {
        quality *= 0.9
      } else {
        quality = Math.min(1, quality * 1.1)
      }
    }
    
    return true
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
    
    return {
      width: Math.round(fabricImage.value.width * (fabricImage.value.scaleX || 1)),
      height: Math.round(fabricImage.value.height * (fabricImage.value.scaleY || 1))
    }
  }

  return {
    canvas,
    fabricImage,
    imageLoaded,
    currentFilters,
    initCanvas,
    loadImage,
    rotate,
    setBrightness,
    setContrast,
    setSaturation,
    toggleGrayscale,
    crop,
    resize,
    resizeToFileSize,
    exportImage,
    downloadImage,
    reset,
    getCurrentDimensions
  }
}
