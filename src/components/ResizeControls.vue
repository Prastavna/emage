<script setup lang="ts">
import { ref, computed } from 'vue'
import { useImageEditor } from '../composables/useImageEditor'

const props = defineProps<{
  editor: ReturnType<typeof useImageEditor>
}>()

const width = ref<number>(0)
const height = ref<number>(0)
const lockAspectRatio = ref(true)
const targetFileSize = ref<number>(100)
const resizeFormat = ref<string>('image/jpeg')

const currentDimensions = computed(() => {
  return props.editor.getCurrentDimensions()
})

const applyDimensionResize = () => {
  if (width.value || height.value) {
    props.editor.resize(width.value, height.value, lockAspectRatio.value)
  }
}

const applyFileSizeResize = async () => {
  if (targetFileSize.value > 0) {
    await props.editor.resizeToFileSize(targetFileSize.value, resizeFormat.value)
  }
}

const updateFromCurrent = () => {
  const dims = props.editor.getCurrentDimensions()
  if (dims) {
    width.value = dims.width
    height.value = dims.height
  }
}
</script>

<template>
  <div class="card bg-base-100 shadow-md">
    <div class="card-body">
      <h3 class="card-title text-lg">Resize</h3>
      
      <!-- Current Dimensions -->
      <div v-if="currentDimensions" class="alert alert-info text-sm mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <span>Current: {{ currentDimensions.width }} × {{ currentDimensions.height }}px</span>
      </div>

      <!-- Dimension Resize -->
      <div class="space-y-3">
        <h4 class="font-semibold text-sm">By Dimensions</h4>
        
        <div class="flex gap-2 items-center">
          <label class="form-control flex-1">
            <div class="label">
              <span class="label-text text-xs">Width (px)</span>
            </div>
            <input
              v-model.number="width"
              type="number"
              placeholder="Width"
              class="input input-bordered input-sm w-full"
            />
          </label>
          
          <button
            @click="updateFromCurrent"
            class="btn btn-sm btn-ghost btn-square mt-7"
            title="Get current dimensions"
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
              placeholder="Height"
              class="input input-bordered input-sm w-full"
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

        <button @click="applyDimensionResize" class="btn btn-sm btn-primary w-full">
          Apply Dimension Resize
        </button>
      </div>

      <div class="divider my-2">OR</div>

      <!-- File Size Resize -->
      <div class="space-y-3">
        <h4 class="font-semibold text-sm">By File Size</h4>
        
        <label class="form-control">
          <div class="label">
            <span class="label-text text-xs">Target Size (KB)</span>
          </div>
          <input
            v-model.number="targetFileSize"
            type="number"
            placeholder="100"
            class="input input-bordered input-sm w-full"
          />
        </label>

        <label class="form-control">
          <div class="label">
            <span class="label-text text-xs">Format</span>
          </div>
          <select v-model="resizeFormat" class="select select-bordered select-sm w-full">
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
          </select>
        </label>

        <button @click="applyFileSizeResize" class="btn btn-sm btn-secondary w-full">
          Compress to Target Size
        </button>
      </div>
    </div>
  </div>
</template>
