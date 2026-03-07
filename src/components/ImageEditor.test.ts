import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ImageEditor from './ImageEditor.vue'
import CropOverlay from './CropOverlay.vue'

vi.mock('../composables/useImageEditor', () => ({
  useImageEditor: () => ({
    canvas: { value: null },
    fabricImage: { value: null },
    imageLoaded: { value: false },
    cropMode: { value: false },
    cropArea: { value: { x: 0, y: 0, width: 0, height: 0 } },
    initCanvas: vi.fn(),
    loadImage: vi.fn(),
    setCropArea: vi.fn()
  })
}))

describe('ImageEditor Component', () => {
  it('should render the component', () => {
    const wrapper = mount(ImageEditor, {
      props: {
        file: null,
        cropAspectRatio: null
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should render canvas element', () => {
    const wrapper = mount(ImageEditor, {
      props: {
        file: null,
        cropAspectRatio: null
      }
    })
    const canvas = wrapper.find('canvas')
    expect(canvas.exists()).toBe(true)
  })

  it('should have canvas with correct dimensions', () => {
    const wrapper = mount(ImageEditor, {
      props: {
        file: null,
        cropAspectRatio: null
      }
    })
    const canvas = wrapper.find('canvas')
    expect(canvas.attributes('width')).toBe('800')
    expect(canvas.attributes('height')).toBe('600')
  })

  it('should have canvas with styling classes', () => {
    const wrapper = mount(ImageEditor, {
      props: {
        file: null,
        cropAspectRatio: null
      }
    })
    const canvas = wrapper.find('canvas')
    expect(canvas.classes()).toContain('border')
    expect(canvas.classes()).toContain('rounded-lg')
    expect(canvas.classes()).toContain('shadow-lg')
  })

  it('should not render CropOverlay when not in crop mode', () => {
    const wrapper = mount(ImageEditor, {
      props: {
        file: null,
        cropAspectRatio: null
      }
    })
    const cropOverlay = wrapper.findComponent(CropOverlay)
    expect(cropOverlay.exists()).toBe(false)
  })

  it('should center canvas in container', () => {
    const wrapper = mount(ImageEditor, {
      props: {
        file: null,
        cropAspectRatio: null
      }
    })
    const container = wrapper.find('.w-full')
    expect(container.classes()).toContain('flex')
    expect(container.classes()).toContain('justify-center')
  })

  it('should expose editor in defineExpose', () => {
    const wrapper = mount(ImageEditor, {
      props: {
        file: null,
        cropAspectRatio: null
      }
    })
    expect(wrapper.vm.editor).toBeDefined()
  })

  it('should expose loadImage function in defineExpose', () => {
    const wrapper = mount(ImageEditor, {
      props: {
        file: null,
        cropAspectRatio: null
      }
    })
    expect(wrapper.vm.loadImage).toBeDefined()
    expect(typeof wrapper.vm.loadImage).toBe('function')
  })

  it('should accept file prop', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const wrapper = mount(ImageEditor, {
      props: {
        file,
        cropAspectRatio: null
      }
    })
    expect(wrapper.props('file')).toEqual(file)
  })

  it('should accept cropAspectRatio prop', () => {
    const wrapper = mount(ImageEditor, {
      props: {
        file: null,
        cropAspectRatio: 16/9
      }
    })
    expect(wrapper.props('cropAspectRatio')).toBe(16/9)
  })

  it('should accept null cropAspectRatio', () => {
    const wrapper = mount(ImageEditor, {
      props: {
        file: null,
        cropAspectRatio: null
      }
    })
    expect(wrapper.props('cropAspectRatio')).toBeNull()
  })

  it('should have relative positioning on container', () => {
    const wrapper = mount(ImageEditor, {
      props: {
        file: null,
        cropAspectRatio: null
      }
    })
    const container = wrapper.find('.relative')
    expect(container.exists()).toBe(true)
  })
})
