<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { CropArea } from '../composables/useImageEditor'

const props = defineProps<{
  canvasWidth: number
  canvasHeight: number
  imageBounds: { left: number; top: number; width: number; height: number }
  aspectRatio: number | null
  initialCrop: CropArea
}>()

const emit = defineEmits<{
  update: [area: CropArea]
}>()

const isDragging = ref(false)
const isResizing = ref(false)
const resizeHandle = ref<string>('')
const dragStart = ref({ x: 0, y: 0 })

const cropRect = ref<CropArea>({ ...props.initialCrop })

// Watch for aspect ratio changes and adjust crop box
watch(() => props.aspectRatio, (newRatio) => {
  if (newRatio) {
    // Adjust crop box to match new aspect ratio
    const currentWidth = cropRect.value.width
    const currentHeight = cropRect.value.height
    const currentCenterX = cropRect.value.x + currentWidth / 2
    const currentCenterY = cropRect.value.y + currentHeight / 2
    
    // Calculate new dimensions based on aspect ratio
    // Keep the smaller dimension and adjust the other
    let newWidth = currentWidth
    let newHeight = currentWidth / newRatio
    
    // If new height exceeds bounds, use height as base
    if (newHeight > props.imageBounds.height) {
      newHeight = currentHeight
      newWidth = currentHeight * newRatio
    }
    
    // If new width exceeds bounds, scale down proportionally
    if (newWidth > props.imageBounds.width) {
      newWidth = props.imageBounds.width * 0.8
      newHeight = newWidth / newRatio
    }
    
    // If new height exceeds bounds, scale down proportionally
    if (newHeight > props.imageBounds.height) {
      newHeight = props.imageBounds.height * 0.8
      newWidth = newHeight * newRatio
    }
    
    // Calculate new position (centered on previous crop box)
    let newX = currentCenterX - newWidth / 2
    let newY = currentCenterY - newHeight / 2
    
    // Constrain to image bounds
    newX = Math.max(props.imageBounds.left, Math.min(newX, props.imageBounds.left + props.imageBounds.width - newWidth))
    newY = Math.max(props.imageBounds.top, Math.min(newY, props.imageBounds.top + props.imageBounds.height - newHeight))
    
    cropRect.value = {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    }
    
    emit('update', cropRect.value)
  }
})

const cropStyle = computed(() => ({
  left: `${cropRect.value.x}px`,
  top: `${cropRect.value.y}px`,
  width: `${cropRect.value.width}px`,
  height: `${cropRect.value.height}px`
}))

const handlePointerDown = (e: PointerEvent, handle?: string) => {
  e.preventDefault()
  e.stopPropagation()
  
  // Capture the pointer so we receive move/up events even if finger leaves the element
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  
  if (handle) {
    isResizing.value = true
    resizeHandle.value = handle
  } else {
    isDragging.value = true
  }
  
  dragStart.value = { x: e.clientX, y: e.clientY }
}

const handlePointerMove = (e: PointerEvent) => {
  if (!isDragging.value && !isResizing.value) return
  
  const deltaX = e.clientX - dragStart.value.x
  const deltaY = e.clientY - dragStart.value.y
  
  if (isDragging.value) {
    // Move the crop area
    let newX = cropRect.value.x + deltaX
    let newY = cropRect.value.y + deltaY
    
    // Constrain to image bounds
    newX = Math.max(props.imageBounds.left, Math.min(newX, props.imageBounds.left + props.imageBounds.width - cropRect.value.width))
    newY = Math.max(props.imageBounds.top, Math.min(newY, props.imageBounds.top + props.imageBounds.height - cropRect.value.height))
    
    cropRect.value = {
      ...cropRect.value,
      x: newX,
      y: newY
    }
  } else if (isResizing.value) {
    // Resize the crop area
    let newX = cropRect.value.x
    let newY = cropRect.value.y
    let newWidth = cropRect.value.width
    let newHeight = cropRect.value.height
    
    const handle = resizeHandle.value
    
    if (handle.includes('n')) {
      newY += deltaY
      newHeight -= deltaY
    }
    if (handle.includes('s')) {
      newHeight += deltaY
    }
    if (handle.includes('w')) {
      newX += deltaX
      newWidth -= deltaX
    }
    if (handle.includes('e')) {
      newWidth += deltaX
    }
    
    // Apply aspect ratio constraint
    if (props.aspectRatio) {
      if (handle.includes('e') || handle.includes('w')) {
        newHeight = newWidth / props.aspectRatio
      } else {
        newWidth = newHeight * props.aspectRatio
      }
    }
    
    // Constrain to image bounds and minimum size
    const minSize = 50
    newWidth = Math.max(minSize, Math.min(newWidth, props.imageBounds.width))
    newHeight = Math.max(minSize, Math.min(newHeight, props.imageBounds.height))
    newX = Math.max(props.imageBounds.left, Math.min(newX, props.imageBounds.left + props.imageBounds.width - newWidth))
    newY = Math.max(props.imageBounds.top, Math.min(newY, props.imageBounds.top + props.imageBounds.height - newHeight))
    
    cropRect.value = {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    }
  }
  
  dragStart.value = { x: e.clientX, y: e.clientY }
  emit('update', cropRect.value)
}

