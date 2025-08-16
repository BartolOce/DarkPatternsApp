<template>
  <dialog ref="dialogRef" class="modal" @cancel="onDialogCancel" @close="onDialogNativeClose">
    <div class="modal-box rounded-xl p-0 mt-10 bg-base-200 shadow-none overflow-hidden max-w-[40vw] min-w-[48rem] h-[60vh] max-h-[60vh] flex flex-col" :class="{ 'animate-in': open }">
      <!-- Top -->
      <div class="flex items-center h-[72px] border-b border-base-200 bg-base-200 px-4">
        <h2 class="text-2xl font-bold">Nagging</h2>
      </div>
      <!-- X -->
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close" title="Close" @click.prevent="onXClick">✕</button>
      </form>

      <!-- Middle -->
      <div class="flex-1 flex items-center justify-center w-full bg-base-200 overflow-y-auto overflow-x-hidden p-4">
        <div class="w-full max-w-md"><!-- clip potential slide overflow -->
          <transition name="fade" mode="out-in">
            <div
              v-if="popupVisible"
              key="popup"
              class="card bg-gradient-to-br from-base-100 to-base-200/60 border border-white shadow-xl"
              :class="mode === 'prompt' ? '' : 'enabled-card enabled-animate'"
            >
              <div class="card-body items-center text-center">
                <template v-if="mode === 'prompt'">
                  <div class="text-4xl">🔔</div>
                  <h3 class="card-title mt-1">Enable Notifications</h3>
                  <p class="text-sm opacity-80">Stay updated with the latest offers and tips. Turn on notifications?</p>
                  <div class="grid grid-cols-2 gap-3 w-full mt-2">
                    <button class="btn btn-ghost" :disabled="busy" @click="handleResponse('later')">Not now</button>
                    <button class="btn btn-primary" :disabled="busy" @click="handleResponse('allow')">Allow</button>
                  </div>
                </template>
                <template v-else>
                  <div class="text-4xl">✅</div>
                  <h3 class="card-title mt-1">Notifications enabled</h3>
                  <p class="text-sm opacity-80">Great! You’ll get updates.</p>
                  <!-- removed in-card loader; loader will show after this card fades out -->
                </template>
              </div>
            </div>
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
    </div>
  </dialog>
</template>

<script setup>
import { ref, onBeforeUnmount, watch } from 'vue'
import { useOpenDialog } from '~/composables/useOpenDialog.js'

const props = defineProps({ open: { type: Boolean, required: true }, onComplete: { type: Function, default: () => {} }, id: { type: [String, Number], default: null } })
const emit = defineEmits(['close'])
const dialogRef = ref(null)

const LOCAL_KEY = 'nagging_tutorial_complete'
const tutorialComplete = ref(false)

const popupVisible = ref(true)
const busy = ref(false)
const cycle = ref(0)
const timerId = ref(null)
const hideTimeoutId = ref(null)
const DELAY_MS = 2500
const ALLOW_HOLD_MS = 1000
const RESTART_MS = 1200 // short period to show loader after success card fades

const mode = ref('prompt')
const showRestartMsg = ref(false)

function scheduleNag() { clearTimeout(timerId.value); timerId.value = setTimeout(() => { mode.value = 'prompt'; popupVisible.value = true }, DELAY_MS) }
function handleResponse(choice) {
  if (busy.value) return
  busy.value = true
  setTimeout(() => {
    busy.value = false
    if (choice === 'allow') {
      // 1) Show success card
      mode.value = 'allowed'
      clearTimeout(hideTimeoutId.value)
      // 2) After a short hold, hide card and show restart loader
      hideTimeoutId.value = setTimeout(() => {
        popupVisible.value = false
        showRestartMsg.value = true
        // 3) After restart phase, bring back the prompt card
        clearTimeout(timerId.value)
        timerId.value = setTimeout(() => {
          showRestartMsg.value = false
          mode.value = 'prompt'
          popupVisible.value = true
        }, RESTART_MS)
      }, ALLOW_HOLD_MS)
    } else {
      // Not now path unchanged
      popupVisible.value = false
      mode.value = 'prompt'
      scheduleNag()
    }
    cycle.value++
    if (!tutorialComplete.value) { tutorialComplete.value = true; localStorage.setItem(LOCAL_KEY, '1') }
  }, 250)
}

function handleClose() { emit('close'); if (tutorialComplete.value && typeof props.onComplete === 'function') props.onComplete() }
function onXClick() { dialogRef.value?.close(); handleClose() }
function onDialogCancel(e) { e.preventDefault(); dialogRef.value?.close(); handleClose() }
function onDialogNativeClose() { handleClose() }

useOpenDialog(props, dialogRef, () => {
  tutorialComplete.value = !!localStorage.getItem(LOCAL_KEY)
  popupVisible.value = true
  busy.value = false
  cycle.value = 0
  mode.value = 'prompt'
  showRestartMsg.value = false
  clearTimeout(timerId.value)
  clearTimeout(hideTimeoutId.value)
})

watch(() => props.open, (val) => { if (!val) { clearTimeout(timerId.value); clearTimeout(hideTimeoutId.value) } })
onBeforeUnmount(() => { clearTimeout(timerId.value); clearTimeout(hideTimeoutId.value) })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease, transform .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* Keep modal open animation only */
@keyframes tutorial-modal-in { from { opacity:0; transform: translateY(12px) scale(.97); } to { opacity:1; transform: translateY(0) scale(1); } }
.animate-in { animation: tutorial-modal-in .28s cubic-bezier(.25,.8,.25,1); will-change: opacity, transform; }
@media (prefers-reduced-motion: reduce) { .animate-in { animation: none; } }

/* Success card subtle entrance */
.enabled-card { border-radius: 0.9rem; overflow: hidden; }
@keyframes enabled-pop {
  0%   { opacity: 0; transform: scale(.98); }
  60%  { opacity: 1; transform: scale(1.02); }
  100% { opacity: 1; transform: scale(1); }
}
.enabled-animate { animation: enabled-pop .5s cubic-bezier(.2,.8,.2,1); }
</style>
