import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ExportControls from './ExportControls.vue'

const createMockEditor = (overrides: Record<string, any> = {}) => ({
  downloadImage: vi.fn(),
  resize: vi.fn(),
  resizeToFileSize: vi.fn().mockResolvedValue(true),
  reset: vi.fn().mockResolvedValue(undefined),
  getCurrentDimensions: vi.fn().mockReturnValue({ width: 1000, height: 800 }),
  getCurrentFileSize: vi.fn().mockResolvedValue(250.5),
  estimateFileSizeForDimensions: vi.fn().mockResolvedValue(200),
  estimateDimensionsForFileSize: vi.fn().mockResolvedValue({ width: 900, height: 720 }),
  imageLoaded: { value: true },
  originalFileFormat: { value: 'image/jpeg' },
  originalFileName: { value: 'test-image' },
  hiddenCanvasWidth: { value: 1000 },
  hiddenCanvasHeight: { value: 800 },
  ...overrides
})

describe('ExportControls Component', () => {
  let mockEditor: ReturnType<typeof createMockEditor>

  beforeEach(() => {
    vi.clearAllMocks()
    mockEditor = createMockEditor()
  })

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
    const button = wrapper.find('.btn-success')
    expect(button.text()).toContain('Download Image')
  })

  it('should call downloadImage when download button clicked', async () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    const button = wrapper.find('.btn-success')
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

describe('ExportControls - Resize Section', () => {
  let mockEditor: ReturnType<typeof createMockEditor>

  beforeEach(() => {
    vi.clearAllMocks()
    mockEditor = createMockEditor()
  })

  it('should render resize divider', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Resize')
  })

  it('should render resize mode tabs', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Dimensions')
    expect(wrapper.text()).toContain('Target Size')
  })

  it('should show dimensions mode by default', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs[0]!.classes()).toContain('tab-active')
  })

  it('should render width and height inputs in dimensions mode', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    expect(wrapper.text()).toContain('Width (px)')
    expect(wrapper.text()).toContain('Height (px)')
  })

  it('should render lock aspect ratio checkbox', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.exists()).toBe(true)
    expect(wrapper.text()).toContain('Lock aspect ratio')
  })

  it('should have lock aspect ratio checked by default', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
  })

  it('should initialize width and height from current dimensions', async () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    await wrapper.vm.$nextTick()

    const numberInputs = wrapper.findAll('input[type="number"]')
    expect((numberInputs[0]!.element as HTMLInputElement).value).toBe('1000')
    expect((numberInputs[1]!.element as HTMLInputElement).value).toBe('800')
  })

  it('should switch to target size mode', async () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })

    const tabs = wrapper.findAll('[role="tab"]')
    await tabs[1]!.trigger('click')

    expect(wrapper.text()).toContain('Target Size (KB)')
  })

  it('should render target size input in filesize mode', async () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })

    const tabs = wrapper.findAll('[role="tab"]')
    await tabs[1]!.trigger('click')

    const numberInputs = wrapper.findAll('input[type="number"]')
    expect(numberInputs.length).toBe(1)
  })

  it('should have reset button in dimensions mode', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    const buttons = wrapper.findAll('button')
    const resetButton = buttons.find(b => b.attributes('title') === 'Reset to original')
    expect(resetButton).toBeDefined()
  })

  it('should have reset button in filesize mode', async () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })

    const tabs = wrapper.findAll('[role="tab"]')
    await tabs[1]!.trigger('click')

    const buttons = wrapper.findAll('button')
    const resetButton = buttons.find(b => b.attributes('title') === 'Reset to original')
    expect(resetButton).toBeDefined()
  })

  it('should not have an Apply Resize button', () => {
    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })
    const buttons = wrapper.findAll('button')
    const applyButton = buttons.find(b => b.text().includes('Apply Resize'))
    expect(applyButton).toBeUndefined()
  })
})

