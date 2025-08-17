<!-- file: components/tutorials/FakeUrgencyTutorial.vue -->
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
        <h2 class="text-2xl font-bold">Fake Urgency</h2>
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
      <div class="flex-1 flex w-full bg-base-200 justify-center items-center p-4 overflow-y-auto">
        <div class="relative w-full flex flex-col items-center justify-center gap-6">
          <!-- Card with countdown -->
          <div
            class="card urgency-card bg-gradient-to-br from-base-100 to-base-200/60 border border-base-300/60 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 w-full max-w-md overflow-hidden"
            :class="{ 'urgency-critical': isCritical }"
          >
            <!-- Ribbon -->
            <div class="w-full px-4 py-2 bg-error/10 text-error text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2">
              🔥 Limited time offer
            </div>

            <div class="card-body items-center text-center gap-4 p-6">
              <span class="text-xl md:text-2xl font-extrabold text-error/90">{{ currentSale.name }}</span>

              <!-- Progress -->
              <div class="w-full flex items-center gap-3">
                <progress class="progress progress-error w-full h-2 rounded-full" :value="elapsedSeconds" :max="totalSeconds"/>
                <span class="text-xs tabular-nums text-base-content opacity-70 min-w-[3ch] text-right">{{ progressPct }}%</span>
              </div>

              <div class="text-sm text-base-content opacity-70 -mt-1">
                ⏳ Only <span class="font-semibold text-error/90">{{ secondsLeft }}</span> seconds left
              </div>

              <div class="grid auto-cols-max grid-flow-col gap-5 text-center">
                <div
                  class="bg-neutral rounded-box text-neutral-content flex flex-col p-2 shadow-inner border transition-colors duration-200"
                  :class="isCritical ? 'border-error' : 'border-transparent'"
                >
                  <span class="countdown font-mono text-5xl">
                    <span :style="`--value:${countdown.days}`" aria-live="polite" :aria-label="countdown.days">{{ countdown.days }}</span>
                  </span>
                  days
                </div>
                <div
                  class="bg-neutral rounded-box text-neutral-content flex flex-col p-2 shadow-inner border transition-colors duration-200"
                  :class="isCritical ? 'border-error' : 'border-transparent'"
                >
                  <span class="countdown font-mono text-5xl">
                    <span :style="`--value:${countdown.hours}`" aria-live="polite" :aria-label="countdown.hours">{{ countdown.hours }}</span>
                  </span>
                  hours
                </div>
                <div
                  class="bg-neutral rounded-box text-neutral-content flex flex-col p-2 shadow-inner border transition-colors duration-200"
                  :class="isCritical ? 'border-error' : 'border-transparent'"
                >
                  <span class="countdown font-mono text-5xl">
                    <span :style="`--value:${countdown.minutes}`" aria-live="polite" :aria-label="countdown.minutes">{{ countdown.minutes }}</span>
                  </span>
                  min
                </div>
                <div
                  class="bg-neutral rounded-box text-neutral-content flex flex-col p-2 shadow-inner border transition-colors duration-200"
                  :class="isCritical ? 'border-error' : 'border-transparent'"
                >
                  <span class="countdown font-mono text-5xl">
                    <span :style="`--value:${countdown.seconds}`" aria-live="polite" :aria-label="countdown.seconds">{{ countdown.seconds }}</span>
                  </span>
                  sec
                </div>
              </div>
            </div>
          </div>

          <button class="btn btn-error btn-outline" :disabled="isForcing" @click="forceEndCountdown">
            End Sale Now
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
import { ref, computed, onBeforeUnmount } from 'vue'
import { useOpenDialog } from '~/composables/useOpenDialog.js'

const props = defineProps({
  open: { type: Boolean, required: true },
  onComplete: { type: Function, default: () => {} },
  id: { type: [String, Number], default: null }
})
const emit = defineEmits(['close', 'complete'])
const dialogRef = ref(null)

/** Countdown data */
const BASE_DURATION = Object.freeze({ days: 0, hours: 0, minutes: 0, seconds: 20 })
const sales = [
  { name: 'Flash Sale: 50% OFF!', duration: { ...BASE_DURATION } },
  { name: 'Limited Time: Free Shipping!', duration: { ...BASE_DURATION } },
  { name: 'Today Only: Buy 1 Get 1 Free!', duration: { ...BASE_DURATION } }
]

const saleIndex = ref(0)
const currentSale = computed(() => sales[saleIndex.value])

const countdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
const timer = ref(null)
const isForcing = ref(false)
const isEnding = ref(false)
const END_HOLD_MS = 1200

/** Progress stage (no persistence): 0 → start, 1 → Almost done…, 2 → Completed */
const stage = ref(0)

/** UI helpers */
const toSeconds = (t) => (((t.days || 0) * 24 + (t.hours || 0)) * 60 + (t.minutes || 0)) * 60 + (t.seconds || 0)
const totalSeconds = computed(() => toSeconds(currentSale.value.duration))
const secondsLeft = computed(() => toSeconds(countdown.value))
const elapsedSeconds = computed(() => Math.max(0, totalSeconds.value - secondsLeft.value))
const progressPct = computed(() => {
  const t = totalSeconds.value || 1
  return Math.min(100, Math.max(0, Math.round((elapsedSeconds.value / t) * 100)))
})
const isCritical = computed(() => secondsLeft.value <= 10)

/** Footer status */
const footerIcon = computed(() => {
  if (stage.value >= 2) return '✅'
  if (stage.value >= 1) return '⏳'
  return '🎯'
})
const footerText = computed(() => {
  if (stage.value >= 2) return 'Completed'
  if (stage.value >= 1) return 'Almost done…'
  return 'Go through two sale cycles'
})
const footerClass = computed(() => {
  if (stage.value >= 2) return 'text-success font-semibold'
  if (stage.value >= 1) return 'text-warning font-medium'
  return 'text-base-content opacity-70'
})

/** Countdown controls */
function resetCountdown () {
  countdown.value = { ...currentSale.value.duration }
}
function tick () {
  if (countdown.value.seconds > 0) {
    countdown.value.seconds--
  } else if (countdown.value.minutes > 0) {
    countdown.value.minutes--
    countdown.value.seconds = 59
  } else if (countdown.value.hours > 0) {
    countdown.value.hours--
    countdown.value.minutes = 59
    countdown.value.seconds = 59
  } else if (countdown.value.days > 0) {
    countdown.value.days--
    countdown.value.hours = 23
    countdown.value.minutes = 59
    countdown.value.seconds = 59
  } else {
    handleSaleEnd()
  }
}
function startCountdown () {
  resetCountdown()
  clearInterval(timer.value)
  timer.value = setInterval(tick, 1000)
}
function advanceSale () {
  saleIndex.value = (saleIndex.value + 1) % sales.length
  resetCountdown()
  isForcing.value = false
  isEnding.value = false
  startCountdown()
}

/** End sale handler:
 *  - 1st end → stage 1 (“Almost done…”)
 *  - 2nd end → stage 2 (“Completed”) and emit complete
 */
function handleSaleEnd () {
  if (isEnding.value) return
  isEnding.value = true
  clearInterval(timer.value)
  countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }

  if (stage.value === 0) {
    stage.value = 1
  } else if (stage.value === 1) {
    stage.value = 2
    // notify parent immediately so the step gets colored
    emit('complete', props.id || 'fakeurgency')
    if (typeof props.onComplete === 'function') props.onComplete()
  }

  setTimeout(() => { advanceSale() }, END_HOLD_MS)
}

function forceEndCountdown () {
  if (isEnding.value) return
  isForcing.value = true
  countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
  handleSaleEnd()
}

/** Dialog lifecycle */
function handleClose () {
  emit('close')
  if (stage.value >= 2 && typeof props.onComplete === 'function') {
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

useOpenDialog(props, dialogRef, () => {
  // Always start fresh
  stage.value = 0
  saleIndex.value = 0
  isForcing.value = false
  isEnding.value = false
  startCountdown()
})

onBeforeUnmount(() => {
  clearInterval(timer.value)
})
</script>

<style scoped>
/* modal open animation */
@keyframes tutorial-modal-in {
  from { opacity:0; transform: translateY(12px) scale(.97); }
  to   { opacity:1; transform: translateY(0)   scale(1); }
}
.animate-in { animation: tutorial-modal-in .28s cubic-bezier(.25,.8,.25,1); }
@media (prefers-reduced-motion: reduce) { .animate-in { animation: none; } }

/* urgency card polish */
.urgency-card {
  border-radius: 0.9rem;
  will-change: transform;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
@keyframes urgency-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.25); }
  50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0.0); }
}
.urgency-critical {
  animation: urgency-pulse 1.1s ease-in-out infinite;
  outline: none;
}
</style>
