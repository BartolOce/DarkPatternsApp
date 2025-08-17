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
      <!-- Top -->
      <div class="flex items-center h-[72px] border-b border-base-200 bg-base-200 px-4">
        <h2 class="text-2xl font-bold">
          Comparison Prevention
        </h2>
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

      <!-- Middle (carousel only, chat removed) -->
      <div class="flex-1 flex w-full bg-base-200 justify-center items-center p-4 pt-6 overflow-hidden">
        <div class="relative w-full flex items-center justify-center"><!-- clip slide animations -->
          <!-- Card (centered) -->
          <div class="card cp-card bg-gradient-to-br from-base-100 to-base-200/60 border border-base-300/60 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden mb-3 w-64 max-w-64">
            <transition
              mode="out-in"
              :enter-active-class="transitionClasses.enterActive"
              :leave-active-class="transitionClasses.leaveActive"
              :enter-from-class="transitionClasses.enterFrom"
              :leave-to-class="transitionClasses.leaveTo"
            >
              <div :key="currentPlan.id">
                <div class="card-body flex flex-col gap-2 p-5 min-h-[320px] h-[320px] overflow-hidden">
                  <span class="badge badge-sm mt-1 ml-1 mb-2 uppercase tracking-wide" :class="currentPlan.badgeClass">{{ currentPlan.badge }}</span>
                  <h2 class="text-2xl font-extrabold ml-1 leading-tight -mt-0.5 tracking-tight">{{ currentPlan.title }}</h2>
                  <span class="text-xl ml-1 pb-2 font-semibold tracking-wide">{{ currentPlan.price }}</span>
                  <div class="text-sm text-base-content/80 ml-1 pb-3">{{ currentPlan.desc }}</div>
                  <div class="details-collapse">
                    <div class="details-content-wrapper-fixed ml-1">
                      <ul class="mt-0 flex flex-col gap-0 text-sm details-list">
                        <li
                          v-for="(feature, i) in currentPlan.features"
                          :key="i"
                          class="p-0 m-0 details-li pb-0"
                        >
                          <template v-if="feature.type === 'taxes' && (currentPlan.id === 'unlimited' || feature.linedOut)">
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-4 me-2 inline-block text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                            <span class="line-through text-base-content/50">{{ feature.text }}</span>
                          </template>
                          <template v-else>
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-4 me-2 inline-block text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                            <span>{{ feature.text }}</span>
                          </template>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>

          <!-- Prev (left edge, vertically centered) -->
          <button
            class="btn btn-circle btn-primary shadow-md hover:shadow-lg absolute left-2 top-1/2 -translate-y-1/2 z-10 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Previous plan"
            :disabled="currentIndex === 0"
            title="Previous"
            @click="handlePrev"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Next (right edge, vertically centered) -->
          <button
            class="btn btn-circle btn-primary shadow-md hover:shadow-lg absolute right-2 top-1/2 -translate-y-1/2 z-10 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Next plan"
            :disabled="currentIndex === plans.length - 1"
            title="Next"
            @click="handleNext"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOpenDialog } from '~/composables/useOpenDialog.js'

const LOCAL_KEY = 'comparison_prevention_tutorial_complete'

const props = defineProps({
  open: { type: Boolean, required: true },
  id: { type: [String, Number], default: null }
})
const emit = defineEmits(['close', 'complete'])
const dialogRef = ref(null)

