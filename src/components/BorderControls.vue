<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useImageEditor } from '../composables/useImageEditor'

const props = defineProps<{
  editor: ReturnType<typeof useImageEditor>
}>()

const borderWidth = ref(0)
const borderColor = ref('#000000')
const borderStyle = ref<'solid' | 'rounded' | 'dashed' | 'dotted' | 'double'>('solid')
const borderRadius = ref(0)
const recentColors = ref<string[]>([])

const STORAGE_KEY = 'border-color-history'
const MAX_RECENT_COLORS = 4
const EXCLUDED_COLORS = ['#000000', '#ffffff']

let borderWidthTimeout: number | null = null
let borderRadiusTimeout: number | null = null
let borderColorTimeout: number | null = null

// Load recent colors from localStorage
const loadRecentColors = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      recentColors.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading recent colors:', error)
    recentColors.value = []
  }
}

// Save color to recent colors
const saveColorToHistory = (color: string) => {
  // Don't save black or white
  if (EXCLUDED_COLORS.includes(color.toLowerCase())) return
  
  // Don't save if it's already the first color
  if (recentColors.value[0] === color) return
  
  // Remove the color if it exists in the array
  const filtered = recentColors.value.filter(c => c !== color)
  
  // Add to the beginning
  recentColors.value = [color, ...filtered].slice(0, MAX_RECENT_COLORS)
  
  // Save to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentColors.value))
  } catch (error) {
    console.error('Error saving recent colors:', error)
  }
}

// Watch for border width changes with debouncing
watch(borderWidth, () => {
  if (borderWidthTimeout) {
    clearTimeout(borderWidthTimeout)
  }
  borderWidthTimeout = window.setTimeout(() => {
    applyBorder()
  }, 300)
})

// Watch for border radius changes with debouncing
watch(borderRadius, () => {
  if (borderRadiusTimeout) {
    clearTimeout(borderRadiusTimeout)
  }
  borderRadiusTimeout = window.setTimeout(() => {
    applyBorder()
  }, 300)
})

// Watch for color changes with debouncing
watch(borderColor, (newColor) => {
  if (borderColorTimeout) {
    clearTimeout(borderColorTimeout)
  }
  borderColorTimeout = window.setTimeout(() => {
    applyBorder()
    saveColorToHistory(newColor)
  }, 300)
})

// Watch for style changes (immediate)
watch(borderStyle, () => {
  applyBorder()
})

const applyBorder = () => {
  if (borderWidth.value > 0) {
    props.editor.applyBorder(
      borderWidth.value,
      borderColor.value,
      borderStyle.value === 'rounded' ? borderRadius.value : 0,
      borderStyle.value
    )
  } else {
    props.editor.removeBorder()
  }
}

const setColor = (color: string) => {
  borderColor.value = color
}

const resetBorder = () => {
  borderWidth.value = 0
  borderColor.value = '#000000'
  borderStyle.value = 'solid'
  borderRadius.value = 0
  props.editor.removeBorder()
}

onMounted(() => {
  loadRecentColors()
})
</script>

<template>
  <div class="card bg-base-100 shadow-md">
    <div class="card-body">
      <h3 class="card-title text-lg">Border</h3>
      
      <div class="space-y-4">
        <!-- Border Width Slider & Input -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="label-text font-semibold">Width</label>
            <input
              v-model.number="borderWidth"
              type="number"
              min="0"
              max="100"
              class="input input-bordered input-xs w-20 text-center"
            />
          </div>
          <input
            v-model.number="borderWidth"
            type="range"
            min="0"
            max="100"
            step="1"
            class="range range-primary range-sm"
          />
          <div class="flex justify-between text-xs text-base-content/60 mt-1">
            <span>None</span>
            <span>50px</span>
            <span>100px</span>
          </div>
        </div>

        <!-- Border Color -->
        <div>
          <label class="label-text font-semibold mb-2 block">Color</label>
          <div class="flex gap-2 items-center mb-2">
            <input
              v-model="borderColor"
              type="color"
              class="w-12 h-10 rounded cursor-pointer border-2 border-base-300"
            />
            <input
              v-model="borderColor"
              type="text"
              class="input input-bordered input-sm flex-1"
              placeholder="#000000"
            />
          </div>
          
          <!-- Common Colors & Recent Colors -->
          <div class="flex flex-wrap gap-2 mt-2">
            <button
              @click="setColor('#000000')"
              class="w-8 h-8 rounded border-2 border-base-300 cursor-pointer hover:scale-110 transition-transform"
              style="background-color: #000000"
              title="Black"
            />
            <button
              @click="setColor('#ffffff')"
              class="w-8 h-8 rounded border-2 border-base-300 cursor-pointer hover:scale-110 transition-transform"
              style="background-color: #ffffff"
              title="White"
            />
            <button
              v-for="color in recentColors"
              :key="color"
              @click="setColor(color)"
              class="w-8 h-8 rounded border-2 border-base-300 cursor-pointer hover:scale-110 transition-transform"
              :style="{ backgroundColor: color }"
              :title="color"
            />
          </div>
        </div>

        <!-- Border Style -->
        <div>
          <label class="label-text font-semibold mb-2 block">Style</label>
          <div class="grid grid-cols-3 gap-2 mb-2">
            <button
              @click="borderStyle = 'solid'"
              :class="[
                'btn btn-xs',
                borderStyle === 'solid' ? 'btn-primary' : 'btn-outline'
              ]"
            >
              Solid
            </button>
            <button
              @click="borderStyle = 'dashed'"
              :class="[
                'btn btn-xs',
                borderStyle === 'dashed' ? 'btn-primary' : 'btn-outline'
              ]"
            >
              Dashed
            </button>
            <button
              @click="borderStyle = 'dotted'"
              :class="[
                'btn btn-xs',
                borderStyle === 'dotted' ? 'btn-primary' : 'btn-outline'
              ]"
            >
              Dotted
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="borderStyle = 'double'"
              :class="[
                'btn btn-xs',
                borderStyle === 'double' ? 'btn-primary' : 'btn-outline'
              ]"
            >
              Double
            </button>
            <button
              @click="borderStyle = 'rounded'"
              :class="[
                'btn btn-xs',
                borderStyle === 'rounded' ? 'btn-primary' : 'btn-outline'
              ]"
            >
              Rounded
            </button>
          </div>
        </div>

        <!-- Border Radius (only for rounded style) -->
        <div v-if="borderStyle === 'rounded'">
          <div class="flex justify-between items-center mb-2">
            <label class="label-text font-semibold">Corner Radius</label>
            <span class="badge badge-sm">{{ borderRadius }}px</span>
          </div>
          <input
            v-model.number="borderRadius"
            type="range"
            min="0"
            max="200"
            step="5"
            class="range range-primary range-sm"
          />
          <div class="flex justify-between text-xs text-base-content/60 mt-1">
            <span>Square</span>
            <span>100px</span>
            <span>200px</span>
          </div>
        </div>

        <div class="divider my-2"></div>

        <button @click="resetBorder" class="btn btn-sm btn-outline w-full">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
          </svg>
          Remove Border
        </button>
      </div>
    </div>
  </div>
</template>