const handlePointerUp = () => {
  isDragging.value = false
  isResizing.value = false
  resizeHandle.value = ''
}

onMounted(() => {
  document.addEventListener('pointermove', handlePointerMove)
  document.addEventListener('pointerup', handlePointerUp)
})

onUnmounted(() => {
  document.removeEventListener('pointermove', handlePointerMove)
  document.removeEventListener('pointerup', handlePointerUp)
})
</script>

<template>
  <div 
    class="absolute inset-0 pointer-events-none"
    :style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }"
  >
    <!-- Dark overlay -->
    <svg class="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <mask id="crop-mask">
          <rect width="100%" height="100%" fill="white" />
          <rect 
            :x="cropRect.x" 
            :y="cropRect.y" 
            :width="cropRect.width" 
            :height="cropRect.height" 
            fill="black"
          />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.5)" mask="url(#crop-mask)" />
    </svg>
    
    <!-- Crop box -->
    <div 
      :style="cropStyle"
      class="absolute border-2 border-white pointer-events-auto cursor-move touch-none"
      @pointerdown="handlePointerDown($event)"
    >
      <!-- Grid lines -->
      <div class="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
        <div v-for="i in 9" :key="i" class="border border-white/30"></div>
      </div>
      
      <!-- Corner handles -->
      <div 
        class="absolute -top-3 -left-3 w-6 h-6 md:w-8 md:h-8 bg-white border-2 border-primary rounded-full cursor-nw-resize touch-none"
        @pointerdown.stop="handlePointerDown($event, 'nw')"
      ></div>
      <div 
        class="absolute -top-3 -right-3 w-6 h-6 md:w-8 md:h-8 bg-white border-2 border-primary rounded-full cursor-ne-resize touch-none"
        @pointerdown.stop="handlePointerDown($event, 'ne')"
      ></div>
      <div 
        class="absolute -bottom-3 -left-3 w-6 h-6 md:w-8 md:h-8 bg-white border-2 border-primary rounded-full cursor-sw-resize touch-none"
        @pointerdown.stop="handlePointerDown($event, 'sw')"
      ></div>
      <div 
        class="absolute -bottom-3 -right-3 w-6 h-6 md:w-8 md:h-8 bg-white border-2 border-primary rounded-full cursor-se-resize touch-none"
        @pointerdown.stop="handlePointerDown($event, 'se')"
      ></div>
      
      <!-- Edge handles -->
      <div 
        class="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 md:w-8 md:h-8 bg-white border-2 border-primary rounded-full cursor-n-resize touch-none"
        @pointerdown.stop="handlePointerDown($event, 'n')"
      ></div>
      <div 
        class="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 md:w-8 md:h-8 bg-white border-2 border-primary rounded-full cursor-s-resize touch-none"
        @pointerdown.stop="handlePointerDown($event, 's')"
      ></div>
      <div 
        class="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 bg-white border-2 border-primary rounded-full cursor-w-resize touch-none"
        @pointerdown.stop="handlePointerDown($event, 'w')"
      ></div>
      <div 
        class="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 bg-white border-2 border-primary rounded-full cursor-e-resize touch-none"
        @pointerdown.stop="handlePointerDown($event, 'e')"
      ></div>
    </div>
  </div>
</template>
