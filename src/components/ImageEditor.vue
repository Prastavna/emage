<script setup lang="ts">
import { onMounted, ref, watch, computed, onUnmounted } from 'vue'
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
const canvasContainer = ref<HTMLDivElement | null>(null)
const canvasDimensions = ref({ width: 800, height: 600 })

const updateCanvasSize = () => {
  if (!canvasContainer.value) return
  
  const containerWidth = canvasContainer.value.clientWidth
  const maxWidth = Math.min(containerWidth - 32, 800) // 32px for padding
  const aspectRatio = 4 / 3 // 800:600 ratio
  const height = maxWidth / aspectRatio
  
  canvasDimensions.value = {
    width: maxWidth,
    height: height
  }
  
  // Update canvas size if already initialized
  if (editor.canvas.value && canvasReady.value) {
    editor.canvas.value.setDimensions({
      width: maxWidth,
      height: height
    })
    editor.canvas.value.renderAll()
  }
}

const imageBounds = computed(() => {
  if (!editor.fabricImage.value) {
    return { left: 0, top: 0, width: canvasDimensions.value.width, height: canvasDimensions.value.height }
  }
  return editor.fabricImage.value.getBoundingRect()
})

onMounted(() => {
  updateCanvasSize()
  
  if (canvasRef.value) {
    editor.initCanvas(canvasRef.value)
    canvasReady.value = true
  }
  
  // Add resize listener
  window.addEventListener('resize', updateCanvasSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize)
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
  <div class="w-full flex justify-center px-4">
    <div ref="canvasContainer" class="relative w-full max-w-[800px]">
      <canvas
        ref="canvasRef"
        :width="canvasDimensions.width"
        :height="canvasDimensions.height"
        class="border border-base-300 rounded-lg shadow-lg w-full h-auto"
      />
      <CropOverlay
        v-if="editor.cropMode.value && editor.imageLoaded.value"
        :canvas-width="canvasDimensions.width"
        :canvas-height="canvasDimensions.height"
        :image-bounds="imageBounds"
        :aspect-ratio="cropAspectRatio"
        :initial-crop="editor.cropArea.value"
        @update="handleCropUpdate"
      />
    </div>
  </div>
</template>
