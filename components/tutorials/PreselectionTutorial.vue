<!-- file: components/tutorials/PreselectionTutorial.vue -->
<template>
  <dialog ref="dialogRef" class="modal" @cancel="onDialogCancel" @close="onDialogNativeClose">
    <div
      class="modal-box rounded-xl p-0 mt-10 bg-base-200 shadow-none overflow-hidden max-w-[40vw] min-w-[48rem] h-[60vh] max-h-[60vh] flex flex-col"
      :class="{ 'animate-in': open }"
    >
      <!-- Top (pinned) -->
      <div class="flex items-center h-[72px] border-b border-base-200 bg-base-200 px-4 flex-shrink-0">
        <h2 class="text-2xl font-bold">Preselection</h2>
      </div>

      <!-- X -->
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close" title="Close" @click.prevent="onXClick">✕</button>
      </form>

      <!-- Middle (scrollable) -->
      <div class="flex-1 min-h-0 flex items-center justify-center w-full bg-base-200 overflow-y-auto overflow-x-hidden p-4">
        <div class="w-full max-w-md">
          <transition name="fade" mode="out-in">
            <!-- Step 1 -->
            <div v-if="step === 1" key="prefs" class="card bg-gradient-to-br from-base-100 to-base-200/60 border border-white shadow-lg card-compact">
              <div class="card-body">
                <h3 class="card-title">Cookie preferences</h3>
                <p class="text-sm opacity-80">We value your privacy. Choose which cookies to allow.</p>

                <div class="mt-3 space-y-2">
                  <!-- Strictly necessary -->
                  <div class="flex items-center justify-between gap-3 rounded-md p-2 bg-base-200/40">
                    <div>
                      <div class="font-semibold text-sm">Strictly necessary</div>
                      <div class="text-xs opacity-70">Required to make the site work.</div>
                    </div>
                    <input type="checkbox" class="toggle toggle-primary toggle-sm" checked disabled>
                  </div>

                  <!-- Optional cookies -->
                  <div class="rounded-md overflow-hidden bg-base-200/40">
                    <button
                      type="button"
                      class="w-full cursor-pointer flex items-center justify-between p-2 select-none"
                      :aria-expanded="showOptional.toString()"
                      aria-controls="cookie-opts"
                      @click="toggleOptional"
                    >
                      <span class="font-semibold text-sm">Additional options</span>
                      <span class="flex items-center gap-2">
                        <!-- ✅ live count -->
                        <span class="text-xs opacity-70">{{ selectedCount }}/2 selected</span>
                        <svg class="chev size-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" :class="{ 'rotate-180': showOptional }">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6" />
                        </svg>
                      </span>
                    </button>
                    <div
                      id="cookie-opts"
                      ref="optionalEl"
                      class="drop-inner p-2 space-y-2"
                      :style="{
                        maxHeight: showOptional ? optionalMax + 'px' : '0px',
                        opacity: showOptional ? 1 : 0,
                        transform: showOptional ? 'translateY(0)' : 'translateY(-6px)'
                      }"
                    >
                      <div class="flex items-center justify-between gap-3 rounded-md">
                        <div>
                          <div class="font-medium text-sm">Analytics</div>
                          <div class="text-xs opacity-70">Helps us improve the site.</div>
                        </div>
                        <input v-model="analytics" type="checkbox" class="toggle toggle-primary toggle-sm">
                      </div>
                      <div class="flex items-center justify-between gap-3 rounded-md">
                        <div>
                          <div class="font-medium text-sm">Marketing</div>
                          <div class="text-xs opacity-70">Personalized ads and tracking.</div>
                        </div>
                        <input v-model="marketing" type="checkbox" class="toggle toggle-primary toggle-sm">
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-4 grid grid-cols-2 gap-3">
                  <button class="btn btn-ghost" @click="confirm('save')">Save selection</button>
                  <button class="btn btn-primary" @click="confirm('all')">Accept all</button>
                </div>
              </div>
            </div>

            <!-- Step 2 -->
            <div v-else key="confirm" class="card bg-gradient-to-br from-base-100 to-base-200/60 border border-white shadow-lg">
              <div class="card-body items-center text-center">
                <div class="text-4xl">✅</div>
                <h3 class="card-title mt-1">Preferences saved</h3>
                <p class="text-sm opacity-80">You confirmed: {{ confirmedSummary }}</p>
                <p class="text-xs opacity-60 mt-1">Returning to cookie settings…</p>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- Bottom status (pinned) -->
      <div class="px-4 py-3 border-t border-base-300 bg-base-200 text-xs flex-shrink-0">
        <p class="flex items-center gap-2" :class="footerClass">
          <span v-if="footerIcon" aria-hidden="true">{{ footerIcon }}</span>
          <span>{{ footerText }}</span>
        </p>
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted, nextTick, watch } from 'vue'
import { useOpenDialog } from '~/composables/useOpenDialog.js'

