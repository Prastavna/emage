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

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

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
    const handle = resizeHandle.value
    const minSize = 50

    // Image edges in overlay/canvas coordinate space.
    const imgLeft = props.imageBounds.left
    const imgTop = props.imageBounds.top
    const imgRight = imgLeft + props.imageBounds.width
    const imgBottom = imgTop + props.imageBounds.height

    // Current crop edges.
    let left = cropRect.value.x
    let top = cropRect.value.y
    let right = left + cropRect.value.width
    let bottom = top + cropRect.value.height

    const ratio = props.aspectRatio

    if (!ratio) {
      // Free resize: move only the dragged edges. Each moving edge is clamped to
      // the image boundary and may not cross the opposite (anchored) edge — so
      // once an edge hits the image edge it simply stops, and the opposite edge
      // never moves.
      if (handle.includes('w')) left = clamp(left + deltaX, imgLeft, right - minSize)
      if (handle.includes('e')) right = clamp(right + deltaX, left + minSize, imgRight)
      if (handle.includes('n')) top = clamp(top + deltaY, imgTop, bottom - minSize)
      if (handle.includes('s')) bottom = clamp(bottom + deltaY, top + minSize, imgBottom)

      cropRect.value = { x: left, y: top, width: right - left, height: bottom - top }
    } else {
      // Aspect-locked resize. One axis is the "driver" (the one the dragged
      // handle moves along); the perpendicular dimension is always derived from
      // the ratio, so the ratio can never drift.
      const horizontal = handle.includes('e') || handle.includes('w')

      // The edge opposite the dragged one is the anchor and stays fixed. A pure
      // edge handle (no opposite component on the perpendicular axis) grows
      // symmetrically about that axis's center.
      const anchorLeft = handle.includes('e')   // dragging east → left edge fixed
      const anchorRight = handle.includes('w')  // dragging west → right edge fixed
      const anchorTop = handle.includes('s')    // dragging south → top edge fixed
      const anchorBottom = handle.includes('n') // dragging north → bottom edge fixed

      const centerX = (left + right) / 2
      const centerY = (top + bottom) / 2

      // Drive the size off the dragged axis, derive the other from the ratio.
      let width = right - left
      let height = bottom - top
      if (horizontal) {
        if (handle.includes('w')) width -= deltaX
        if (handle.includes('e')) width += deltaX
        height = width / ratio
      } else {
        if (handle.includes('n')) height -= deltaY
        if (handle.includes('s')) height += deltaY
        width = height * ratio
      }

      // Minimum size, preserving the ratio.
      if (width < minSize) { width = minSize; height = width / ratio }
      if (height < minSize) { height = minSize; width = height * ratio }

      // Space available given each axis's anchor. For a symmetric (centered)
      // axis the limit is twice the distance to the nearest image edge.
      const maxWidth = anchorLeft ? imgRight - left
        : anchorRight ? right - imgLeft
        : Math.min(centerX - imgLeft, imgRight - centerX) * 2
      const maxHeight = anchorTop ? imgBottom - top
        : anchorBottom ? bottom - imgTop
        : Math.min(centerY - imgTop, imgBottom - centerY) * 2

      // Clamp to whichever axis runs out of room first, keeping the ratio. When
      // the box hits an image edge it stops growing on BOTH axes.
      if (width > maxWidth) { width = maxWidth; height = width / ratio }
      if (height > maxHeight) { height = maxHeight; width = height * ratio }

      // Reposition from the anchors.
      if (anchorLeft) right = left + width
      else if (anchorRight) left = right - width
      else { left = centerX - width / 2 }

      if (anchorTop) bottom = top + height
      else if (anchorBottom) top = bottom - height
      else { top = centerY - height / 2 }

      cropRect.value = { x: left, y: top, width, height }
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
