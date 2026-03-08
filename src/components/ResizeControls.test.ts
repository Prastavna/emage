import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ResizeControls from './ResizeControls.vue'

describe('ResizeControls Component', () => {
  const mockEditor = {
    resize: vi.fn(),
    resizeToFileSize: vi.fn().mockResolvedValue(true),
    reset: vi.fn().mockResolvedValue(undefined),
    getCurrentDimensions: vi.fn().mockReturnValue({ width: 1000, height: 800 }),
    getCurrentFileSize: vi.fn().mockResolvedValue(250.5),
    estimateFileSizeForDimensions: vi.fn().mockResolvedValue(200),
    estimateDimensionsForFileSize: vi.fn().mockResolvedValue({ width: 900, height: 720 }),
    imageLoaded: { value: true },
    hiddenCanvasWidth: { value: 1000 },
    hiddenCanvasHeight: { value: 800 }
  }

  it('should render the component', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display resize title', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Resize')
  })

  it('should render mode tabs', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Dimensions')
    expect(wrapper.text()).toContain('Target Size')
  })

  it('should show dimensions mode by default', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs[0]!.classes()).toContain('tab-active')
  })

  it('should render width input in dimensions mode', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    const inputs = wrapper.findAll('input[type="number"]')
    expect(inputs.length).toBe(2)
    expect(wrapper.text()).toContain('Width')
  })

  it('should render height input in dimensions mode', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Height')
  })

  it('should render lock aspect ratio checkbox', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.exists()).toBe(true)
    expect(wrapper.text()).toContain('Lock aspect ratio')
  })

  it('should initialize width and height from current dimensions', async () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    await wrapper.vm.$nextTick()

    const inputs = wrapper.findAll('input[type="number"]')
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('1000')
    expect((inputs[1]!.element as HTMLInputElement).value).toBe('800')
  })

  it('should switch to target size mode', async () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    
    const tabs = wrapper.findAll('[role="tab"]')
    await tabs[1]!.trigger('click')
    
    expect(wrapper.text()).toContain('Target Size (KB)')
  })

  it('should render target size input in filesize mode', async () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    
    const tabs = wrapper.findAll('[role="tab"]')
    await tabs[1]!.trigger('click')
    
    const inputs = wrapper.findAll('input[type="number"]')
    expect(inputs.length).toBe(1)
  })

  it('should not have an Apply Resize button', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    const buttons = wrapper.findAll('button')
    const applyButton = buttons.find(b => b.text().includes('Apply Resize'))
    expect(applyButton).toBeUndefined()
  })

  it('should not display dimension preview alerts', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.find('.alert-info').exists()).toBe(false)
    expect(wrapper.find('.alert-success').exists()).toBe(false)
  })

  it('should have reset button in dimensions mode', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    const buttons = wrapper.findAll('button')
    const resetButton = buttons.find(b => b.classes().includes('btn-ghost'))
    expect(resetButton).toBeDefined()
  })

  it('should have reset button in filesize mode', async () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })

    const tabs = wrapper.findAll('[role="tab"]')
    await tabs[1]!.trigger('click')

    expect(wrapper.text()).toContain('Reset to original')
  })

  it('should display width label with px unit', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Width (px)')
  })

  it('should display height label with px unit', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Height (px)')
  })

  it('should display KB in target size mode', async () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })

    const tabs = wrapper.findAll('[role="tab"]')
    await tabs[1]!.trigger('click')

    expect(wrapper.text()).toContain('KB')
  })

  it('should have lock aspect ratio checked by default', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
  })
})