const plans = [
  { id: 'LiteSurf', badge: 'Most Popular', badgeClass: 'badge-warning', title: 'LiteSurf', price: '$14.99/mo', desc: 'Simple data for everyday use.', features: [
    { text: '20 GB' }, { text: '5 GB EU roaming' }, { text: '500 minutes of EU calls' }, { text: '3G/4G coverage' }, { text: 'Taxes included', type: 'taxes' }
  ]},
  { id: 'SpeedBoost', badge: 'Fast', badgeClass: 'badge-warning', title: 'SpeedBoost', price: '$19.99/mo', desc: 'For smooth browsing & streaming.', features: [
    { text: '60 GB' }, { text: '15 GB EU roaming' }, { text: '4G hotspot' }, { text: 'Taxes included', type: 'taxes' }
  ]},
  { id: 'TravelMax', badge: 'Global', badgeClass: 'badge-warning', title: 'TravelMax', price: '$29.99/mo', desc: 'Perfect for frequent travelers.', features: [
    { text: '120 GB' }, { text: '60 GB EU roaming' }, { text: 'Free international calls' }, { text: 'Travel support line' }, { text: 'Taxes included', type: 'taxes' }
  ]},
  { id: 'UltraStream', badge: 'Premium', badgeClass: 'badge-warning', title: 'UltraStream', price: '$34.99/mo', desc: 'Stream, game, and share without limits', features: [
    { text: 'Unlimited data' }, { text: 'Roaming in 30+ countries' }, { text: '5G access included' }, { text: 'Taxes included', type: 'taxes', linedOut: true }
  ]}
]

const currentIndex = ref(0)
const carouselDirection = ref('slide-left')
const reachedEnd = ref(false)
const returnedToStart = ref(false)
const tutorialComplete = ref(false)

const currentPlan = computed(() => plans[currentIndex.value])

function handleNext() {
  if (currentIndex.value < plans.length - 1) {
    carouselDirection.value = 'slide-left'
    currentIndex.value++
    if (currentIndex.value === plans.length - 1) {
      reachedEnd.value = true
    }
  }
  checkCompletion()
}

function handlePrev() {
  if (currentIndex.value > 0) {
    carouselDirection.value = 'slide-right'
    currentIndex.value--
    if (currentIndex.value === 0 && reachedEnd.value) {
      returnedToStart.value = true
    }
  }
  checkCompletion()
}

function checkCompletion() {
  if (reachedEnd.value && returnedToStart.value && !tutorialComplete.value) {
  tutorialComplete.value = true
  localStorage.setItem(LOCAL_KEY, '1')
  emit('complete')               // ← fire completion event
  }
}

function handleClose() {
  emit('close')
  if (tutorialComplete.value) {
    emit('complete')               // ← ensure completion is captured if they close after finishing
  }
}

function onXClick() {
  // Close immediately
  dialogRef.value?.close()
  handleClose()
}

function onDialogCancel(e) {
  // Allow ESC to close right away, but keep our emit/onComplete semantics
  e.preventDefault()
  dialogRef.value?.close()
  handleClose()
}

function onDialogNativeClose() {
  // Backdrop click or native close: just emit
  handleClose()
}

useOpenDialog(props, dialogRef, () => {
  tutorialComplete.value = !!localStorage.getItem(LOCAL_KEY)
})

// Tailwind-based transition classes for carousel direction
const transitionClasses = computed(() => {
  const base = 'transition-all duration-200';
  return carouselDirection.value === 'slide-left'
    ? {
        enterActive: `${base} ease-out`,
        leaveActive: `${base} ease-in`,
        enterFrom: 'opacity-0 translate-x-full',
        leaveTo: 'opacity-0 -translate-x-full',
      }
    : {
        enterActive: `${base} ease-out`,
        leaveActive: `${base} ease-in`,
        enterFrom: 'opacity-0 -translate-x-full',
        leaveTo: 'opacity-0 translate-x-full',
      }
})
</script>

<style scoped>
/* Keep modal open animation only */
@keyframes tutorial-modal-in { from { opacity:0; transform:translateY(12px) scale(.97);} to { opacity:1; transform:translateY(0) scale(1);} }
.animate-in { animation:tutorial-modal-in .28s cubic-bezier(.25,.8,.25,1); }
@media (prefers-reduced-motion:reduce){ .animate-in { animation:none; } }

/* Card polish */
.cp-card {
  border-radius: 0.9rem;
  will-change: transform;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}

/* Details section: subtly hide the bottom to prevent easy comparison */
.details-collapse {
  position: relative;
  max-height: 140px; /* keep a fixed viewport for the list */
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0));
          mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 70%, rgba(0,0,0,0));
}
.details-content-wrapper-fixed { padding-right: .25rem; }
.details-list { list-style: none; padding: 0; margin: 0; }
.details-li { margin: .15rem 0; }
</style>