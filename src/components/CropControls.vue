<script setup lang="ts">
import { ref, computed } from 'vue'
import { useImageEditor } from '../composables/useImageEditor'

const props = defineProps<{
  editor: ReturnType<typeof useImageEditor>
}>()

const emit = defineEmits<{
  aspectRatioChange: [ratio: number | null]
}>()

const selectedRatio = ref<string>('free')

const aspectRatios = [
  { label: 'Free', value: 'free', ratio: null },
  { label: '1:1', value: '1:1', ratio: 1 },
  { label: '4:3', value: '4:3', ratio: 4/3 },
  { label: '3:4', value: '3:4', ratio: 3/4 },
  { label: '16:9', value: '16:9', ratio: 16/9 },
  { label: '9:16', value: '9:16', ratio: 9/16 },
  { label: '3:2', value: '3:2', ratio: 3/2 },
  { label: '2:3', value: '2:3', ratio: 2/3 }
]

const currentRatio = computed(() => {
  const selected = aspectRatios.find(r => r.value === selectedRatio.value)
  return selected?.ratio || null
})

const handleRatioChange = () => {
  emit('aspectRatioChange', currentRatio.value)
}

const toggleCropMode = () => {
  if (props.editor.cropMode.value) {
    props.editor.exitCropMode()
  } else {
    props.editor.enterCropMode()
  }
}

const applyCrop = async () => {
  await props.editor.applyCrop()
}
</script>

<template>
  <div class="card bg-base-100 shadow-md">
    <div class="card-body">
      <h3 class="card-title text-lg">Crop</h3>
      
      <div v-if="!editor.cropMode.value" class="space-y-3">
        <p class="text-sm text-base-content/70">
          Enter crop mode to adjust the crop area
        </p>
        <button @click="toggleCropMode" class="btn btn-sm md:btn-md btn-primary w-full">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" />
            <path fill-rule="evenodd" d="M3 6a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6zm2 0h10v8H5V6z" clip-rule="evenodd" />
          </svg>
          Start Cropping
        </button>
      </div>

      <div v-else class="space-y-3">
        <label class="form-control">
          <div class="label">
            <span class="label-text text-xs font-semibold">Aspect Ratio</span>
          </div>
          <select 
            v-model="selectedRatio" 
            @change="handleRatioChange"
            class="select select-bordered select-sm w-full"
          >
            <option 
              v-for="ratio in aspectRatios" 
              :key="ratio.value" 
              :value="ratio.value"
            >
              {{ ratio.label }}
            </option>
          </select>
        </label>

        <div class="flex gap-2 mt-2">
          <button @click="applyCrop" class="btn btn-sm md:btn-md btn-success flex-1 min-h-[2.5rem]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            Apply
          </button>
          <button @click="toggleCropMode" class="btn btn-sm md:btn-md btn-outline flex-1 min-h-[2.5rem]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
