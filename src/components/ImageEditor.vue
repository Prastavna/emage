<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useImageEditor } from '../composables/useImageEditor'

const props = defineProps<{
  file: File | null
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const editor = useImageEditor()
const canvasReady = ref(false)

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

// Watch for file changes
defineExpose({
  editor,
  loadImage
})
</script>

<template>
  <div class="w-full flex justify-center">
    <canvas
      ref="canvasRef"
      width="800"
      height="600"
      class="border border-base-300 rounded-lg shadow-lg"
    />
  </div>
</template>
