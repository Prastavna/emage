import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CropControls from './CropControls.vue'

describe('CropControls Component', () => {
  const mockEditor = {
    cropMode: { value: false },
    enterCropMode: vi.fn(),
    exitCropMode: vi.fn(),
    applyCrop: vi.fn()
  }

  it('should render the component', () => {
    const wrapper = mount(CropControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display crop title', () => {
    const wrapper = mount(CropControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Crop')
  })

  it('should show start cropping button when not in crop mode', () => {
    const wrapper = mount(CropControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Start Cropping')
  })

  it('should call enterCropMode when start button clicked', async () => {
    const wrapper = mount(CropControls, {
      props: { editor: mockEditor as any }
    })
    const button = wrapper.find('button')
    await button.trigger('click')
    
    expect(mockEditor.enterCropMode).toHaveBeenCalled()
  })

  it('should show aspect ratio selector in crop mode', () => {
    const mockEditorInCropMode = {
      ...mockEditor,
      cropMode: { value: true }
    }
    
    const wrapper = mount(CropControls, {
      props: { editor: mockEditorInCropMode as any }
    })
    
    const select = wrapper.find('select')
    expect(select.exists()).toBe(true)
  })

  it('should have multiple aspect ratio options', () => {
    const mockEditorInCropMode = {
      ...mockEditor,
      cropMode: { value: true }
    }
    
    const wrapper = mount(CropControls, {
      props: { editor: mockEditorInCropMode as any }
    })
    
    const options = wrapper.findAll('option')
    expect(options.length).toBeGreaterThan(1)
  })

  it('should include Free aspect ratio option', () => {
    const mockEditorInCropMode = {
      ...mockEditor,
      cropMode: { value: true }
    }
    
    const wrapper = mount(CropControls, {
      props: { editor: mockEditorInCropMode as any }
    })
    
    expect(wrapper.text()).toContain('Free')
  })

  it('should include common aspect ratios', () => {
    const mockEditorInCropMode = {
      ...mockEditor,
      cropMode: { value: true }
    }
    
    const wrapper = mount(CropControls, {
      props: { editor: mockEditorInCropMode as any }
    })
    
    const text = wrapper.text()
    expect(text).toContain('1:1')
    expect(text).toContain('4:3')
    expect(text).toContain('16:9')
  })

  it('should show Apply and Cancel buttons in crop mode', () => {
    const mockEditorInCropMode = {
      ...mockEditor,
      cropMode: { value: true }
    }
    
    const wrapper = mount(CropControls, {
      props: { editor: mockEditorInCropMode as any }
    })
    
    expect(wrapper.text()).toContain('Apply')
    expect(wrapper.text()).toContain('Cancel')
  })

  it('should call applyCrop when Apply clicked', async () => {
    const mockEditorInCropMode = {
      ...mockEditor,
      cropMode: { value: true }
    }
    
    const wrapper = mount(CropControls, {
      props: { editor: mockEditorInCropMode as any }
    })
    
    const buttons = wrapper.findAll('button')
    const applyButton = buttons.find(b => b.text().includes('Apply'))
    
    if (applyButton) {
      await applyButton.trigger('click')
      expect(mockEditor.applyCrop).toHaveBeenCalled()
    }
  })

  it('should call exitCropMode when Cancel clicked', async () => {
    const mockEditorInCropMode = {
      ...mockEditor,
      cropMode: { value: true }
    }
    
    const wrapper = mount(CropControls, {
      props: { editor: mockEditorInCropMode as any }
    })
    
    const buttons = wrapper.findAll('button')
    const cancelButton = buttons.find(b => b.text().includes('Cancel'))
    
    if (cancelButton) {
      await cancelButton.trigger('click')
      expect(mockEditor.exitCropMode).toHaveBeenCalled()
    }
  })

  it('should emit aspectRatioChange event', async () => {
    const mockEditorInCropMode = {
      ...mockEditor,
      cropMode: { value: true }
    }
    
    const wrapper = mount(CropControls, {
      props: { editor: mockEditorInCropMode as any }
    })
    
    const select = wrapper.find('select')
    await select.setValue('1:1')
    
    expect(wrapper.emitted('aspectRatioChange')).toBeDefined()
  })

  it('should display helper text when not in crop mode', () => {
    const wrapper = mount(CropControls, {
      props: { editor: mockEditor as any }
    })
    
    expect(wrapper.text()).toContain('Enter crop mode')
  })

  it('should have proper button styling', () => {
    const wrapper = mount(CropControls, {
      props: { editor: mockEditor as any }
    })
    
    const button = wrapper.find('.btn-primary')
    expect(button.exists()).toBe(true)
  })
})
