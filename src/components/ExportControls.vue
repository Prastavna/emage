<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useImageEditor } from '../composables/useImageEditor'

const props = defineProps<{
  editor: ReturnType<typeof useImageEditor>
}>()

// --- Export state ---
const exportFormat = ref<string>('image/jpeg')
const exportQuality = ref<number>(0.92)
const filename = ref<string>('edited-image')
const originalFilenameFromLoad = ref<string>('edited-image')
const userChangedFilename = ref<boolean>(false)

// --- Resize state ---
type ResizeMode = 'dimensions' | 'filesize'
const resizeMode = ref<ResizeMode>('dimensions')
const width = ref<number>(0)
const height = ref<number>(0)
const lockAspectRatio = ref(true)
const targetFileSize = ref<number>(100)
const isResizing = ref(false)
const originalAspectRatio = ref(1)
const estimatedFileSize = ref<number | null>(null)
const estimatedDimensions = ref<{ width: number; height: number } | null>(null)
const isEstimating = ref(false)

let resizeTimeout: number | null = null
let fileSizeTimeout: number | null = null
let estimateTimeout: number | null = null

// --- Timestamp ---
const getTimestamp = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}-${hours}${minutes}${seconds}`
}

// --- Export logic ---
const handleFilenameInput = () => {
  userChangedFilename.value = true
}

const formatExtensions: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp'
}

const download = async () => {
  const extension = formatExtensions[exportFormat.value] || 'png'

  let finalFilename = filename.value
  if (!userChangedFilename.value) {
    const timestamp = getTimestamp()
    finalFilename = `${filename.value}-${timestamp}`
  }

  const fullFilename = `${finalFilename}.${extension}`
  await props.editor.downloadImage(fullFilename, exportFormat.value, exportQuality.value)
}

// --- Resize logic ---
const scheduleResize = () => {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = window.setTimeout(async () => {
    if (width.value > 0 && height.value > 0 && !isResizing.value) {
      isResizing.value = true
      await props.editor.resize(width.value, height.value, lockAspectRatio.value)
      await updateEstimatedFileSize()
      isResizing.value = false
    }
  }, 600)
}

const handleWidthChange = () => {
  if (lockAspectRatio.value && width.value > 0) {
    height.value = Math.round(width.value / originalAspectRatio.value)
  }
  scheduleResize()
}

const handleHeightChange = () => {
  if (lockAspectRatio.value && height.value > 0) {
    width.value = Math.round(height.value * originalAspectRatio.value)
  }
  scheduleResize()
}

const handleFileSizeChange = () => {
  if (fileSizeTimeout) clearTimeout(fileSizeTimeout)
  fileSizeTimeout = window.setTimeout(async () => {
    if (targetFileSize.value > 0 && !isResizing.value) {
      isResizing.value = true
      await props.editor.resizeToFileSize(targetFileSize.value)
      // Update estimated dimensions from the result
      const dims = props.editor.getCurrentDimensions()
      if (dims) {
        estimatedDimensions.value = { width: dims.width, height: dims.height }
        width.value = dims.width
        height.value = dims.height
      }
      isResizing.value = false
    }
  }, 600)
}

const updateEstimatedFileSize = async () => {
  if (width.value <= 0 || height.value <= 0) return
  isEstimating.value = true
  const size = await props.editor.getCurrentFileSize()
  estimatedFileSize.value = size
  isEstimating.value = false
}

const updateEstimatedDimensions = async () => {
  if (targetFileSize.value <= 0) return
  isEstimating.value = true
  const dims = await props.editor.estimateDimensionsForFileSize(targetFileSize.value)
  estimatedDimensions.value = dims
  isEstimating.value = false
}

const resetToOriginal = async () => {
  if (isResizing.value) return
  isResizing.value = true
  await props.editor.reset()
  updateFromCurrent()
  estimatedFileSize.value = null
  estimatedDimensions.value = null
  isResizing.value = false
}

const updateFromCurrent = () => {
  const dims = props.editor.getCurrentDimensions()
  if (dims) {
    width.value = dims.width
    height.value = dims.height
    originalAspectRatio.value = dims.width / dims.height
  }
}

// --- Watchers ---
watch(() => props.editor.imageLoaded.value, async (loaded) => {
  if (loaded) {
    // Export init
    if (props.editor.originalFileFormat.value) {
      exportFormat.value = props.editor.originalFileFormat.value
      exportQuality.value = exportFormat.value === 'image/png' ? 1 : 0.92
    }
    filename.value = props.editor.originalFileName.value
    originalFilenameFromLoad.value = props.editor.originalFileName.value
    userChangedFilename.value = false

    // Resize init
    updateFromCurrent()
  }
}, { immediate: true })

onMounted(() => {
  if (props.editor.imageLoaded.value) {
    updateFromCurrent()
  }
})
</script>

<template>
  <div class="card bg-base-100 shadow-md">
    <div class="card-body">
      <h3 class="card-title text-lg">Export</h3>

      <div class="space-y-3">
        <!-- Filename -->
        <label class="form-control">
          <div class="label">
            <span class="label-text text-xs font-semibold">Filename</span>
          </div>
          <input
            v-model="filename"
            type="text"
            placeholder="my-image"
            class="input input-bordered input-sm w-full"
            @input="handleFilenameInput"
          />
        </label>

        <!-- Format -->
        <label class="form-control">
          <div class="label">
            <span class="label-text text-xs font-semibold">Format</span>
          </div>
          <select v-model="exportFormat" class="select select-bordered select-sm w-full">
            <option value="image/png">PNG</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/webp">WebP</option>
          </select>
        </label>

        <!-- Quality -->
        <div v-if="exportFormat !== 'image/png'">
          <div class="flex justify-between items-center mb-2">
            <label class="label-text text-xs font-semibold">Quality</label>
            <span class="badge badge-sm">{{ Math.round(exportQuality * 100) }}%</span>
          </div>
          <input
            v-model.number="exportQuality"
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            class="range range-primary range-sm"
          />
          <div class="flex justify-between text-xs text-base-content/60 mt-1">
            <span>Lower</span>
            <span>Higher</span>
          </div>
        </div>

        <!-- Divider -->
        <div class="divider my-1 text-xs text-base-content/40">Resize</div>

        <!-- Resize Mode Tabs -->
        <div role="tablist" class="tabs tabs-box tabs-sm">
          <a
            role="tab"
            class="tab w-1/2"
            :class="{ 'tab-active': resizeMode === 'dimensions' }"
            @click="resizeMode = 'dimensions'"
          >
            Dimensions
          </a>
          <a
            role="tab"
            class="tab w-1/2"
            :class="{ 'tab-active': resizeMode === 'filesize' }"
            @click="resizeMode = 'filesize'"
          >
            Target Size
          </a>
        </div>

        <!-- Dimensions Mode -->
        <div v-if="resizeMode === 'dimensions'" class="space-y-3">
          <div class="flex gap-2 items-center">
            <label class="form-control flex-1">
              <div class="label">
                <span class="label-text text-xs">Width (px)</span>
              </div>
              <input
                v-model.number="width"
                type="number"
                min="1"
                placeholder="Width"
                class="input input-bordered input-sm w-full"
                :disabled="isResizing"
                @input="handleWidthChange"
              />
            </label>

            <button
              @click="resetToOriginal"
              class="btn btn-sm btn-ghost btn-square mt-7"
              title="Reset to original"
              :disabled="isResizing"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
              </svg>
            </button>

            <label class="form-control flex-1">
              <div class="label">
                <span class="label-text text-xs">Height (px)</span>
              </div>
              <input
                v-model.number="height"
                type="number"
                min="1"
                placeholder="Height"
                class="input input-bordered input-sm w-full"
                :disabled="isResizing"
                @input="handleHeightChange"
              />
            </label>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-2">
              <input
                v-model="lockAspectRatio"
                type="checkbox"
                class="checkbox checkbox-sm checkbox-primary"
              />
              <span class="label-text">Lock aspect ratio</span>
            </label>
          </div>

          <!-- Estimated file size -->
          <p v-if="estimatedFileSize !== null && !isResizing" class="text-xs text-base-content/60">
            Estimated file size: ~{{ estimatedFileSize.toFixed(1) }} KB
          </p>

          <p v-if="isResizing" class="text-xs text-base-content/50 text-center">Resizing...</p>
        </div>

        <!-- Target File Size Mode -->
        <div v-else class="space-y-3">
          <div class="flex gap-2 items-center">
            <label class="form-control flex-1">
              <div class="label">
                <span class="label-text text-xs">Target Size (KB)</span>
              </div>
              <input
                v-model.number="targetFileSize"
                type="number"
                min="1"
                placeholder="100"
                class="input input-bordered input-sm w-full"
                :disabled="isResizing"
                @input="handleFileSizeChange"
              />
            </label>

            <button
              @click="resetToOriginal"
              class="btn btn-sm btn-ghost btn-square mt-7"
              title="Reset to original"
              :disabled="isResizing"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- Estimated dimensions -->
          <p v-if="estimatedDimensions && !isResizing" class="text-xs text-base-content/60">
            Estimated dimensions: {{ estimatedDimensions.width }} x {{ estimatedDimensions.height }}px
          </p>

          <p v-if="isResizing" class="text-xs text-base-content/50 text-center">Resizing...</p>
        </div>

        <!-- Download -->
        <button @click="download" class="btn btn-sm md:btn-md btn-success w-full">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          Download Image
        </button>
      </div>
    </div>
  </div>
</template>
