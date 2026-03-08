<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useImageEditor } from '../composables/useImageEditor'

const props = defineProps<{
  editor: ReturnType<typeof useImageEditor>
}>()

type ResizeMode = 'dimensions' | 'filesize'

const resizeMode = ref<ResizeMode>('dimensions')
const width = ref<number>(0)
const height = ref<number>(0)
const lockAspectRatio = ref(true)
const targetFileSize = ref<number>(100)
const isResizing = ref(false)

// Track the original aspect ratio from the image at load time
const originalAspectRatio = ref(1)

let resizeTimeout: number | null = null

// Debounced resize that auto-applies when user changes width/height
const scheduleResize = () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  resizeTimeout = window.setTimeout(async () => {
    if (width.value > 0 && height.value > 0 && !isResizing.value) {
      isResizing.value = true
      await props.editor.resize(width.value, height.value, lockAspectRatio.value)
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

// Debounced file-size resize
let fileSizeTimeout: number | null = null

const handleFileSizeChange = () => {
  if (fileSizeTimeout) {
    clearTimeout(fileSizeTimeout)
  }
  fileSizeTimeout = window.setTimeout(async () => {
    if (targetFileSize.value > 0 && !isResizing.value) {
      isResizing.value = true
      await props.editor.resizeToFileSize(targetFileSize.value)
      // Update dimension inputs to reflect new size
      const dims = props.editor.getCurrentDimensions()
      if (dims) {
        width.value = dims.width
        height.value = dims.height
      }
      isResizing.value = false
    }
  }, 600)
}

const resetToOriginal = async () => {
  if (isResizing.value) return
  isResizing.value = true
  await props.editor.reset()
  updateFromCurrent()
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

// Initialize with current dimensions when image loads
watch(() => props.editor.imageLoaded.value, (loaded) => {
  if (loaded) {
    updateFromCurrent()
  }
})

onMounted(() => {
  if (props.editor.imageLoaded.value) {
    updateFromCurrent()
  }
})
</script>

<template>
  <div class="card bg-base-100 shadow-md">
    <div class="card-body">
      <h3 class="card-title text-lg">Resize</h3>

      <!-- Mode Tabs -->
      <div role="tablist" class="tabs tabs-box tabs-sm mb-2">
        <a
          role="tab"
          class="tab"
          :class="{ 'tab-active': resizeMode === 'dimensions' }"
          @click="resizeMode = 'dimensions'"
        >
          Dimensions
        </a>
        <a
          role="tab"
          class="tab"
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

        <p v-if="isResizing" class="text-xs text-base-content/50 text-center">Resizing...</p>
      </div>

      <!-- Target File Size Mode -->
      <div v-else class="space-y-3">
        <label class="form-control">
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
          class="btn btn-sm btn-ghost w-full"
          :disabled="isResizing"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
          </svg>
          Reset to original
        </button>

        <p v-if="isResizing" class="text-xs text-base-content/50 text-center">Resizing...</p>
      </div>
    </div>
  </div>
</template>
