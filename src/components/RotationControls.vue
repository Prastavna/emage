<script setup lang="ts">
import { ref, watch } from 'vue'
import { useImageEditor } from '../composables/useImageEditor'

const props = defineProps<{
  editor: ReturnType<typeof useImageEditor>
}>()

const rotationAngle = ref(0)
let rotationTimeout: number | null = null

const rotate90 = () => {
  rotationAngle.value = (rotationAngle.value + 90) % 360
}

const rotate180 = () => {
  rotationAngle.value = (rotationAngle.value + 180) % 360
}

const rotate270 = () => {
  rotationAngle.value = (rotationAngle.value - 90 + 360) % 360
}

const resetRotation = () => {
  rotationAngle.value = 0
}

const handleFlipHorizontal = () => {
  props.editor.flipHorizontal()
}

const handleFlipVertical = () => {
  props.editor.flipVertical()
}

// Single watcher handles all rotation changes (slider, quick buttons, reset) with debouncing
watch(rotationAngle, (newAngle) => {
  if (rotationTimeout) {
    clearTimeout(rotationTimeout)
  }
  rotationTimeout = window.setTimeout(() => {
    props.editor.setRotation(newAngle)
  }, 300)
})
</script>

<template>
  <div class="card bg-base-100 shadow-md">
    <div class="card-body">
      <h3 class="card-title text-lg">Rotation & Flip</h3>
      
      <!-- Rotation Slider -->
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <label class="label-text text-xs font-semibold">Rotation Angle</label>
          <span class="badge badge-sm">{{ rotationAngle }}°</span>
        </div>
        <input
          v-model.number="rotationAngle"
          type="range"
          min="0"
          max="359"
          step="1"
          class="range range-primary range-sm"
        />
        <div class="flex justify-between text-xs text-base-content/60">
          <span>0°</span>
          <span>90°</span>
          <span>180°</span>
          <span>270°</span>
          <span>359°</span>
        </div>
      </div>

      <div class="divider my-1"></div>

      <!-- Quick Rotation Buttons -->
      <div>
        <label class="label-text text-xs font-semibold mb-2 block">Quick Rotate</label>
        <div class="flex flex-wrap gap-2">
          <button @click="rotate90" class="btn btn-sm md:btn-md btn-primary flex-1 min-h-[2.5rem]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
            90°
          </button>
          <button @click="rotate180" class="btn btn-sm md:btn-md btn-primary flex-1 min-h-[2.5rem]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
            180°
          </button>
          <button @click="rotate270" class="btn btn-sm md:btn-md btn-primary flex-1 min-h-[2.5rem]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
            270°
          </button>
        </div>
      </div>

      <div class="divider my-1"></div>

      <!-- Flip Buttons -->
      <div>
        <label class="label-text text-xs font-semibold mb-2 block">Flip</label>
        <div class="flex gap-2">
          <button @click="handleFlipHorizontal" class="btn btn-sm md:btn-md btn-secondary flex-1 min-h-[2.5rem]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3v18M9 6l3-3 3 3M9 18l3 3 3-3"/>
              <path d="M3 12h8M13 12h8" stroke-dasharray="2 2"/>
            </svg>
            Horizontal
          </button>
          <button @click="handleFlipVertical" class="btn btn-sm md:btn-md btn-secondary flex-1 min-h-[2.5rem]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12h18M6 9l-3 3 3 3M18 9l3 3-3 3"/>
              <path d="M12 3v8M12 13v8" stroke-dasharray="2 2"/>
            </svg>
            Vertical
          </button>
        </div>
      </div>

      <div class="divider my-1"></div>

      <!-- Reset Button -->
      <button @click="resetRotation" class="btn btn-sm btn-outline w-full">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
        Reset Rotation
      </button>
    </div>
  </div>
</template>
