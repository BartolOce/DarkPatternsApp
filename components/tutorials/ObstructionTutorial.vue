<!-- file: components/tutorials/ObstructionTutorial.vue -->
<template>
  <dialog ref="dialogRef" class="modal" @cancel="onDialogCancel" @close="onDialogNativeClose">
    <div
      class="modal-box rounded-xl p-0 mt-10 bg-base-200 shadow-none overflow-hidden max-w-[40vw] min-w-[48rem] h-[70vh] max-h-[70vh] flex flex-col"
      :class="{ 'animate-in': open }"
    >
      <!-- Top -->
      <div class="flex items-center h-[72px] border-b border-base-200 bg-base-200 px-4">
        <h2 class="text-2xl font-bold">Obstruction</h2>
      </div>

      <!-- X -->
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
            <!-- Loading -->
            <div
              v-if="loading"
              key="loading"
              class="card bg-gradient-to-br from-base-100 to-base-200/60 border border-white shadow-lg"
            >
              <div class="card-body items-center text-center gap-3">
                <span class="loading loading-spinner loading-lg"/>
                <div class="text-sm opacity-80">{{ loadingText }}</div>
              </div>
            </div>

            <!-- Stepper -->
            <div
              v-else
              :key="'step'+step"
              class="card bg-gradient-to-br from-base-100 to-base-200/60 border border-white shadow-lg"
            >
              <div class="card-body">
                <!-- Decoy card -->
                <template v-if="decoyActive">
                  <h3 class="card-title">{{ decoyTitle }}</h3>
                  <p class="text-sm opacity-80">{{ decoyText }}</p>
                  <div class="mt-4">
                    <button class="btn btn-ghost" @click="exitDecoy">Back</button>
                  </div>
                </template>

                <!-- Step 1: Account -->
                <template v-else-if="step === 1">
                  <h3 class="card-title">Account</h3>
                  <p class="text-sm opacity-80">Manage your account preferences.</p>
                  <ul class="menu bg-base-200/50 rounded-box mt-3">
                    <li><a @click.prevent="fakeAction('Profile', 1)">Profile</a></li>
                    <li><a @click.prevent="fakeAction('Security', 1)">Security</a></li>
                    <!-- Subscriptions triggers "Almost done…" -->
                    <li><a class="active" @click.prevent="handleSubscriptions">Subscriptions</a></li>
                    <li><a @click.prevent="fakeAction('Notifications', 1)">Notifications</a></li>
                  </ul>
                </template>

                <!-- Step 2: Subscriptions -->
                <template v-else-if="step === 2">
                  <h3 class="card-title">Subscriptions</h3>
                  <div class="mt-2 rounded-lg border p-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="font-semibold">Pro Plan</div>
                        <div class="text-xs opacity-70">Renews: Next month</div>
                      </div>
                      <span class="badge badge-primary">Active</span>
                    </div>
                  </div>
                  <div class="mt-4 grid grid-cols-2 gap-2">
                    <button class="btn btn-ghost" @click="go(1)">Back</button>
                    <button class="btn btn-primary" @click="go(3)">Manage</button>
                  </div>
                </template>

                <!-- Step 3: Manage subscription -->
                <template v-else-if="step === 3">
                  <h3 class="card-title">Manage subscription</h3>
                  <p class="text-sm opacity-80">Choose an action below.</p>
                  <div class="grid gap-2 mt-3">
                    <button class="btn btn-outline" @click="fakeAction('Pause billing', 3)">Pause billing</button>
                    <button class="btn btn-outline" @click="fakeAction('Change plan', 3)">Change plan</button>
                    <button class="btn btn-error" @click="go(4)">Cancel subscription</button>
                  </div>
                  <div class="mt-4">
                    <button class="btn btn-ghost btn-block" @click="go(2)">Back</button>
                  </div>
                </template>

                <!-- Step 4: Retention survey -->
                <template v-else-if="step === 4">
                  <h3 class="card-title">Before you go…</h3>
                  <p class="text-sm opacity-80">Please tell us why you’re canceling.</p>
                  <div class="form-control mt-3 flex flex-col gap-2">
                    <label class="label cursor-pointer justify-start gap-3">
                      <input v-model="reason" type="radio" class="radio radio-primary" value="price">
                      <span>Too expensive</span>
                    </label>
                    <label class="label cursor-pointer justify-start gap-3">
                      <input v-model="reason" type="radio" class="radio radio-primary" value="rarely">
                      <span>I rarely use it</span>
                    </label>
                    <label class="label cursor-pointer justify-start gap-3">
                      <input v-model="reason" type="radio" class="radio radio-primary" value="alt">
                      <span>Found a better alternative</span>
                    </label>
                  </div>
                  <div class="mt-4 flex flex-col gap-2">
                    <button class="btn btn-ghost btn-block" @click="go(3)">Back</button>
                    <button class="btn btn-primary btn-block" :disabled="!reason" @click="go(5)">Continue</button>
                  </div>
                </template>

                <!-- Step 5: Confirm -->
                <template v-else-if="step === 5">
                  <h3 class="card-title">Confirm cancellation</h3>
                  <p class="text-sm opacity-80">You’re canceling your Pro Plan subscription.</p>
                  <ul class="list-disc ms-5 text-sm opacity-80 mt-2">
                    <li>Access ends at period close</li>
                    <li>Saved settings may be removed</li>
                  </ul>
                  <div class="mt-4 grid grid-cols-2 gap-2">
                    <button class="btn btn-ghost" @click="go(4)">Back</button>
                    <button class="btn btn-error" @click="finalizeCancel">Confirm cancellation</button>
                  </div>
                </template>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- Bottom status -->
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

