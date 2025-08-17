<!-- file: components/tutorials/NaggingTutorial.vue -->
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
        <h2 class="text-2xl font-bold">Nagging</h2>
      </div>

      <!-- X (top-right) -->
      <form method="dialog">
        <button
          class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          aria-label="Close"
          title="Close"
          @click.prevent="onXClick"
        >✕</button>
      </form>

      <!-- Middle -->
      <div class="flex-1 flex items-center justify-center w-full bg-base-200 overflow-y-auto overflow-x-hidden p-4">
        <div class="w-full max-w-md">
          <transition name="fade" mode="out-in">
            <!-- Popup card -->
            <div
              v-if="popupVisible"
              key="popup"
              class="card bg-gradient-to-br from-base-100 to-base-200/60 border border-white shadow-xl"
              :class="mode === 'prompt' ? '' : 'enabled-card enabled-animate'"
            >
              <div class="card-body items-center text-center">
                <!-- Prompt view -->
                <template v-if="mode === 'prompt'">
                  <div class="text-4xl">🔔</div>
                  <h3 class="card-title mt-1">Enable Notifications</h3>
                  <p class="text-sm opacity-80">Stay updated with the latest offers and tips. Turn on notifications?</p>
                  <div class="grid grid-cols-2 gap-3 w-full mt-2">
                    <button class="btn btn-ghost" :disabled="busy" @click="handleResponse('later')">Not now</button>
                    <button class="btn btn-primary" :disabled="busy" @click="handleResponse('allow')">Allow</button>
                  </div>
                </template>

                <!-- Allowed success view -->
                <template v-else>
                  <div class="text-4xl">✅</div>
                  <h3 class="card-title mt-1">Notifications enabled</h3>
                  <p class="text-sm opacity-80">Great! You’ll get updates.</p>
                </template>
              </div>
            </div>

            <!-- Hidden/paused state -->
            <div v-else key="hidden" class="h-[180px] flex items-center justify-center text-base-content/60">
              <template v-if="showRestartMsg">
                <div class="flex flex-col items-center">
                  <span class="loading loading-spinner loading-sm mb-1"/>
                  <span class="text-xs">Restarting dark pattern view…</span>
                </div>
              </template>
              <template v-else>
                <span class="text-sm">Popup dismissed. It will appear again shortly…</span>
              </template>
            </div>
          </transition>
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
const emit = defineEmits(['close','complete'])
const dialogRef = ref(null)

/* Fresh each open — no persistence */
const tutorialComplete = ref(false)

/* UI state */
const popupVisible = ref(true)
const busy = ref(false)
const mode = ref('prompt') // 'prompt' | 'allowed'
const showRestartMsg = ref(false)

/* Timers */
const timerId = ref(null)
const hideTimeoutId = ref(null)
const DELAY_MS = 2500        // delay before nag reappears after "Not now"
const ALLOW_HOLD_MS = 1000   // show success card briefly
const RESTART_MS = 1200      // loader before returning to prompt

/* Stage logic:
   0 = start
   1 = Almost done… (after first "Not now")
   2 = Completed      (after second "Not now")
*/
const stage = ref(0)
const notNowCount = ref(0)

/* Footer status */
const footerIcon = computed(() => {
  if (stage.value >= 2) return '✅'
  if (stage.value >= 1) return '⏳'
  return '🎯'
})
const footerText = computed(() => {
  if (stage.value >= 2) return 'Tutorial completed!'
  if (stage.value >= 1) return 'Almost done…'
  return 'Dismiss the popup twice'
})
const footerClass = computed(() => {
  if (stage.value >= 2) return 'text-success font-semibold'
  if (stage.value >= 1) return 'text-warning font-medium'
  return 'text-base-content opacity-70'
})

function clearTimers() {
  if (timerId.value) { clearTimeout(timerId.value); timerId.value = null }
  if (hideTimeoutId.value) { clearTimeout(hideTimeoutId.value); hideTimeoutId.value = null }
}

function scheduleNag() {
  clearTimers()
  timerId.value = setTimeout(() => {
    mode.value = 'prompt'
    popupVisible.value = true
  }, DELAY_MS)
}

function handleResponse(choice) {
  if (busy.value) return
  busy.value = true

  setTimeout(() => {
    busy.value = false

    if (choice === 'allow') {
      // Success card flow (does not change stage)
      mode.value = 'allowed'
      if (hideTimeoutId.value) clearTimeout(hideTimeoutId.value)
      hideTimeoutId.value = setTimeout(() => {
        popupVisible.value = false
        showRestartMsg.value = true
        if (timerId.value) clearTimeout(timerId.value)
        timerId.value = setTimeout(() => {
          showRestartMsg.value = false
          mode.value = 'prompt'
          popupVisible.value = true
        }, RESTART_MS)
      }, ALLOW_HOLD_MS)

    } else {
      // "Not now" path — drives stage progression
      notNowCount.value += 1
      if (notNowCount.value === 1 && stage.value < 1) {
        stage.value = 1 // Almost done…
      } else if (notNowCount.value >= 2 && stage.value < 2) {
        stage.value = 2 // Completed
        if (!tutorialComplete.value) {
          tutorialComplete.value = true
          // Notify parent immediately so the step becomes colored
          emit('complete', props.id || 'nagging')
          if (typeof props.onComplete === 'function') props.onComplete()
        }
      }

      // Hide the card and schedule the nag to reappear
      popupVisible.value = false
      mode.value = 'prompt'
      scheduleNag()
    }
  }, 250)
}

/* Close helpers — closing never marks completion */
function handleClose() { emit('close') }
function onXClick() { dialogRef.value?.close(); handleClose() }
function onDialogCancel(e) { e.preventDefault(); dialogRef.value?.close(); handleClose() }
function onDialogNativeClose() { handleClose() }

/* Open fresh each time */
useOpenDialog(props, dialogRef, () => {
  clearTimers()
  tutorialComplete.value = false
  stage.value = 0
  notNowCount.value = 0
  popupVisible.value = true
  busy.value = false
  mode.value = 'prompt'
  showRestartMsg.value = false
})

onBeforeUnmount(() => { clearTimers() })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease, transform .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* Modal open animation */
@keyframes tutorial-modal-in {
  from { opacity:0; transform: translateY(12px) scale(.97); }
  to   { opacity:1; transform: translateY(0) scale(1); }
}
.animate-in { animation: tutorial-modal-in .28s cubic-bezier(.25,.8,.25,1); will-change: opacity, transform; }
@media (prefers-reduced-motion: reduce) { .animate-in { animation: none; } }

/* Success pop micro-anim */
.enabled-card { border-radius: 0.9rem; overflow: hidden; }
@keyframes enabled-pop {
  0%   { opacity: 0; transform: scale(.98); }
  60%  { opacity: 1; transform: scale(1.02); }
  100% { opacity: 1; transform: scale(1); }
}
.enabled-animate { animation: enabled-pop .5s cubic-bezier(.2,.8,.2,1); }
</style>
