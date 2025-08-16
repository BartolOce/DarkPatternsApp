<template>
  <dialog ref="dialogRef" class="modal" @cancel="onDialogCancel" @close="onDialogNativeClose">
    <div class="modal-box rounded-xl p-0 mt-10 bg-base-200 shadow-none overflow-hidden max-w-[40vw] min-w-[48rem] h-[60vh] max-h-[60vh] flex flex-col" :class="{ 'animate-in': open }">
      <!-- Top -->
      <div class="flex items-center h-[72px] border-b border-base-200 bg-base-200 px-4">
        <h2 class="text-2xl font-bold">Trick wording</h2>
      </div>
      <!-- X -->
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close" title="Close" @click.prevent="onXClick">✕</button>
      </form>

      <!-- Middle -->
      <div class="flex-1 flex items-center justify-center w-full bg-base-200 overflow-y-auto overflow-x-hidden p-4">
        <div class="w-full max-w-md">
          <transition name="fade" mode="out-in">
            <!-- Step 1 -->
            <div v-if="step === 1" key="status" class="card bg-gradient-to-br from-base-100 to-base-200/60 border border-white shadow-lg">
              <div class="card-body items-center text-center">
                <div class="text-4xl" :class="subscribed ? 'text-primary' : 'text-base-content/50'">📧</div>
                <h3 class="card-title mt-1">Newsletter</h3>
                <p class="text-sm opacity-80">
                  Status: <b>{{ subscribed ? 'Subscribed to promotional emails' : 'Not subscribed to promotional emails' }}</b>
                </p>
                <div class="mt-4 w-full">
                  <template v-if="subscribed">
                    <button class="btn btn-error btn-block" @click="goToUnsubscribe">Unsubscribe</button>
                  </template>
                  <template v-else>
                    <div class="form-control w-full">
                      <input v-model="email" type="email" class="input input-bordered w-full mb-3" placeholder="you@example.com" >
                    </div>
                    <button class="btn btn-primary btn-block" @click="animateResubscribe">Subscribe again</button>
                  </template>
                </div>
              </div>
            </div>
            <!-- Step 2: animated subscribe success -->
            <div v-else key="tricky" class="card bg-gradient-to-br from-base-100 to-base-200/60 border border-white shadow-lg resub-animate">
              <div class="card-body">
                <h3 class="card-title">Confirm unsubscribe</h3>
                <p class="text-sm opacity-80">Please review your email preference below:</p>
                <div class="mt-3">
                  <label class="flex items-start gap-3 cursor-pointer">
                    <input v-model="trickyChecked" type="checkbox" class="checkbox checkbox-primary mt-1" >
                    <span class="text-sm leading-snug">
                      Uncheck this box if you do not want to stop receiving no promotional emails.
                    </span>
                  </label>
                  <p class="text-xs opacity-60 mt-2">
                    Tip: The wording is intentionally confusing. What happens if you leave it checked?
                  </p>
                </div>
                <div class="mt-4 grid grid-cols-2 gap-2">
                  <button class="btn btn-ghost" @click="cancelUnsubscribe">Cancel</button>
                  <button class="btn btn-primary" @click="confirmUnsubscribe">Confirm</button>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useOpenDialog } from '~/composables/useOpenDialog.js'

const props = defineProps({ open: { type: Boolean, required: true }, onComplete: { type: Function, default: () => {} }, id: { type: [String, Number], default: null } })
const emit = defineEmits(['close'])
const dialogRef = ref(null)

const LOCAL_KEY = 'trick_wording_tutorial_complete'
const step = ref(1)
const tutorialComplete = ref(false)
const subscribed = ref(true)
const trickyChecked = ref(true)
const email = ref('')

function goToUnsubscribe() { trickyChecked.value = true; step.value = 2 }
function cancelUnsubscribe() { step.value = 1 }
function confirmUnsubscribe() {
  subscribed.value = trickyChecked.value ? true : false
  if (!tutorialComplete.value) { tutorialComplete.value = true; localStorage.setItem(LOCAL_KEY, '1') }
  step.value = 1
}
// Animate subscribe again: show subscribed card with animation, then stay on step 1
function animateResubscribe() {
  subscribed.value = true
  email.value = ''
  // Animate the subscribed card (step 1) instead of going to step 2
  step.value = 1
  // Optionally, you can add a class for animation if desired
}

function handleClose() { emit('close'); if (tutorialComplete.value && typeof props.onComplete === 'function') props.onComplete() }
function onXClick() { dialogRef.value?.close(); handleClose() }
function onDialogCancel(e) { e.preventDefault(); dialogRef.value?.close(); handleClose() }
function onDialogNativeClose() { handleClose() }

useOpenDialog(props, dialogRef, () => {
  step.value = 1
  subscribed.value = true
  trickyChecked.value = true
  email.value = ''
  tutorialComplete.value = !!localStorage.getItem(LOCAL_KEY)
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease, transform .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* Animated subscribe success card */
@keyframes resub-pop {
  0%   { opacity: 0; transform: scale(.98); }
  60%  { opacity: 1; transform: scale(1.02); }
  100% { opacity: 1; transform: scale(1); }
}
.resub-animate { animation: resub-pop .5s cubic-bezier(.2,.8,.2,1); }

/* Keep modal open animation only */
@keyframes tutorial-modal-in { from { opacity:0; transform: translateY(12px) scale(.97); } to { opacity:1; transform: translateY(0) scale(1); } }
.animate-in { animation: tutorial-modal-in .28s cubic-bezier(.25,.8,.25,1); }
@media (prefers-reduced-motion: reduce) { .animate-in { animation: none; } }
</style>
