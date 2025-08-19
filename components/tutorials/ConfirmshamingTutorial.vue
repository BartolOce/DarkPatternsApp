<template>
  <dialog
    ref="dialogRef"
    class="modal"
    @cancel="onDialogCancel"
    @close="onDialogNativeClose"
  >
    <div
      class="modal-box rounded-xl p-0 mt-10 bg-base-200 shadow-none overflow-hidden max-w-[40vw] min-w-[48rem] h-[70vh] max-h-[70vh] flex flex-col"
      :class="{ 'animate-in': open }"
    >
      <!-- Top -->
      <div class="flex items-center h-[72px] border-b border-base-200 bg-base-200 px-4">
        <h2 class="text-2xl font-bold">Confirmshaming</h2>
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

      <!-- Middle -->
      <div class="flex-1 flex w-full bg-base-200 justify-center items-center p-4 overflow-y-auto">
        <div class="w-auto">
          <div class="w-full max-w-sm mx-auto mt-6">
            <!-- Single keyed transition for loader + cards -->
            <transition
              mode="out-in"
              :enter-active-class="'transition-all duration-180 ease-out'"
              :leave-active-class="'transition-all duration-150 ease-in'"
              :enter-from-class="'opacity-0 translate-y-3 scale-95'"
              :leave-to-class="'opacity-0 -translate-y-3 scale-95'"
            >
              <!-- Loading -->
              <div
                v-if="view === 'loading'"
                key="loading"
                class="w-full flex flex-col items-center justify-center py-12"
                aria-live="polite"
              >
                <span class="loading loading-spinner loading-lg text-primary" aria-label="Loading"/>
                <div class="text-sm text-base-content opacity-70 mt-3">
                  {{ loaderText || 'Loading…' }}
                </div>
              </div>

              <!-- Step 1: Offer -->
              <div
                v-else-if="view === 'step-1'"
                key="s1"
                class="card confirm-card bg-gradient-to-br from-base-100 to-base-200/60 border border-base-300/60 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 p-5 md:p-6 focus-within:ring-2 focus-within:ring-primary/30"
              >
                <div class="card-body items-center text-center gap-3 md:gap-4">
                  <h3 class="card-title text-lg md:text-xl mb-1.5">🎁 Get 10% Off Your First Purchase!</h3>
                  <p class="text-sm md:text-base text-base-content opacity-70 mb-2">
                    Subscribe to our newsletter and save on your first order.
                  </p>
                  <div class="flex flex-col gap-2 w-full">
                    <button class="btn btn-primary btn-block shadow-sm hover:shadow" @click="handleSubscribe">
                      Subscribe &amp; Save 10%
                    </button>
                    <button
                      class="btn btn-ghost btn-block hover:bg-base-200/70"
                      @click="denyVoucher"
                    >
                      No, I don’t want to save money
                    </button>
                  </div>
                </div>
              </div>

              <!-- Step 2: Confirm shame -->
              <div
                v-else-if="view === 'step-2'"
                key="s2"
                class="card confirm-card bg-gradient-to-br from-base-100 to-base-200/60 border border-base-300/60 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 p-5 md:p-6 mb-6 focus-within:ring-2 focus-within:ring-primary/30"
              >
                <div class="card-body items-center text-center gap-3 md:gap-4">
                  <h3 class="card-title text-lg md:text-xl mb-1.5">Are you sure?</h3>
                  <p class="text-sm md:text-base text-base-content opacity-70 mb-2">
                    Are you sure you want to pay more for your first buy?
                  </p>
                  <div class="flex flex-col gap-2 w-full">
                    <button class="btn btn-primary btn-block shadow-sm hover:shadow" @click="backToVoucher">
                      Go Back
                    </button>
                    <button
                      class="btn btn-ghost btn-block hover:bg-base-200/70"
                      @click="confirmPayMore"
                    >
                      Yes, I want to pay more
                    </button>
                  </div>
                </div>
              </div>

              <!-- Step 3: Code shown -->
              <div
                v-else
                key="s3"
                class="card confirm-card bg-gradient-to-br from-base-100 to-base-200/60 border border-base-300/60 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 p-5 md:p-6 mb-6 focus-within:ring-2 focus-within:ring-primary/30"
              >
                <div class="card-body items-center text-center gap-3 md:gap-4">
                  <h3 class="card-title text-lg md:text-xl mb-1.5">Your discount code</h3>
                  <p class="text-sm md:text-base text-base-content opacity-70 mb-1.5">
                    Apply this code at checkout to save:
                  </p>
                  <div
                    class="font-mono text-xl font-bold tracking-wider mb-4 select-all bg-gradient-to-br from-base-300/80 to-base-200/60 text-base-content px-3 py-2 rounded-md border border-base-300 ring-1 ring-primary/20 shadow-inner"
                  >
                    {{ discountCode }}
                  </div>
                  <div class="flex flex-col gap-2 w-full">
                    <button class="btn btn-primary btn-block shadow-sm hover:shadow" @click="applyCode">
                      Use code
                    </button>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
      <!-- Bottom status -->
      <div class="px-4 py-3 border-t border-base-300 bg-base-200 text-xs">
        <p class="flex items-center gap-2">
          <span v-if="footerIcon" aria-hidden="true">{{ footerIcon }}</span>
          <span :class="footerClass">{{ footerText }}</span>
        </p>
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useOpenDialog } from '~/composables/useOpenDialog.js'

