<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  imageSelected: [file: File]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    emit('imageSelected', file)
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  
  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    emit('imageSelected', file)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const openFilePicker = () => {
  fileInput.value?.click()
}
</script>

<template>
  <div class="w-full">
    <div
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @click="openFilePicker"
      :class="[
        'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
        isDragging ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary'
      ]"
    >
      <div class="flex flex-col items-center gap-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-16 text-base-content/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <div>
          <p class="text-lg font-semibold">Drop your image here</p>
          <p class="text-sm text-base-content/60">or click to browse</p>
        </div>
        <p class="text-xs text-base-content/50">Supports: JPG, PNG, GIF, WebP</p>
      </div>
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      @change="handleFileSelect"
      class="hidden"
    />
  </div>
</template>
