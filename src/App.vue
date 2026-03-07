<script setup lang="ts">
import { ref } from 'vue'
import ImageUpload from './components/ImageUpload.vue'
import ImageEditor from './components/ImageEditor.vue'
import RotationControls from './components/RotationControls.vue'
import CropControls from './components/CropControls.vue'
import ResizeControls from './components/ResizeControls.vue'
import FilterControls from './components/FilterControls.vue'
import ExportControls from './components/ExportControls.vue'

const selectedFile = ref<File | null>(null)
const editorRef = ref<InstanceType<typeof ImageEditor> | null>(null)
const cropAspectRatio = ref<number | null>(null)

const handleImageSelected = (file: File) => {
  selectedFile.value = file
}

const handleAspectRatioChange = (ratio: number | null) => {
  cropAspectRatio.value = ratio
}
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <!-- Header -->
    <div class="navbar bg-base-100 shadow-lg">
      <div class="flex-1">
        <a class="text-xl font-bold px-4">
          <span class="text-primary">e</span>mage
          <span class="text-xs ml-2 text-base-content/50">Image Editor</span>
        </a>
      </div>
    </div>

    <div class="container mx-auto p-6">
      <!-- Upload Section -->
      <div v-if="!selectedFile" class="max-w-2xl mx-auto">
        <div class="text-center mb-6">
          <h1 class="text-3xl font-bold mb-2">Image Manipulation Tool</h1>
          <p class="text-base-content/70">
            Upload an image to start editing. All processing happens in your browser.
          </p>
        </div>
        <ImageUpload @image-selected="handleImageSelected" />
      </div>

      <!-- Editor Section -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Sidebar Controls -->
        <div class="lg:col-span-1 space-y-4">
          <div class="card bg-base-100 shadow-md">
            <div class="card-body">
              <button
                @click="selectedFile = null"
                class="btn btn-sm btn-outline w-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                </svg>
                Load New Image
              </button>
            </div>
          </div>

          <ExportControls
            v-if="editorRef?.editor"
            :editor="editorRef.editor"
          />

          <RotationControls
            v-if="editorRef?.editor"
            :editor="editorRef.editor"
          />

          <FilterControls
            v-if="editorRef?.editor"
            :editor="editorRef.editor"
          />

          <CropControls
            v-if="editorRef?.editor"
            :editor="editorRef.editor"
            @aspect-ratio-change="handleAspectRatioChange"
          />

          <ResizeControls
            v-if="editorRef?.editor"
            :editor="editorRef.editor"
          />
        </div>

        <!-- Canvas Area -->
        <div class="lg:col-span-3">
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body">
              <ImageEditor
                ref="editorRef"
                :file="selectedFile"
                :crop-aspect-ratio="cropAspectRatio"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer footer-center p-4 bg-base-100 text-base-content mt-8">
      <div>
        <p class="text-sm">
          Client-side image editor - Your images never leave your browser
        </p>
      </div>
    </footer>
  </div>
</template>
