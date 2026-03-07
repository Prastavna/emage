<script setup lang="ts">
import { ref, watch } from 'vue'
import { useImageEditor } from '../composables/useImageEditor'

const props = defineProps<{
  editor: ReturnType<typeof useImageEditor>
}>()

const exportFormat = ref<string>('image/jpeg')
const exportQuality = ref<number>(0.92)
const filename = ref<string>('edited-image')

// Watch for image load and set format to match original
watch(() => props.editor.imageLoaded.value, (loaded) => {
  if (loaded && props.editor.originalFileFormat.value) {
    exportFormat.value = props.editor.originalFileFormat.value
    // Set quality based on format
    if (exportFormat.value === 'image/png') {
      exportQuality.value = 1
    } else {
      exportQuality.value = 0.92
    }
  }
})

const formatExtensions: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp'
}

const download = async () => {
  const extension = formatExtensions[exportFormat.value] || 'png'
  const fullFilename = `${filename.value}.${extension}`
  await props.editor.downloadImage(fullFilename, exportFormat.value, exportQuality.value)
}
</script>

<template>
  <div class="card bg-base-100 shadow-md">
    <div class="card-body">
      <h3 class="card-title text-lg">Export</h3>
      
      <div class="space-y-3">
        <label class="form-control">
          <div class="label">
            <span class="label-text text-xs font-semibold">Filename</span>
          </div>
          <input
            v-model="filename"
            type="text"
            placeholder="my-image"
            class="input input-bordered input-sm w-full"
          />
        </label>

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

        <button @click="download" class="btn btn-sm btn-success w-full">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          Download Image
        </button>
      </div>
    </div>
  </div>
</template>
