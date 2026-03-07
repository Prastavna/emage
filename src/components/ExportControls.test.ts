import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ExportControls from './ExportControls.vue'

describe('ExportControls Component', () => {
  const mockEditor = {
    downloadImage: vi.fn(),
    imageLoaded: { value: true },
    originalFileFormat: { value: 'image/jpeg' }
  }

  it('should render the component', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display export title', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Export')
  })

  it('should render filename input', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    const input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(true)
  })

  it('should have default filename placeholder', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    const input = wrapper.find('input[type="text"]')
    expect(input.attributes('placeholder')).toBe('my-image')
  })

  it('should render format selector', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    const select = wrapper.find('select')
    expect(select.exists()).toBe(true)
  })

  it('should have PNG, JPEG, and WebP format options', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    const options = wrapper.findAll('option')
    const values = options.map(o => o.element.value)
    
    expect(values).toContain('image/png')
    expect(values).toContain('image/jpeg')
    expect(values).toContain('image/webp')
  })

  it('should render quality slider for JPEG', async () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    
    const select = wrapper.find('select')
    await select.setValue('image/jpeg')
    
    const slider = wrapper.find('input[type="range"]')
    expect(slider.exists()).toBe(true)
  })

  it('should not show quality slider for PNG', async () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    
    const select = wrapper.find('select')
    await select.setValue('image/png')
    await wrapper.vm.$nextTick()
    
    const slider = wrapper.find('input[type="range"]')
    expect(slider.exists()).toBe(false)
  })

  it('should render quality slider for WebP', async () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    
    const select = wrapper.find('select')
    await select.setValue('image/webp')
    await wrapper.vm.$nextTick()
    
    const slider = wrapper.find('input[type="range"]')
    expect(slider.exists()).toBe(true)
  })

  it('should have quality slider with correct range', async () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    
    const select = wrapper.find('select')
    await select.setValue('image/jpeg')
    await wrapper.vm.$nextTick()
    
    const slider = wrapper.find('input[type="range"]')
    expect(slider.attributes('min')).toBe('0.1')
    expect(slider.attributes('max')).toBe('1')
    expect(slider.attributes('step')).toBe('0.05')
  })

  it('should render download button', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    const button = wrapper.find('button')
    expect(button.text()).toContain('Download Image')
  })

  it('should call downloadImage when download button clicked', async () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    const button = wrapper.find('button')
    await button.trigger('click')
    
    expect(mockEditor.downloadImage).toHaveBeenCalled()
  })

  it('should display quality percentage', async () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    
    const select = wrapper.find('select')
    await select.setValue('image/jpeg')
    await wrapper.vm.$nextTick()
    
    const badge = wrapper.find('.badge')
    expect(badge.text()).toMatch(/\d+%/)
  })

  it('should have proper labels', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    
    expect(wrapper.text()).toContain('Filename')
    expect(wrapper.text()).toContain('Format')
  })

  it('should have success button styling for download', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    const button = wrapper.find('.btn-success')
    expect(button.exists()).toBe(true)
  })

  it('should allow filename input', async () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    const input = wrapper.find('input[type="text"]')
    
    await input.setValue('my-custom-image')
    expect((input.element as HTMLInputElement).value).toBe('my-custom-image')
  })

  it('should show quality labels', async () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    
    const select = wrapper.find('select')
    await select.setValue('image/jpeg')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Quality')
    expect(wrapper.text()).toContain('Lower')
    expect(wrapper.text()).toContain('Higher')
  })
})
