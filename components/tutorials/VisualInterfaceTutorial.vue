<!-- file: components/tutorials/VisualInterfaceTutorial.vue -->
<template>
  <dialog ref="dialogRef" class="modal" @cancel="onDialogCancel" @close="onDialogNativeClose">
    <div
      class="modal-box rounded-xl p-0 mt-10 bg-base-200 shadow-none overflow-hidden max-w-[40vw] min-w-[48rem] h-[70vh] max-h-[70vh] flex flex-col"
      :class="{ 'animate-in': open }"
    >
      <!-- Top (pinned) -->
      <div class="flex items-center h-[72px] border-b border-base-200 bg-base-200 px-4 flex-shrink-0">
        <h2 class="text-2xl font-bold">Visual interface</h2>
      </div>

      <!-- X close -->
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close" title="Close" @click.prevent="onXClick">✕</button>
      </form>

      <!-- Middle (scrollable) -->
      <div class="flex-1 min-h-0 flex items-center justify-center w-full bg-base-200 overflow-y-auto p-4">
        <div class="w-full max-w-md">
          <transition name="fade" mode="out-in">
            <!-- Step 1 -->
            <div v-if="step === 1" key="prompt" class="card bg-gradient-to-br from-base-100 to-base-200/60 border border-white shadow-lg">
              <div class="card-body items-center text-center">
                <h3 class="card-title">Do you want to continue sharing your browsing history?</h3>
                <p class="text-sm opacity-80">Choose an option below.</p>
                <div class="w-full mt-4 grid gap-2">
                  <!-- YES => show second message (Step 2), stage -> 1 -->
                  <button class="btn btn-primary btn-lg" @click="choose('yes')">Yes, keep sharing</button>
                  <!-- NO  => complete immediately (emit), stay on Step 1, stage -> 2 -->
                  <button class="btn btn-ghost btn-sm" @click="choose('no')">No, stop sharing</button>
                </div>
                <p class="text-xs opacity-60 mt-3">
                  Status: <b>{{ shared ? 'Sharing enabled' : 'Sharing disabled' }}</b>
                </p>
              </div>
            </div>

            <!-- Step 2 (shown only after clicking YES) -->
            <div v-else key="confirm" class="card bg-gradient-to-br from-base-100 to-base-200/60 border border-white shadow-lg">
              <div class="card-body items-center text-center">
                <div class="text-4xl">✅</div>
                <h3 class="card-title mt-1">Preference updated</h3>
                <p class="text-sm opacity-80">You chose to continue sharing your browsing history.</p>
                <p class="text-xs opacity-60 mt-1">Returning to the prompt…</p>
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
/* High-signal inline comments only */
import { ref, computed, onBeforeUnmount } from 'vue'
import { useOpenDialog } from '~/composables/useOpenDialog.js'

const props = defineProps({
  open: { type: Boolean, required: true },
  onComplete: { type: Function, default: () => {} },
  id: { type: [String, Number], default: null }
})
const emit = defineEmits(['close','complete'])
const dialogRef = ref(null)

/* Fresh each open (no persistence) */
const step = ref(1)
const shared = ref(true)            // visual status line
const tutorialComplete = ref(false) // guard double-emits
const resetTimer = ref(null)

/* Footer stage: 0=start, 1=clicked YES (saw step 2), 2=completed via NO */
const stage = ref(0)
const footerIcon = computed(() => (stage.value >= 2 ? '✅' : stage.value >= 1 ? '⏳' : '🎯'))
const footerText = computed(() =>
  stage.value >= 2 ? 'Inverted toggles and tiny labels confuse state, leading to unwanted opt-ins.' :
  stage.value >= 1 ? 'That’s exactly the click they wanted — ghost buttons and microtext hide the alternatives. Now click the other one.' :
  'Let’s click the button that looks most pleasing — be honest.”'
)
const footerClass = computed(() =>
  stage.value >= 2 ? 'text-success font-semibold' :
  stage.value >= 1 ? 'text-warning font-medium' :
  'text-base-content opacity-70'
)

/* YES -> show Step 2 briefly; NO -> complete immediately */
function choose(choice) {
  clearTimeout(resetTimer.value)

  if (choice === 'yes') {
    shared.value = true
    step.value = 2
    if (stage.value < 1) stage.value = 1
    resetTimer.value = setTimeout(() => { step.value = 1 }, 1100)
  } else {
    shared.value = false
    if (stage.value < 2) stage.value = 2
    if (!tutorialComplete.value) {
      tutorialComplete.value = true
      emit('complete', props.id || 'visual-interface')
      if (typeof props.onComplete === 'function') props.onComplete()
    }
    // stay on Step 1 so user sees status + completed footer
  }
}

/* Close helpers — closing never marks completion */
function handleClose() { emit('close') }
function onXClick() { dialogRef.value?.close(); handleClose() }
function onDialogCancel(e) { e.preventDefault(); dialogRef.value?.close(); handleClose() }
function onDialogNativeClose() { handleClose() }

/* Reset fresh each open */
useOpenDialog(props, dialogRef, () => {
  step.value = 1
  shared.value = true
  tutorialComplete.value = false
  stage.value = 0
})

onBeforeUnmount(() => { clearTimeout(resetTimer.value) })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease, transform .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* Modal open animation */
@keyframes tutorial-modal-in { from { opacity:0; transform: translateY(12px) scale(.97); } to { opacity:1; transform: translateY(0) scale(1); } }
.animate-in { animation: tutorial-modal-in .28s cubic-bezier(.25,.8,.25,1); }
@media (prefers-reduced-motion: reduce) { .animate-in { animation: none; } }
</style>