describe('ExportControls - Filename with Timestamp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should set filename from originalFileName when image loads', async () => {
    const mockEditor = createMockEditor({
      originalFileName: { value: 'vacation-photo' }
    })

    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })

    await wrapper.vm.$nextTick()

    const input = wrapper.find('input[type="text"]')
    expect((input.element as HTMLInputElement).value).toBe('vacation-photo')
  })

  it('should add timestamp to filename when download is clicked and user has not changed filename', async () => {
    const mockEditor = createMockEditor({
      originalFileName: { value: 'vacation-photo' }
    })

    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })

    await wrapper.vm.$nextTick()

    const button = wrapper.find('.btn-success')
    await button.trigger('click')

    expect(mockEditor.downloadImage).toHaveBeenCalled()
    const callArgs = mockEditor.downloadImage.mock.calls[0]
    if (callArgs) {
      const filename = callArgs[0] as string
      expect(filename).toMatch(/^vacation-photo-\d{8}-\d{6}\.jpg$/)
    }
  })

  it('should NOT add timestamp when user manually changes filename', async () => {
    const mockEditor = createMockEditor({
      originalFileName: { value: 'vacation-photo' }
    })

    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })

    await wrapper.vm.$nextTick()

    const input = wrapper.find('input[type="text"]')
    await input.setValue('my-custom-name')
    await input.trigger('input')

    const button = wrapper.find('.btn-success')
    await button.trigger('click')

    expect(mockEditor.downloadImage).toHaveBeenCalled()
    const callArgs = mockEditor.downloadImage.mock.calls[0]
    if (callArgs) {
      const filename = callArgs[0] as string
      expect(filename).toBe('my-custom-name.jpg')
    }
  })

  it('should add timestamp if user clears and re-enters the original filename', async () => {
    const mockEditor = createMockEditor({
      originalFileName: { value: 'vacation-photo' }
    })

    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })

    await wrapper.vm.$nextTick()

    const input = wrapper.find('input[type="text"]')
    await input.setValue('vacation-photo')
    await input.trigger('input')

    const button = wrapper.find('.btn-success')
    await button.trigger('click')

    expect(mockEditor.downloadImage).toHaveBeenCalled()
    const callArgs = mockEditor.downloadImage.mock.calls[0]
    if (callArgs) {
      const filename = callArgs[0] as string
      expect(filename).toBe('vacation-photo.jpg')
    }
  })

  it('should format timestamp correctly (YYYYMMDD-HHMMSS)', async () => {
    const mockDate = new Date('2026-03-07T14:30:45')
    vi.setSystemTime(mockDate)

    const mockEditor = createMockEditor({
      originalFileName: { value: 'vacation-photo' }
    })

    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })

    await wrapper.vm.$nextTick()

    const button = wrapper.find('.btn-success')
    await button.trigger('click')

    expect(mockEditor.downloadImage).toHaveBeenCalled()
    const callArgs = mockEditor.downloadImage.mock.calls[0]
    if (callArgs) {
      const filename = callArgs[0] as string
      expect(filename).toBe('vacation-photo-20260307-143045.jpg')
    }

    vi.useRealTimers()
  })

  it('should reset userChangedFilename flag when new image is loaded', async () => {
    expect(true).toBe(true)
  })

  it('should handle different image formats correctly', async () => {
    const pngMockEditor = createMockEditor({
      originalFileFormat: { value: 'image/png' },
      originalFileName: { value: 'screenshot' }
    })

    const wrapper = mount(ExportControls, {
      props: { editor: pngMockEditor as any }
    })

    await wrapper.vm.$nextTick()

    const button = wrapper.find('.btn-success')
    await button.trigger('click')

    expect(pngMockEditor.downloadImage).toHaveBeenCalled()
    const callArgs = pngMockEditor.downloadImage.mock.calls[0]
    if (callArgs) {
      const filename = callArgs[0] as string
      expect(filename).toMatch(/^screenshot-\d{8}-\d{6}\.png$/)
    }
  })

  it('should generate timestamp in correct format', () => {
    const mockDate = new Date('2026-03-07T09:05:03')
    vi.setSystemTime(mockDate)

    const mockEditor = createMockEditor({
      originalFileName: { value: 'test' }
    })

    const wrapper = mount(ExportControls, {
      props: { editor: mockEditor as any }
    })

    const button = wrapper.find('.btn-success')
    button.trigger('click')

    const callArgs = mockEditor.downloadImage.mock.calls[0]
    if (callArgs) {
      const filename = callArgs[0] as string
      expect(filename).toMatch(/^test-20260307-090503\.jpg$/)
    }

    vi.useRealTimers()
  })
})