const props = defineProps({
  open: { type: Boolean, required: true },
  onComplete: { type: Function, default: () => {} },
  id: { type: [String, Number], default: null }
})

const emit = defineEmits(['close', 'complete'])
const dialogRef = ref(null)
const step = ref(1)
const tutorialComplete = ref(false)
const isLoading = ref(false)
const loaderText = ref('')
const view = computed(() => (isLoading.value ? 'loading' : `step-${step.value}`))
const discountCode = ref('')

function genDiscountCode () {
  return `SAVE10-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

useOpenDialog(props, dialogRef, () => {
  step.value = 1
  isLoading.value = false
  loaderText.value = ''
  tutorialComplete.value = false
})

function handleSubscribe () {
  discountCode.value = genDiscountCode()
  step.value = 3
}
function denyVoucher () { step.value = 2 }
function backToVoucher () { step.value = 1 }
function confirmPayMore () {
  if (!tutorialComplete.value) {
    tutorialComplete.value = true
    emit('complete', props.id || 'confirmshaming')
    if (typeof props.onComplete === 'function') props.onComplete()
  }
  goToLoadingThen(1, 900, 'resetting view')
}
function applyCode () { goToLoadingThen(1, 900, 'resetting view') }

function goToLoadingThen (targetStep, delay = 900, message = 'Loading…') {
  loaderText.value = message
  isLoading.value = true
  setTimeout(async () => {
    step.value = targetStep
    await nextTick()
    isLoading.value = false
    loaderText.value = ''
  }, delay)
}

const footerIcon = computed(() => {
  if (tutorialComplete.value) return '✅'
  if (view.value === 'step-2') return '⏳'
  return '🎯'
})
const footerText = computed(() => {
  if (tutorialComplete.value) {
    return 'By mocking the “no” choice, the UI uses guilt to steer decisions, undermining free choice.'
  }
  if (view.value === 'step-2') {
    return 'Did they really have to point out you’ll pay more? Nevertheless, let’s choose not to subscribe to the newsletter.'
  }
  return 'Let’s avoid extra emails — pick option 2.'
})
const footerClass = computed(() => {
  if (tutorialComplete.value) return 'text-success'
  if (view.value === 'step-2') return 'text-warning'
  return ''
})

function handleClose () {
  emit('close')
  if (tutorialComplete.value && typeof props.onComplete === 'function') {
    props.onComplete()
  }
}
function onXClick () { dialogRef.value?.close() }
function onDialogCancel () {}
function onDialogNativeClose () { handleClose() }
</script>

<style scoped>
@keyframes tutorial-modal-in {
  from { opacity: 0; transform: translateY(12px) scale(.97); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}
.animate-in { animation: tutorial-modal-in .28s cubic-bezier(.25,.8,.25,1); }
@media (prefers-reduced-motion: reduce){ .animate-in { animation: none; } }

.confirm-card {
  border-radius: .9rem;
  will-change: transform;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
</style>
