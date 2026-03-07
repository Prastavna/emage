import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useImageEditor } from './useImageEditor'
import type { ImageFilters, CropArea, ImageDimensions } from './useImageEditor'

// Mock Fabric.js
vi.mock('fabric', () => {
  const CanvasMock = vi.fn(function(this: any) {
    this.clear = vi.fn()
    this.add = vi.fn()
    this.renderAll = vi.fn()
    this.selection = false
    this.width = 800
    this.height = 600
    return this
  })
  
  return {
    Canvas: CanvasMock,
    FabricImage: {
      fromURL: vi.fn().mockResolvedValue({
        width: 1000,
        height: 800,
        angle: 0,
        flipX: false,
        flipY: false,
        scaleX: 1,
        scaleY: 1,
        filters: [],
        set: vi.fn(),
        rotate: vi.fn(),
        applyFilters: vi.fn(),
        getBoundingRect: vi.fn().mockReturnValue({
          left: 100,
          top: 50,
          width: 800,
          height: 640
        })
      })
    },
    filters: {
      Brightness: vi.fn().mockImplementation((opts: any) => ({ brightness: opts.brightness })),
      Contrast: vi.fn().mockImplementation((opts: any) => ({ contrast: opts.contrast })),
      Saturation: vi.fn().mockImplementation((opts: any) => ({ saturation: opts.saturation })),
      Grayscale: vi.fn().mockImplementation(() => ({ grayscale: true }))
    }
  }
})

describe('useImageEditor Composable', () => {
  let editor: ReturnType<typeof useImageEditor>
  
  beforeEach(() => {
    editor = useImageEditor()
  })

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(editor.canvas.value).toBeNull()
      expect(editor.fabricImage.value).toBeNull()
      expect(editor.imageLoaded.value).toBe(false)
      expect(editor.cropMode.value).toBe(false)
    })

    it('should have default filter values', () => {
      expect(editor.currentFilters.value).toEqual({
        brightness: 0,
        contrast: 0,
        saturation: 0,
        grayscale: false
      })
    })

    it('should initialize canvas', () => {
      const mockCanvas = document.createElement('canvas')
      editor.initCanvas(mockCanvas)
      
      expect(editor.canvas.value).not.toBeNull()
    })
  })

  describe('Filter Functions', () => {
    it('should update brightness value', () => {
      editor.setBrightness(0.5)
      expect(editor.currentFilters.value.brightness).toBe(0.5)
    })

    it('should update contrast value', () => {
      editor.setContrast(0.3)
      expect(editor.currentFilters.value.contrast).toBe(0.3)
    })

    it('should update saturation value', () => {
      editor.setSaturation(-0.5)
      expect(editor.currentFilters.value.saturation).toBe(-0.5)
    })

    it('should toggle grayscale', () => {
      editor.toggleGrayscale(true)
      expect(editor.currentFilters.value.grayscale).toBe(true)
      
      editor.toggleGrayscale(false)
      expect(editor.currentFilters.value.grayscale).toBe(false)
    })

    it('should apply multiple filters', () => {
      editor.setBrightness(0.2)
      editor.setContrast(0.1)
      editor.setSaturation(0.3)
      editor.toggleGrayscale(true)
      
      expect(editor.currentFilters.value).toEqual({
        brightness: 0.2,
        contrast: 0.1,
        saturation: 0.3,
        grayscale: true
      })
    })
  })

  describe('Crop Mode', () => {
    it('should enter crop mode', () => {
      editor.cropMode.value = false
      editor.enterCropMode()
      expect(editor.cropMode.value).toBe(true)
    })

    it('should exit crop mode', () => {
      editor.cropMode.value = true
      editor.exitCropMode()
      expect(editor.cropMode.value).toBe(false)
    })

    it('should set crop area', () => {
      const cropArea: CropArea = {
        x: 50,
        y: 50,
        width: 500,
        height: 400
      }
      
      editor.setCropArea(cropArea)
      expect(editor.cropArea.value).toEqual(cropArea)
    })
  })

  describe('File Format', () => {
    it('should have default file format', () => {
      expect(editor.originalFileFormat.value).toBe('image/jpeg')
    })
  })

  describe('Public API Methods', () => {
    it('should expose all required methods', () => {
      expect(typeof editor.initCanvas).toBe('function')
      expect(typeof editor.loadImage).toBe('function')
      expect(typeof editor.rotate).toBe('function')
      expect(typeof editor.setRotation).toBe('function')
      expect(typeof editor.flipHorizontal).toBe('function')
      expect(typeof editor.flipVertical).toBe('function')
      expect(typeof editor.setBrightness).toBe('function')
      expect(typeof editor.setContrast).toBe('function')
      expect(typeof editor.setSaturation).toBe('function')
      expect(typeof editor.toggleGrayscale).toBe('function')
      expect(typeof editor.enterCropMode).toBe('function')
      expect(typeof editor.exitCropMode).toBe('function')
      expect(typeof editor.setCropArea).toBe('function')
      expect(typeof editor.applyCrop).toBe('function')
      expect(typeof editor.resize).toBe('function')
      expect(typeof editor.resizeToFileSize).toBe('function')
      expect(typeof editor.exportImage).toBe('function')
      expect(typeof editor.downloadImage).toBe('function')
      expect(typeof editor.reset).toBe('function')
      expect(typeof editor.getCurrentDimensions).toBe('function')
      expect(typeof editor.getCurrentFileSize).toBe('function')
      expect(typeof editor.estimateFileSizeForDimensions).toBe('function')
      expect(typeof editor.estimateDimensionsForFileSize).toBe('function')
    })
  })

  describe('TypeScript Interfaces', () => {
    it('should match ImageFilters interface', () => {
      const filters: ImageFilters = {
        brightness: 0.5,
        contrast: 0.3,
        saturation: -0.2,
        grayscale: true
      }
      
      expect(filters).toHaveProperty('brightness')
      expect(filters).toHaveProperty('contrast')
      expect(filters).toHaveProperty('saturation')
      expect(filters).toHaveProperty('grayscale')
    })

    it('should match ImageDimensions interface', () => {
      const dimensions: ImageDimensions = {
        width: 1920,
        height: 1080
      }
      
      expect(dimensions).toHaveProperty('width')
      expect(dimensions).toHaveProperty('height')
    })

    it('should match CropArea interface', () => {
      const cropArea: CropArea = {
        x: 100,
        y: 50,
        width: 800,
        height: 600
      }
      
      expect(cropArea).toHaveProperty('x')
      expect(cropArea).toHaveProperty('y')
      expect(cropArea).toHaveProperty('width')
      expect(cropArea).toHaveProperty('height')
    })
  })

  describe('Edge Cases', () => {
    it('should handle getCurrentDimensions when no image loaded', () => {
      const dims = editor.getCurrentDimensions()
      expect(dims).toBeNull()
    })

    it('should handle exportImage when no image loaded', async () => {
      const blob = await editor.exportImage('image/png', 1)
      expect(blob).toBeNull()
    })

    it('should handle getCurrentFileSize when no image loaded', async () => {
      const size = await editor.getCurrentFileSize()
      expect(size).toBeNull()
    })

    it('should handle estimateFileSizeForDimensions when no image loaded', async () => {
      const size = await editor.estimateFileSizeForDimensions(800, 600, 'image/png', 1)
      expect(size).toBeNull()
    })

    it('should handle estimateDimensionsForFileSize when no image loaded', async () => {
      const dims = await editor.estimateDimensionsForFileSize(100, 'image/jpeg')
      expect(dims).toBeNull()
    })
  })
})