/* Fresh each open — no persistence (matches NaggingTutorial behavior) */
const tutorialComplete = ref(false) // used only to guard double-emits during a single open

/* Steps & UI */
const step = ref(1)
const loading = ref(false)
const loadingText = ref('loading')
const reason = ref('')
const loaderId = ref(null)

/* Decoy */
const decoyActive = ref(false)
const decoyTitle = ref('')
const decoyText = ref('')
const decoyBackStep = ref(1)
const decoyTimerId = ref(null)

/* Footer stage (0=start, 1=Almost done…, 2=Completed) */
const stage = ref(0)

const footerIcon = computed(() => (stage.value >= 2 ? '✅' : stage.value >= 1 ? '⏳' : '🎯'))
const footerText = computed(() =>
  stage.value >= 2 ? 'By adding friction, the design makes cancellation not an easy task, nudging users to keep paying.' :
  stage.value >= 1 ? 'I hope there aren’t more submenus to reach Cancel subscription — let’s keep going.' :
  'Try to navigate trough Subscriptions and cancel the paid plan'
)
const footerClass = computed(() =>
  stage.value >= 2 ? 'text-success font-semibold' :
  stage.value >= 1 ? 'text-warning font-medium' :
  'text-base-content opacity-70'
)

function setLoading(text = 'loading', hold = 900) {
  loadingText.value = text
  loading.value = true
  clearTimeout(loaderId.value)
  loaderId.value = setTimeout(() => { loading.value = false }, hold)
}

function fakeAction(label, backStep) {
  const hold = 700
  setLoading('loading', hold)
  clearTimeout(decoyTimerId.value)
  decoyTimerId.value = setTimeout(() => {
    decoyTitle.value = label
    decoyText.value = `This ${label.toLowerCase()} screen doesn't help with canceling. Try going back.`
    decoyBackStep.value = backStep
    decoyActive.value = true
  }, hold + 10)
}

function exitDecoy() {
  decoyActive.value = false
  step.value = decoyBackStep.value
}

function go(nextStep) {
  decoyActive.value = false
  setLoading()
  setTimeout(() => { step.value = nextStep }, 300)
}

/* Subscriptions click moves stage to 1 ("Almost done…") */
function handleSubscriptions() {
  if (stage.value < 1) stage.value = 1
  go(2)
}

/* Final confirm marks completion once, emits to parent, then soft-resets steps */
function finalizeCancel() {
  if (stage.value < 2) stage.value = 2
  if (!tutorialComplete.value) {
    tutorialComplete.value = true
    emit('complete', props.id || 'obstruction') // inform parent once
    if (typeof props.onComplete === 'function') props.onComplete()
  }
  setLoading('loading', 1000)
  setTimeout(() => {
    step.value = 1
    reason.value = ''
    setLoading('loading', 700)
  }, 350)
}

/* Close helpers — closing never marks completion */
function handleClose() { emit('close') }
function onXClick() { dialogRef.value?.close(); handleClose() }
function onDialogCancel(e) { e.preventDefault(); dialogRef.value?.close(); handleClose() }
function onDialogNativeClose() { handleClose() }

/* Reset fresh each open (no persistence, start from stage 0) */
useOpenDialog(props, dialogRef, () => {
  step.value = 1
  reason.value = ''
  loading.value = false
  loadingText.value = 'loading'
  decoyActive.value = false
  decoyTitle.value = ''
  decoyText.value = ''
  decoyBackStep.value = 1
  clearTimeout(loaderId.value)
  clearTimeout(decoyTimerId.value)

  tutorialComplete.value = false       // ✨ do not restore completion
  stage.value = 0                      // ✨ always start at beginning
})

onBeforeUnmount(() => {
  clearTimeout(loaderId.value)
  clearTimeout(decoyTimerId.value)
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease, transform .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* Keep modal open animation only */
@keyframes tutorial-modal-in { from { opacity:0; transform: translateY(12px) scale(.97); } to { opacity:1; transform: translateY(0) scale(1); } }
.animate-in { animation: tutorial-modal-in .28s cubic-bezier(.25,.8,.25,1); }
@media (prefers-reduced-motion: reduce) { .animate-in { animation: none; } }
</style>