const props = defineProps({
  open: { type: Boolean, required: true },
  onComplete: { type: Function, default: () => {} },
  id: { type: [String, Number], default: null }
})
const emit = defineEmits(['close','complete'])
const dialogRef = ref(null)

/* Fresh each open */
const step = ref(1)
const tutorialComplete = ref(false)

/* Stage footer: 0=start, 1=both OFF, 2=completed via Save selection */
const stage = ref(0)
const footerIcon = computed(() => (stage.value >= 2 ? '✅' : stage.value >= 1 ? '⏳' : '🎯'))
const footerText = computed(() =>
  stage.value >= 2 ? 'Tutorial completed!' :
  stage.value >= 1 ? 'Almost done…' :
  'Turn off both optional categories'
)
const footerClass = computed(() =>
  stage.value >= 2 ? 'text-success font-semibold' :
  stage.value >= 1 ? 'text-warning font-medium' :
  'text-base-content opacity-70'
)

/* Option toggles */
const analytics = ref(true)
const marketing = ref(true)
const confirmTimer = ref(null)

/* ✅ count shown in header; recomputes on toggle */
const selectedCount = computed(() => (analytics.value ? 1 : 0) + (marketing.value ? 1 : 0))

/* Summary text for success screen */
const confirmedSummary = computed(() => {
  const parts = ['Strictly necessary']
  if (analytics.value) parts.push('Analytics')
  if (marketing.value) parts.push('Marketing')
  return parts.join(', ')
})

/* Save/Accept actions */
function confirm(mode) {
  if (mode === 'all') {
    analytics.value = true
    marketing.value = true
    stage.value = 0
    step.value = 2
  } else {
    step.value = 2
    if (!analytics.value && !marketing.value) {
      if (stage.value < 2) stage.value = 2
      if (!tutorialComplete.value) {
        tutorialComplete.value = true
        emit('complete', props.id || 'preselection')
        if (typeof props.onComplete === 'function') props.onComplete()
      }
    }
  }

  clearTimeout(confirmTimer.value)
  confirmTimer.value = setTimeout(() => {
    analytics.value = true
    marketing.value = true
    showOptional.value = false
    if (stage.value < 2) stage.value = 0
    step.value = 1
    nextTick(() => recalcOptional())
  }, 1200)
}

/* Close helpers */
function handleClose() { emit('close') }
function onXClick() { dialogRef.value?.close(); handleClose() }
function onDialogCancel(e) { e.preventDefault(); dialogRef.value?.close(); handleClose() }
function onDialogNativeClose() { handleClose() }

/* Animated dropdown sizing */
const showOptional = ref(false)
const optionalEl = ref(null)
const optionalMax = ref(0)
function recalcOptional() { optionalMax.value = optionalEl.value ? optionalEl.value.scrollHeight : 0 }
async function toggleOptional() { showOptional.value = !showOptional.value; await nextTick(); recalcOptional() }

/* Stage transitions from toggles */
watch([analytics, marketing], ([a, m]) => {
  if (stage.value < 2) stage.value = (!a && !m) ? 1 : 0
  if (showOptional.value) nextTick(recalcOptional)
})

onMounted(() => {
  recalcOptional()
  window.addEventListener('resize', recalcOptional)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', recalcOptional)
  clearTimeout(confirmTimer.value)
})

/* Open fresh each time */
useOpenDialog(props, dialogRef, () => {
  step.value = 1
  analytics.value = true
  marketing.value = true
  tutorialComplete.value = false
  stage.value = 0
  showOptional.value = false
  nextTick(() => recalcOptional())
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease, transform .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* Smooth animated dropdown */
.drop-inner { overflow: hidden; transition: max-height .35s cubic-bezier(.22,.61,.36,1), opacity .28s ease, transform .28s ease; will-change: max-height, opacity, transform; }
.chev { transition: transform .28s cubic-bezier(.22,.61,.36,1); transform-origin: 50% 50%; }

/* Modal open animation */
@keyframes tutorial-modal-in { from { opacity:0; transform: translateY(12px) scale(.97); } to { opacity:1; transform: translateY(0) scale(1); } }
.animate-in { animation: tutorial-modal-in .28s cubic-bezier(.25,.8,.25,1); }
@media (prefers-reduced-motion: reduce) { .animate-in { animation: none; } }
</style>
