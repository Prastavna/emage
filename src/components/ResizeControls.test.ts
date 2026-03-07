import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ResizeControls from './ResizeControls.vue'

describe('ResizeControls Component', () => {
  const mockEditor = {
    resize: vi.fn(),
    getCurrentDimensions: vi.fn().mockReturnValue({ width: 1000, height: 800 }),
    getCurrentFileSize: vi.fn().mockResolvedValue(250.5),
    estimateFileSizeForDimensions: vi.fn().mockResolvedValue(200),
    estimateDimensionsForFileSize: vi.fn().mockResolvedValue({ width: 900, height: 720 }),
    imageLoaded: { value: true }
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

  it('should render width input', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    const inputs = wrapper.findAll('input[type="number"]')
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('should render height input', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Height')
  })

  it('should render target size input', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Target Size')
  })

  it('should render lock aspect ratio checkbox', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.exists()).toBe(true)
    expect(wrapper.text()).toContain('Lock aspect ratio')
  })

  it('should display current dimensions', async () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('1000')
    expect(wrapper.text()).toContain('800')
  })

  it('should display current file size', async () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toMatch(/File Size/)
  })

  it('should render apply resize button', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    const button = wrapper.find('button.btn-primary')
    expect(button.text()).toContain('Apply Resize')
  })

  it('should call resize when apply button clicked', async () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    
    const inputs = wrapper.findAll('input[type="number"]')
    if (inputs.length >= 2) {
      await inputs[0]!.setValue('800')
      await inputs[1]!.setValue('600')
    }
    
    const button = wrapper.find('button.btn-primary')
    await button.trigger('click')
    
    expect(mockEditor.resize).toHaveBeenCalled()
  })

  it('should have reset button', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    const buttons = wrapper.findAll('button')
    const resetButton = buttons.find(b => b.classes().includes('btn-ghost'))
    expect(resetButton).toBeDefined()
  })

  it('should display width label', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Width')
  })

  it('should display target size in KB', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('KB')
  })

  it('should show info alert for dimensions', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    const alert = wrapper.find('.alert-info')
    expect(alert.exists()).toBe(true)
  })

  it('should show success alert for file size', async () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    const alert = wrapper.find('.alert-success')
    expect(alert.exists()).toBe(true)
  })

  it('should have numeric inputs with placeholders', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    const inputs = wrapper.findAll('input[type="number"]')
    expect(inputs.length).toBeGreaterThan(2)
  })

  it('should display pixel unit', () => {
    const wrapper = mount(ResizeControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('px')
  })
})
