<template>
  <dialog
    ref="dialogRef"
    class="modal"
    @cancel="onDialogCancel"
    @close="onDialogNativeClose"
  >
    <div
      class="modal-box rounded-xl p-0 mt-10 bg-base-200 shadow-none overflow-hidden max-w-[40vw] min-w-[48rem] h-[60vh] max-h-[60vh] flex flex-col"
      :class="{ 'animate-in': open }"
    >
      <!-- Top section -->
      <div class="flex items-center h-[72px] border-b border-base-200 bg-base-200 px-4">
        <h2 class="text-2xl font-bold">Fake Scarcity</h2>
      </div>

      <!-- X close (top-right) -->
      <form method="dialog">
        <button
          class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          aria-label="Close"
          title="Close"
          @click.prevent="onXClick"
        >✕</button>
      </form>

      <!-- Middle section -->
      <div class="flex-1 flex w-full bg-base-200 justify-center items-center p-4 overflow-y-auto overflow-x-hidden">
        <div class="relative w-full flex flex-col items-center justify-center overflow-hidden">
          <!-- Content carousel -->
          <transition :name="carouselDirection" mode="out-in">
            <!-- Step 1: Product card -->
            <div v-if="step === 1" key="card" class="flex flex-col items-center justify-center">
              <div class="scale-90 origin-center">
                <ProductCard
                  :left="fakeStockInput"
                  :show-stock="stockOption === 'fake'"
                />
              </div>
            </div>

            <!-- Step 2: Stock options -->
            <div v-else key="stock" class="flex flex-col items-center justify-center">
              <div class="card bg-gradient-to-br from-base-100 to-base-200/60 shadow-xl w-full max-w-md border border-white relative overflow-hidden">
                <div class="card-body">
                  <h3 class="card-title">Stock display</h3>
                  <p class="text-sm text-base-content opacity-80 -mt-1">Choose how stock is presented to the user.</p>

                  <!-- Options -->
                  <div class="mt-3 grid gap-3">
                    <!-- Real stock tile -->
                    <label class="block cursor-pointer">
                      <input
                        v-model="stockOption"
                        type="radio"
                        name="stock"
                        value="real"
                        class="peer sr-only"
                        aria-label="Show real stock data"
                      >
                      <div
                        class="relative flex items-start gap-3 rounded-lg border border-base-300 p-3 pr-12 min-h-[64px] transition
                               peer-checked:border-primary peer-checked:bg-primary/5"
                      >
                        <div class="mt-0.5 text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 12.75L11.25 15 15 9.75l1.5 1.5-4.5 6L7.5 14.25l1.5-1.5z"/>
                          </svg>
                        </div>
                        <div class="flex-1">
                          <div class="font-medium">Show real stock</div>
                          <div class="text-xs text-base-content opacity-70">Accurate inventory reflected to the user.</div>
                        </div>
                        <span
                          v-show="stockOption === 'real'"
                          class="badge badge-primary absolute right-3 top-3 pointer-events-none"
                        >Selected</span>
                      </div>
                    </label>

                    <!-- Fake scarcity tile -->
                    <label class="block cursor-pointer">
                      <input
                        v-model="stockOption"
                        type="radio"
                        name="stock"
                        value="fake"
                        class="peer sr-only"
                        aria-label="Show fake scarcity"
                      >
                      <div
                        class="relative flex items-start gap-3 rounded-lg border border-base-300 p-3 pr-12 min-h-[64px] transition
                               peer-checked:border-warning peer-checked:bg-warning/5"
                      >
                        <div class="mt-0.5 text-warning">
                          <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11 3h2v10h-2V3zm0 14h2v2h-2v-2z"/>
                          </svg>
                        </div>
                        <div class="flex-1">
                          <div class="font-medium">Show fake scarcity</div>
                          <div class="text-xs text-base-content opacity-70">Display a low “left in stock” message.</div>
                        </div>
                        <span
                          v-show="stockOption === 'fake'"
                          class="badge badge-warning absolute right-3 top-3 pointer-events-none"
                        >Selected</span>
                      </div>
                    </label>
                  </div>

                  <!-- Fake stock input (left-aligned inline) -->
                  <div class="mt-4">
                    <div class="form-control w-full">
                      <label class="label py-1 justify-start gap-2">
                        <span class="label-text text-xs text-base-content opacity-70">Fake stock left:</span>
                        <input
                          v-model.number="fakeStockInput"
                          type="number"
                          min="1"
                          class="input input-bordered input-sm w-24 text-center"
                          :disabled="stockOption !== 'fake'"
                        >
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>

          <!-- Toggle button (next/prev) -->
          <button
            class="btn btn-circle btn-primary transition-transform duration-200 absolute right-0 top-1/2 -translate-y-1/2 z-10"
            :class="step === 2 ? 'rotate-180' : ''"
            aria-label="Next/Previous"
            @click="toggleStep"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <!-- Bottom status (always visible; message changes with progress) -->
      <div class="px-4 py-3 border-t border-base-300 bg-base-200 text-xs">
        <p class="flex items-center gap-2" :class="footerClass">
          <span v-if="footerIcon" aria-hidden="true">{{ footerIcon }}</span>
          <span>{{ footerText }}</span>
        </p>
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOpenDialog } from '~/composables/useOpenDialog.js'
import ProductCard from '~/components/ProductCard.vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  onComplete: { type: Function, default: () => {} },
  id: { type: [String, Number], default: null }
})
const emit = defineEmits(['close', 'complete'])
const dialogRef = ref(null)

