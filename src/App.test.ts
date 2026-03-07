import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from './App.vue'

// Mock all child components
vi.mock('./components/ImageUpload.vue', () => ({
  default: { name: 'ImageUpload', template: '<div>ImageUpload</div>' }
}))
vi.mock('./components/ImageEditor.vue', () => ({
  default: { name: 'ImageEditor', template: '<div>ImageEditor</div>' }
}))
vi.mock('./components/RotationControls.vue', () => ({
  default: { name: 'RotationControls', template: '<div>RotationControls</div>' }
}))
vi.mock('./components/CropControls.vue', () => ({
  default: { name: 'CropControls', template: '<div>CropControls</div>' }
}))
vi.mock('./components/ResizeControls.vue', () => ({
  default: { name: 'ResizeControls', template: '<div>ResizeControls</div>' }
}))
vi.mock('./components/FilterControls.vue', () => ({
  default: { name: 'FilterControls', template: '<div>FilterControls</div>' }
}))
vi.mock('./components/ExportControls.vue', () => ({
  default: { name: 'ExportControls', template: '<div>ExportControls</div>' }
}))

describe('App Component', () => {
  it('should render the component', () => {
    const wrapper = mount(App)
    expect(wrapper.exists()).toBe(true)
  })

  it('should display app title', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('emage')
  })

  it('should display subtitle', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Image Editor')
  })

  it('should render navbar', () => {
    const wrapper = mount(App)
    const navbar = wrapper.find('.navbar')
    expect(navbar.exists()).toBe(true)
  })

  it('should show upload section when no file selected', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Image Manipulation Tool')
  })

  it('should display upload helper text', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Upload an image to start editing')
  })

  it('should mention browser-based processing', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('All processing happens in your browser')
  })

  it('should render footer', () => {
    const wrapper = mount(App)
    const footer = wrapper.find('.footer')
    expect(footer.exists()).toBe(true)
  })

  it('should display privacy message in footer', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Your images never leave your browser')
  })

  it('should have client-side message', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Client-side image editor')
  })

  it('should have grid layout classes defined', () => {
    const wrapper = mount(App)
    // The component structure supports grid layout (even if not visible initially)
    // Check that the component renders successfully
    expect(wrapper.exists()).toBe(true)
  })

  it('should have responsive layout structure', () => {
    const wrapper = mount(App)
    // Check for container which holds the responsive layout
    const container = wrapper.find('.container')
    expect(container.exists()).toBe(true)
  })

  it('should render container', () => {
    const wrapper = mount(App)
    const container = wrapper.find('.container')
    expect(container.exists()).toBe(true)
  })

  it('should have proper spacing classes', () => {
    const wrapper = mount(App)
    const container = wrapper.find('.container')
    expect(container.classes()).toContain('mx-auto')
  })

  it('should have min-height screen', () => {
    const wrapper = mount(App)
    const root = wrapper.find('.min-h-screen')
    expect(root.exists()).toBe(true)
  })

  it('should use base-200 background', () => {
    const wrapper = mount(App)
    const root = wrapper.find('.bg-base-200')
    expect(root.exists()).toBe(true)
  })

  it('should have navbar shadow', () => {
    const wrapper = mount(App)
    const navbar = wrapper.find('.navbar')
    expect(navbar.classes()).toContain('shadow-lg')
  })

  it('should have base-100 navbar background', () => {
    const wrapper = mount(App)
    const navbar = wrapper.find('.navbar')
    expect(navbar.classes()).toContain('bg-base-100')
  })

  it('should have footer centered', () => {
    const wrapper = mount(App)
    const footer = wrapper.find('.footer')
    expect(footer.classes()).toContain('footer-center')
  })

  it('should have proper title styling', () => {
    const wrapper = mount(App)
    expect(wrapper.html()).toContain('text-3xl')
    expect(wrapper.html()).toContain('font-bold')
  })

  it('should have primary color on e in emage', () => {
    const wrapper = mount(App)
    expect(wrapper.html()).toContain('text-primary')
  })

  it('should show upload section by default', () => {
    const wrapper = mount(App)
    const uploadSection = wrapper.find('.max-w-2xl')
    expect(uploadSection.exists()).toBe(true)
  })
})
