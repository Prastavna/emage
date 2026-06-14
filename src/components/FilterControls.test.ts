import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterControls from './FilterControls.vue'

describe('FilterControls Component', () => {
  const mockEditor = {
    setBrightness: vi.fn(),
    setContrast: vi.fn(),
    setSaturation: vi.fn(),
    toggleGrayscale: vi.fn(),
    toggleSepia: vi.fn(),
    toggleInvert: vi.fn(),
    setHue: vi.fn(),
    setPreset: vi.fn(),
    resetSignal: { value: 0 },
    currentFilters: {
      value: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        grayscale: false,
        sepia: false,
        invert: false,
        hue: 0,
        preset: ''
      }
    }
  }

  it('should render the component', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display filters title', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Filters')
  })

  it('should render brightness slider', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Brightness')
    const sliders = wrapper.findAll('input[type="range"]')
    expect(sliders.length).toBeGreaterThan(0)
  })

  it('should render contrast slider', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Contrast')
  })

  it('should render saturation slider', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Saturation')
  })

  it('should render grayscale toggle', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.exists()).toBe(true)
    expect(wrapper.text()).toContain('Black & White')
  })

  it('should have brightness/contrast/saturation sliders with correct range', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    // The first three sliders are the -1..1 adjustment sliders (Hue uses a
    // degree-based range and is asserted separately).
    const sliders = wrapper.findAll('input[type="range"]').slice(0, 3)

    sliders.forEach(slider => {
      expect(slider.attributes('min')).toBe('-1')
      expect(slider.attributes('max')).toBe('1')
      expect(slider.attributes('step')).toBe('0.01')
    })
  })

  it('should render preset look buttons', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Presets')
    expect(wrapper.text()).toContain('Vintage')
    expect(wrapper.text()).toContain('Polaroid')
  })

  it('should render sepia and invert toggles', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Sepia')
    expect(wrapper.text()).toContain('Invert Colors')
  })

  it('should render a hue slider with degree range', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Hue')
    const hueSlider = wrapper.findAll('input[type="range"]').find(s => s.attributes('max') === '180')
    expect(hueSlider).toBeDefined()
    expect(hueSlider!.attributes('min')).toBe('-180')
  })

  it('should call setPreset when a preset is selected', async () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    const vintageBtn = wrapper.findAll('button').find(b => b.text() === 'Vintage')
    await vintageBtn!.trigger('click')
    expect(mockEditor.setPreset).toHaveBeenCalledWith('vintage')
  })

  it('should display brightness value badge', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    const badges = wrapper.findAll('.badge')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('should display contrast value badge', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toMatch(/Contrast/)
  })

  it('should display saturation value badge', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toMatch(/Saturation/)
  })

  it('should render reset button', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    const buttons = wrapper.findAll('button')
    const resetButton = buttons.find(b => b.text().includes('Reset'))
    expect(resetButton).toBeDefined()
  })

  it('should have labels for slider ranges', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Dark')
    expect(wrapper.text()).toContain('Bright')
    expect(wrapper.text()).toContain('Low')
    expect(wrapper.text()).toContain('High')
    expect(wrapper.text()).toContain('Desaturated')
    expect(wrapper.text()).toContain('Vibrant')
  })

  it('should show Normal labels', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    const normalLabels = wrapper.text().match(/Normal/g)
    expect(normalLabels).toBeDefined()
    expect(normalLabels!.length).toBeGreaterThan(2)
  })

  it('should render dividers', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    const dividers = wrapper.findAll('.divider')
    expect(dividers.length).toBeGreaterThan(0)
  })

  it('should have grayscale toggle with proper styling', () => {
    const wrapper = mount(FilterControls, {
      props: { editor: mockEditor as any }
    })
    const toggle = wrapper.find('.toggle')
    expect(toggle.exists()).toBe(true)
    expect(toggle.classes()).toContain('toggle-primary')
  })
})
