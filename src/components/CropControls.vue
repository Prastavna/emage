<script setup lang="ts">
import { useImageEditor } from '../composables/useImageEditor'

const props = defineProps<{
  editor: ReturnType<typeof useImageEditor>
}>()

const applyCrop = () => {
  props.editor.crop()
}
</script>

<template>
  <div class="card bg-base-100 shadow-md">
    <div class="card-body">
      <h3 class="card-title text-lg">Crop</h3>
      <p class="text-sm text-base-content/70 mb-2">
        Use the handles on the canvas to adjust the crop area, then click Apply
      </p>
      <button @click="applyCrop" class="btn btn-sm btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" />
          <path fill-rule="evenodd" d="M3 6a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6zm2 0h10v8H5V6z" clip-rule="evenodd" />
        </svg>
        Apply Crop
      </button>
    </div>
  </div>
</template>