const LOCAL_KEY = 'fake_scarcity_tutorial_complete'

const step = ref(1)
const carouselDirection = ref('slide-left')
const tutorialComplete = ref(false)
const stockOption = ref('fake')
const fakeStockInput = ref(2)

useOpenDialog(props, dialogRef, () => {
  // fresh state each open
  step.value = 1
  carouselDirection.value = 'slide-left'
  tutorialComplete.value = false
  stockOption.value = 'fake'
  fakeStockInput.value = 2
})

function toggleStep () {
  if (step.value === 1) {
    // going to options
    carouselDirection.value = 'slide-left'
    step.value = 2
  } else {
    // returning to product card; complete only if user chose "real"
    carouselDirection.value = 'slide-right'
    step.value = 1
    if (!tutorialComplete.value && stockOption.value === 'real') {
      tutorialComplete.value = true
      try { localStorage.setItem(LOCAL_KEY, '1') } catch { /* empty */ }
      // notify parent immediately so the step gets colored
      emit('complete', props.id || 'fakescarcity')
      if (typeof props.onComplete === 'function') props.onComplete()
    }
  }
}

// Footer status (mirrors Comparison Prevention)
const footerIcon = computed(() => {
  if (tutorialComplete.value) return '✅'
  if (step.value === 2) return '⏳'
  return '🎯'
})
const footerText = computed(() => {
  if (tutorialComplete.value) return 'Completed'
  if (step.value === 2) return 'Almost done…'
  return 'Go through both views'
})

// Close helpers (X/ESC/backdrop)
function handleClose () {
  emit('close')
  if (tutorialComplete.value && typeof props.onComplete === 'function') {
    // in case parent listens only to onComplete prop
    props.onComplete()
  }
}
function onXClick () {
  dialogRef.value?.close()
  handleClose()
}
function onDialogCancel (e) {
  e.preventDefault()
  dialogRef.value?.close()
  handleClose()
}
function onDialogNativeClose () {
  handleClose()
}
</script>

<style scoped>
/* slide transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.18s cubic-bezier(.25,.8,.25,1);
}
.slide-left-enter-from { opacity: 0; transform: translateX(100%); }
.slide-left-leave-to   { opacity: 0; transform: translateX(-100%); }
.slide-right-enter-from{ opacity: 0; transform: translateX(-100%); }
.slide-right-leave-to  { opacity: 0; transform: translateX(100%); }

/* modal open animation */
@keyframes tutorial-modal-in {
  from { opacity:0; transform: translateY(12px) scale(.97); }
  to   { opacity:1; transform: translateY(0)   scale(1); }
}
.animate-in { animation: tutorial-modal-in .28s cubic-bezier(.25,.8,.25,1); }
@media (prefers-reduced-motion: reduce) { .animate-in { animation: none; } }
</style>
