import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import RotationControls from './RotationControls.vue'

describe('RotationControls Component', () => {
  const mockEditor = {
    setRotation: vi.fn(),
    flipHorizontal: vi.fn(),
    flipVertical: vi.fn(),
    imageLoaded: { value: true }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the component', () => {
    const wrapper = mount(RotationControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display rotation controls title', () => {
    const wrapper = mount(RotationControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Rotation & Flip')
  })

  it('should render rotation slider', () => {
    const wrapper = mount(RotationControls, {
      props: { editor: mockEditor as any }
    })
    const slider = wrapper.find('input[type="range"]')
    expect(slider.exists()).toBe(true)
  })

  it('should have rotation slider with correct attributes', () => {
    const wrapper = mount(RotationControls, {
      props: { editor: mockEditor as any }
    })
    const slider = wrapper.find('input[type="range"]')
    expect(slider.attributes('min')).toBe('0')
    expect(slider.attributes('max')).toBe('359')
    expect(slider.attributes('step')).toBe('1')
  })

  it('should render quick rotate buttons', () => {
    const wrapper = mount(RotationControls, {
      props: { editor: mockEditor as any }
    })
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(3)
  })

  it('should call setRotation when slider changes', async () => {
    const wrapper = mount(RotationControls, {
      props: { editor: mockEditor as any }
    })
    const slider = wrapper.find('input[type="range"]')

    await slider.setValue('45')
    await wrapper.vm.$nextTick()

    expect(mockEditor.setRotation).toHaveBeenCalled()
  })

  it('should rotate by 90 degrees', async () => {
    const wrapper = mount(RotationControls, {
      props: { editor: mockEditor as any }
    })
    const buttons = wrapper.findAll('button')
    const rotate90Button = buttons.find(b => b.text().includes('90°'))

    if (rotate90Button) {
      await rotate90Button.trigger('click')
      expect(mockEditor.setRotation).toHaveBeenCalled()
    }
  })

  it('should flip horizontally', async () => {
    const wrapper = mount(RotationControls, {
      props: { editor: mockEditor as any }
    })
    const buttons = wrapper.findAll('button')
    const flipHButton = buttons.find(b => b.text().includes('Horizontal'))

    if (flipHButton) {
      await flipHButton.trigger('click')
      expect(mockEditor.flipHorizontal).toHaveBeenCalled()
    }
  })

  it('should flip vertically', async () => {
    const wrapper = mount(RotationControls, {
      props: { editor: mockEditor as any }
    })
    const buttons = wrapper.findAll('button')
    const flipVButton = buttons.find(b => b.text().includes('Vertical'))

    if (flipVButton) {
      await flipVButton.trigger('click')
      expect(mockEditor.flipVertical).toHaveBeenCalled()
    }
  })

  it('should display current rotation angle', async () => {
    const wrapper = mount(RotationControls, {
      props: { editor: mockEditor as any }
    })

    const badge = wrapper.find('.badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('°')
  })

  it('should reset rotation to 0', async () => {
    const wrapper = mount(RotationControls, {
      props: { editor: mockEditor as any }
    })
    const buttons = wrapper.findAll('button')
    const rotate90Button = buttons.find(b => b.text().includes('90°'))

    if (rotate90Button) {
      await rotate90Button.trigger('click')
      await wrapper.vm.$nextTick()
    }

    const resetButton = buttons.find(b => b.text().includes('Reset'))
    if (resetButton) {
      await resetButton.trigger('click')
      await wrapper.vm.$nextTick()
      expect(mockEditor.setRotation).toHaveBeenCalledWith(0)
    }
  })

  it('should render dividers between sections', () => {
    const wrapper = mount(RotationControls, {
      props: { editor: mockEditor as any }
    })
    const dividers = wrapper.findAll('.divider')
    expect(dividers.length).toBeGreaterThan(0)
  })
})
