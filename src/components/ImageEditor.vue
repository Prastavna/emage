<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useImageEditor } from '../composables/useImageEditor'
import CropOverlay from './CropOverlay.vue'
import type { CropArea } from '../composables/useImageEditor'

const props = defineProps<{
  file: File | null
  cropAspectRatio: number | null
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const editor = useImageEditor()
const canvasReady = ref(false)

const imageBounds = computed(() => {
  if (!editor.fabricImage.value) {
    return { left: 0, top: 0, width: 800, height: 600 }
  }
  return editor.fabricImage.value.getBoundingRect()
})

onMounted(() => {
  if (canvasRef.value) {
    editor.initCanvas(canvasRef.value)
    canvasReady.value = true
  }
})

const loadImage = async () => {
  if (props.file) {
    await editor.loadImage(props.file)
  }
}

// Watch for file changes and load image when canvas is ready
watch([() => props.file, canvasReady], async ([file, ready]) => {
  if (file && ready) {
    await loadImage()
  }
})

const handleCropUpdate = (area: CropArea) => {
  editor.setCropArea(area)
}

// Watch for file changes
defineExpose({
  editor,
  loadImage
})
</script>

<template>
  <div class="w-full flex justify-center">
    <div class="relative">
      <canvas
        ref="canvasRef"
        width="800"
        height="600"
        class="border border-base-300 rounded-lg shadow-lg"
      />
      <CropOverlay
        v-if="editor.cropMode.value && editor.imageLoaded.value"
        :canvas-width="800"
        :canvas-height="600"
        :image-bounds="imageBounds"
        :aspect-ratio="cropAspectRatio"
        :initial-crop="editor.cropArea.value"
        @update="handleCropUpdate"
      />
    </div>
  </div>
</template>
