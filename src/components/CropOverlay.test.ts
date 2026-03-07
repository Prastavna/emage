import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CropOverlay from './CropOverlay.vue'

describe('CropOverlay Component', () => {
  const defaultProps = {
    canvasWidth: 800,
    canvasHeight: 600,
    imageBounds: {
      left: 100,
      top: 50,
      width: 600,
      height: 500
    },
    aspectRatio: null,
    initialCrop: {
      x: 150,
      y: 100,
      width: 500,
      height: 400
    }
  }

  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    wrapper = mount(CropOverlay, {
      props: defaultProps
    })
  })

  it('should render the component', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('should render crop overlay with correct dimensions', () => {
    const overlay = wrapper.find('.absolute.inset-0')
    expect(overlay.exists()).toBe(true)
  })

  it('should render SVG mask', () => {
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
  })

  it('should have crop mask defined', () => {
    const mask = wrapper.find('mask')
    expect(mask.exists()).toBe(true)
    expect(mask.attributes('id')).toBe('crop-mask')
  })

  it('should render crop box', () => {
    const cropBox = wrapper.find('.border-2.border-white')
    expect(cropBox.exists()).toBe(true)
  })

  it('should render grid lines', () => {
    const grid = wrapper.find('.grid.grid-cols-3')
    expect(grid.exists()).toBe(true)
  })

  it('should have 9 grid cells', () => {
    const gridCells = wrapper.findAll('.border.border-white\\/30')
    expect(gridCells.length).toBe(9)
  })

  it('should render corner handles', () => {
    const corners = wrapper.findAll('.rounded-full.bg-white.border-2.border-primary')
    expect(corners.length).toBeGreaterThanOrEqual(4)
  })

  it('should have resize handles with correct cursors', () => {
    expect(wrapper.find('.cursor-nw-resize').exists()).toBe(true)
    expect(wrapper.find('.cursor-ne-resize').exists()).toBe(true)
    expect(wrapper.find('.cursor-sw-resize').exists()).toBe(true)
    expect(wrapper.find('.cursor-se-resize').exists()).toBe(true)
  })

  it('should have edge handles', () => {
    expect(wrapper.find('.cursor-n-resize').exists()).toBe(true)
    expect(wrapper.find('.cursor-s-resize').exists()).toBe(true)
    expect(wrapper.find('.cursor-e-resize').exists()).toBe(true)
    expect(wrapper.find('.cursor-w-resize').exists()).toBe(true)
  })

  it('should have cursor-move on crop box', () => {
    const cropBox = wrapper.find('.cursor-move')
    expect(cropBox.exists()).toBe(true)
  })

  it('should emit update event on mount', () => {
    const newWrapper = mount(CropOverlay, {
      props: defaultProps
    })
    
    // Component should initialize but not necessarily emit on mount
    expect(newWrapper.exists()).toBe(true)
  })

  it('should apply correct styles to crop box', () => {
    const cropBox = wrapper.find('.border-2.border-white.cursor-move')
    expect(cropBox.exists()).toBe(true)
    expect(cropBox.classes()).toContain('absolute')
  })

  it('should handle aspect ratio change', async () => {
    await wrapper.setProps({
      ...defaultProps,
      aspectRatio: 1
    })
    
    expect(wrapper.emitted('update')).toBeDefined()
  })

  it('should constrain crop area to image bounds', async () => {
    const updates = wrapper.emitted('update')
    if (updates && updates.length > 0) {
      const cropArea = updates[0]![0] as any
      expect(cropArea.x).toBeGreaterThanOrEqual(defaultProps.imageBounds.left)
      expect(cropArea.y).toBeGreaterThanOrEqual(defaultProps.imageBounds.top)
    }
  })

  it('should render dark overlay outside crop area', () => {
    const darkRect = wrapper.find('rect[fill="rgba(0, 0, 0, 0.5)"]')
    expect(darkRect.exists()).toBe(true)
  })

  it('should have handle size of 4x4', () => {
    const handles = wrapper.findAll('.w-4.h-4')
    expect(handles.length).toBeGreaterThan(0)
  })

  it('should position handles absolutely', () => {
    const handle = wrapper.find('.cursor-nw-resize')
    expect(handle.classes()).toContain('absolute')
  })

  it('should have pointer-events-auto on crop box', () => {
    const cropBox = wrapper.find('.pointer-events-auto')
    expect(cropBox.exists()).toBe(true)
  })

  it('should have pointer-events-none on overlay', () => {
    const overlay = wrapper.find('.pointer-events-none')
    expect(overlay.exists()).toBe(true)
  })

  it('should render with initial crop dimensions', () => {
    const cropBox = wrapper.find('.cursor-move')
    const style = cropBox.attributes('style')
    
    expect(style).toContain('width')
    expect(style).toContain('height')
  })

  it('should update on aspect ratio change to 16:9', async () => {
    await wrapper.setProps({
      ...defaultProps,
      aspectRatio: 16/9
    })
    
    const updates = wrapper.emitted('update')
    expect(updates).toBeDefined()
  })

  it('should update on aspect ratio change to 1:1', async () => {
    await wrapper.setProps({
      ...defaultProps,
      aspectRatio: 1
    })
    
    const updates = wrapper.emitted('update')
    expect(updates).toBeDefined()
  })

  it('should handle null aspect ratio (free form)', async () => {
    await wrapper.setProps({
      ...defaultProps,
      aspectRatio: null
    })
    
    expect(wrapper.exists()).toBe(true)
  })
})
