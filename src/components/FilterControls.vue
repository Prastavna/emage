<script setup lang="ts">
import { ref, watch } from 'vue'
import { useImageEditor } from '../composables/useImageEditor'
import type { FilterPreset } from '../composables/useImageEditor'

const props = defineProps<{
  editor: ReturnType<typeof useImageEditor>
}>()

const brightness = ref(0)
const contrast = ref(0)
const saturation = ref(0)
const grayscale = ref(false)
const sepia = ref(false)
const invert = ref(false)
const hue = ref(0)
const preset = ref<FilterPreset>('')

const presets: { value: FilterPreset; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'kodachrome', label: 'Kodachrome' },
  { value: 'technicolor', label: 'Technicolor' },
  { value: 'polaroid', label: 'Polaroid' },
  { value: 'brownie', label: 'Brownie' }
]

let brightnessTimeout: number | null = null
let contrastTimeout: number | null = null
let saturationTimeout: number | null = null
let hueTimeout: number | null = null

// Watch for changes and apply filters with debouncing
watch(brightness, (value) => {
  if (brightnessTimeout) {
    clearTimeout(brightnessTimeout)
  }
  brightnessTimeout = window.setTimeout(() => {
    props.editor.setBrightness(value)
  }, 300)
})

watch(contrast, (value) => {
  if (contrastTimeout) {
    clearTimeout(contrastTimeout)
  }
  contrastTimeout = window.setTimeout(() => {
    props.editor.setContrast(value)
  }, 300)
})

watch(saturation, (value) => {
  if (saturationTimeout) {
    clearTimeout(saturationTimeout)
  }
  saturationTimeout = window.setTimeout(() => {
    props.editor.setSaturation(value)
  }, 300)
})

watch(hue, (value) => {
  if (hueTimeout) {
    clearTimeout(hueTimeout)
  }
  hueTimeout = window.setTimeout(() => {
    props.editor.setHue(value)
  }, 300)
})

watch(grayscale, (value) => {
  props.editor.toggleGrayscale(value)
})

watch(sepia, (value) => {
  props.editor.toggleSepia(value)
})

watch(invert, (value) => {
  props.editor.toggleInvert(value)
})

const selectPreset = (value: FilterPreset) => {
  preset.value = value
  props.editor.setPreset(value)
}

const resetFilters = () => {
  brightness.value = 0
  contrast.value = 0
  saturation.value = 0
  grayscale.value = false
  sepia.value = false
  invert.value = false
  hue.value = 0
  preset.value = ''
  props.editor.setPreset('')
}

// When the editor reloads/resets the base image, mirror its cleared state in the
// sliders so the UI matches what's actually applied.
watch(() => props.editor.resetSignal.value, () => {
  resetFilters()
})
</script>

<template>
  <div class="card bg-base-100 shadow-md">
    <div class="card-body">
      <h3 class="card-title text-lg">Filters</h3>

      <div class="space-y-4">
        <!-- Preset Looks -->
        <div>
          <label class="label-text font-semibold">Presets</label>
          <div class="grid grid-cols-3 gap-2 mt-2">
            <button
              v-for="p in presets"
              :key="p.value || 'none'"
              @click="selectPreset(p.value)"
              :class="[
                'btn btn-xs',
                preset === p.value ? 'btn-primary' : 'btn-outline'
              ]"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <div class="divider my-2"></div>

        <!-- Grayscale Toggle -->
        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-3">
            <input
              v-model="grayscale"
              type="checkbox"
              class="toggle toggle-primary"
            />
            <span class="label-text font-semibold">Black & White</span>
          </label>
        </div>

        <!-- Sepia Toggle -->
        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-3">
            <input
              v-model="sepia"
              type="checkbox"
              class="toggle toggle-primary"
            />
            <span class="label-text font-semibold">Sepia</span>
          </label>
        </div>

        <!-- Invert Toggle -->
        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-3">
            <input
              v-model="invert"
              type="checkbox"
              class="toggle toggle-primary"
            />
            <span class="label-text font-semibold">Invert Colors</span>
          </label>
        </div>

        <div class="divider my-2"></div>

        <!-- Brightness -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="label-text font-semibold">Brightness</label>
            <span class="badge badge-sm">{{ brightness > 0 ? '+' : '' }}{{ brightness }}</span>
          </div>
          <input
            v-model.number="brightness"
            type="range"
            min="-1"
            max="1"
            step="0.01"
            class="range range-primary range-sm"
          />
          <div class="flex justify-between text-xs text-base-content/60 mt-1">
            <span>Dark</span>
            <span>Normal</span>
            <span>Bright</span>
          </div>
        </div>

        <!-- Contrast -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="label-text font-semibold">Contrast</label>
            <span class="badge badge-sm">{{ contrast > 0 ? '+' : '' }}{{ contrast }}</span>
          </div>
          <input
            v-model.number="contrast"
            type="range"
            min="-1"
            max="1"
            step="0.01"
            class="range range-primary range-sm"
          />
          <div class="flex justify-between text-xs text-base-content/60 mt-1">
            <span>Low</span>
            <span>Normal</span>
            <span>High</span>
          </div>
        </div>

        <!-- Saturation -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="label-text font-semibold">Saturation</label>
            <span class="badge badge-sm">{{ saturation > 0 ? '+' : '' }}{{ saturation }}</span>
          </div>
          <input
            v-model.number="saturation"
            type="range"
            min="-1"
            max="1"
            step="0.01"
            class="range range-primary range-sm"
          />
          <div class="flex justify-between text-xs text-base-content/60 mt-1">
            <span>Desaturated</span>
            <span>Normal</span>
            <span>Vibrant</span>
          </div>
        </div>

        <!-- Hue -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="label-text font-semibold">Hue</label>
            <span class="badge badge-sm">{{ hue > 0 ? '+' : '' }}{{ hue }}°</span>
          </div>
          <input
            v-model.number="hue"
            type="range"
            min="-180"
            max="180"
            step="1"
            class="range range-primary range-sm"
          />
          <div class="flex justify-between text-xs text-base-content/60 mt-1">
            <span>-180°</span>
            <span>0°</span>
            <span>+180°</span>
          </div>
        </div>

        <div class="divider my-2"></div>

        <button @click="resetFilters" class="btn btn-sm btn-outline w-full">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
          </svg>
          Reset Filters
        </button>
      </div>
    </div>
  </div>
</template>
