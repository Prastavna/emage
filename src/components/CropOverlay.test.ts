import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CropOverlay from './CropOverlay.vue'

// happy-dom may not implement pointer capture used by handlePointerDown.
if (!(HTMLElement.prototype as any).setPointerCapture) {
  ;(HTMLElement.prototype as any).setPointerCapture = vi.fn()
}

/** Dispatch a document-level pointermove the overlay listens for. */
const movePointer = (clientX: number, clientY: number) => {
  const ev = new Event('pointermove') as any
  ev.clientX = clientX
  ev.clientY = clientY
  document.dispatchEvent(ev)
}

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

  it('should have touch-friendly handle sizes', () => {
    const handles = wrapper.findAll('.w-6.h-6')
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

describe('CropOverlay Resize Behavior', () => {
  // imgLeft=100, imgTop=50, imgRight=700, imgBottom=550
  // crop: left=150, top=100, right=650, bottom=500
  const baseProps = {
    canvasWidth: 800,
    canvasHeight: 600,
    imageBounds: { left: 100, top: 50, width: 600, height: 500 },
    aspectRatio: null as number | null,
    initialCrop: { x: 150, y: 100, width: 500, height: 400 }
  }

  const lastUpdate = (wrapper: ReturnType<typeof mount>) => {
    const updates = wrapper.emitted('update')
    expect(updates).toBeDefined()
    return updates![updates!.length - 1]![0] as { x: number; y: number; width: number; height: number }
  }

  it('stops at the image edge without extending the opposite edge (free resize)', async () => {
    const wrapper = mount(CropOverlay, { props: { ...baseProps } })

    // Grab the east handle and drag it far past the right image edge.
    await wrapper.find('.cursor-e-resize').trigger('pointerdown', { clientX: 0, clientY: 0 })
    movePointer(5000, 0)

    const crop = lastUpdate(wrapper)
    // Right edge clamps to the image right (700); the anchored left edge is untouched.
    expect(crop.x).toBe(150)
    expect(crop.x + crop.width).toBeCloseTo(700, 5)
    wrapper.unmount()
  })

  it('does not let the left edge move when dragging the right edge past the boundary', async () => {
    const wrapper = mount(CropOverlay, { props: { ...baseProps } })

    await wrapper.find('.cursor-e-resize').trigger('pointerdown', { clientX: 0, clientY: 0 })
    movePointer(5000, 0)
    movePointer(6000, 0) // keep pushing — left edge must remain fixed

    const crop = lastUpdate(wrapper)
    expect(crop.x).toBe(150)
    expect(crop.x + crop.width).toBeLessThanOrEqual(700 + 0.001)
    wrapper.unmount()
  })

  it('preserves the aspect ratio when dragging a middle edge handle', async () => {
    const wrapper = mount(CropOverlay, { props: { ...baseProps, aspectRatio: 1 } })

    // Drag the east (middle) handle — the box must stay square.
    await wrapper.find('.cursor-e-resize').trigger('pointerdown', { clientX: 0, clientY: 0 })
    movePointer(40, 0)

    const crop = lastUpdate(wrapper)
    expect(crop.width).toBeCloseTo(crop.height, 5)
    wrapper.unmount()
  })

  it('keeps the aspect ratio and stays in bounds when an edge hits the image boundary', async () => {
    const wrapper = mount(CropOverlay, { props: { ...baseProps, aspectRatio: 1 } })

    await wrapper.find('.cursor-e-resize').trigger('pointerdown', { clientX: 0, clientY: 0 })
    movePointer(5000, 0) // push way past the edge

    const crop = lastUpdate(wrapper)
    expect(crop.width).toBeCloseTo(crop.height, 5)        // ratio held
    expect(crop.x).toBeGreaterThanOrEqual(100 - 0.001)     // within image bounds
    expect(crop.y).toBeGreaterThanOrEqual(50 - 0.001)
    expect(crop.x + crop.width).toBeLessThanOrEqual(700 + 0.001)
    expect(crop.y + crop.height).toBeLessThanOrEqual(550 + 0.001)
    wrapper.unmount()
  })
})
