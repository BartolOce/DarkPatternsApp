<template>
  <dialog ref="dialogRef" class="modal" @cancel="onDialogCancel" @close="onDialogNativeClose">
    <div class="modal-box rounded-xl p-0 mt-10 bg-base-200 shadow-none overflow-hidden max-w-[40vw] min-w-[48rem] h-[60vh] max-h-[60vh] flex flex-col" :class="{ 'animate-in': open }">
      <!-- Top -->
      <div class="flex items-center h-[72px] border-b border-base-200 bg-base-200 px-4">
        <h2 class="text-2xl font-bold">Visual interface</h2>
      </div>
      <!-- X close -->
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close" title="Close" @click.prevent="onXClick">✕</button>
      </form>

      <!-- Middle -->
      <div class="flex-1 flex items-center justify-center w-full bg-base-200 overflow-y-auto p-4">
        <div class="w-full max-w-md">
          <transition name="fade" mode="out-in">
            <!-- Step 1 -->
            <div v-if="step === 1" key="prompt" class="card bg-gradient-to-br from-base-100 to-base-200/60 border border-white shadow-lg">
              <div class="card-body items-center text-center">
                <h3 class="card-title">Do you want to continue sharing your browsing history?</h3>
                <p class="text-sm opacity-80">Choose an option below.</p>
                <div class="w-full mt-4 grid gap-2">
                  <button class="btn btn-primary btn-lg" @click="choose('yes')">Yes, keep sharing</button>
                  <button class="btn btn-ghost btn-sm" @click="choose('no')">No, stop sharing</button>
                </div>
              </div>
            </div>
            <!-- Step 2 -->
            <div v-else key="confirm" class="card bg-gradient-to-br from-base-100 to-base-200/60 border border-white shadow-lg">
              <div class="card-body items-center text-center">
                <div class="text-4xl">✅</div>
                <h3 class="card-title mt-1">Preference updated</h3>
                <p class="text-sm opacity-80">
                  {{ lastChoice === 'yes'
                    ? 'You chose to continue sharing your browsing history.'
                    : 'You chose to stop sharing your browsing history.' }}
                </p>
                <p class="text-xs opacity-60 mt-1">Returning to the prompt…</p>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useOpenDialog } from '~/composables/useOpenDialog.js'

const props = defineProps({ open: { type: Boolean, required: true }, onComplete: { type: Function, default: () => {} }, id: { type: [String, Number], default: null } })
const emit = defineEmits(['close'])
const dialogRef = ref(null)

const LOCAL_KEY = 'visual_interface_tutorial_complete'
const step = ref(1)
const lastChoice = ref(null)
const tutorialComplete = ref(false)
const resetTimer = ref(null)

function choose(choice) {
  lastChoice.value = choice
  step.value = 2
  if (!tutorialComplete.value) {
    tutorialComplete.value = true
    localStorage.setItem(LOCAL_KEY, '1')
  }
  clearTimeout(resetTimer.value)
  resetTimer.value = setTimeout(() => { step.value = 1 }, 1100)
}

function handleClose() {
  emit('close')
  if (tutorialComplete.value && typeof props.onComplete === 'function') props.onComplete()
}
function onXClick() { dialogRef.value?.close(); handleClose() }
function onDialogCancel(e) { e.preventDefault(); dialogRef.value?.close(); handleClose() }
function onDialogNativeClose() { handleClose() }

useOpenDialog(props, dialogRef, () => {
  step.value = 1
  lastChoice.value = null
  tutorialComplete.value = !!localStorage.getItem(LOCAL_KEY)
})

onBeforeUnmount(() => { clearTimeout(resetTimer.value) })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease, transform .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* Keep modal open animation only */
@keyframes tutorial-modal-in { from { opacity:0; transform: translateY(12px) scale(.97); } to { opacity:1; transform: translateY(0) scale(1); } }
.animate-in { animation: tutorial-modal-in .28s cubic-bezier(.25,.8,.25,1); }
@media (prefers-reduced-motion: reduce) { .animate-in { animation: none; } }
</style>
