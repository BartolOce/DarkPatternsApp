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
        <h2 class="text-2xl font-bold">Hidden Costs</h2>
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
        <div class="w-full max-w-md">
          <!-- Animated transition for loader + cards -->
          <transition
            mode="out-in"
            :enter-active-class="'transition-all duration-180 ease-out'"
            :leave-active-class="'transition-all duration-150 ease-in'"
            :enter-from-class="'opacity-0 translate-y-2 scale-95'"
            :leave-to-class="'opacity-0 -translate-y-2 scale-95'"
          >
            <!-- Loading -->
            <div
              v-if="view === 'loading'"
              key="loading"
              class="w-full flex flex-col items-center justify-center py-12 text-center"
              aria-live="polite"
            >
              <span class="loading loading-spinner loading-lg text-primary" aria-label="Loading"/>
              <div class="text-sm text-base-content/70 mt-3">{{ loaderText || 'Loading…' }}</div>
            </div>

            <!-- Step 1 -->
            <div v-else-if="view === 'step-1'" key="s1" class="card hc-card bg-gradient-to-br from-base-100 to-base-200/60 border border-base-300/60 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
              <div class="card-body">
                <!-- ...existing step 1 content... -->
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-2xl font-semibold tracking-wide">{{ seatSection }}</div>
                    <div class="opacity-70">{{ seatRow }}</div>
                  </div>
                  <div class="form-control">
                    <label class="label pb-1"><span class="label-text text-xs opacity-70">Quantity</span></label>
                    <select v-model.number="qty" class="select select-bordered select-sm">
                      <option :value="1">1 ticket</option>
                      <option :value="2">2 tickets</option>
                      <option :value="3">3 tickets</option>
                      <option :value="4">4 tickets</option>
                    </select>
                  </div>
                </div>

                <div class="my-3 border-t border-base-200"/>

                <div class="flex items-end justify-between">
                  <div class="text-sm opacity-80">You'll pay</div>
                  <div class="text-3xl font-bold">US$ {{ BASE_TICKET_PRICE.toFixed(2) }}</div>
                </div>
                <div class="text-right opacity-70 -mt-1">each</div>

                <div class="mt-6">
                  <button class="btn btn-primary btn-block" @click="nextFromStep1">Continue</button>
                </div>
              </div>
            </div>

            <!-- Step 2 -->
            <div v-else-if="view === 'step-2'" key="s2" class="card hc-card bg-gradient-to-br from-base-100 to-base-200/60 border border-base-300/60 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
              <div class="card-body">
                <!-- ...existing step 2 content... -->
                <h3 class="card-title">Enter details</h3>
                <p class="text-sm mb-3">We just need a few details to continue.</p>
                <div class="form-control mb-2">
                  <label class="label"><span class="label-text">Full name</span></label>
                  <input v-model="buyerName" class="input input-bordered w-full" placeholder="Jane Doe" >
                </div>
                <div class="form-control">
                  <label class="label"><span class="label-text">Email</span></label>
                  <input v-model="buyerEmail" class="input input-bordered w-full" placeholder="jane@example.com" >
                </div>
                <div class="mt-4">
                  <button class="btn btn-primary btn-block" :disabled="!buyerName || !buyerEmail" @click="goToReview">
                    Review order
                  </button>
                </div>
                <div class="text-xs text-base-content/60 flex items-center justify-center gap-2 mt-3">
                  🔒 Secure checkout
                </div>
              </div>
            </div>

            <!-- Step 3 -->
            <div v-else key="s3" class="card hc-card bg-gradient-to-br from-base-100 to-base-200/60 border border-base-300/60 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
              <div class="card-body">
                <!-- ...existing step 3 content... -->
                <h3 class="card-title">Order summary</h3>
                <p class="text-sm mb-3">Almost there...</p>

                <div class="flex flex-col gap-2 text-sm">
                  <div class="flex justify-between">
                    <span>Ticket Price</span>
                    <span>{{ qty }} × {{ money(BASE_TICKET_PRICE) }}</span>
                  </div>

                  <transition-group name="fee-fade" tag="div">
                    <div v-if="revealFees" key="svc" class="flex justify-between text-warning">
                      <span>Service Fee</span><span>{{ money(serviceFee) }}</span>
                    </div>
                    <div v-if="revealFees" key="ful" class="flex justify-between text-warning">
                      <span>Fulfillment Fee</span><span>{{ money(fulfillmentFee) }}</span>
                    </div>
                  </transition-group>

                  <div class="divider my-2"/>
                  <div class="flex justify-between font-bold text-lg">
                    <span class="uppercase">Total Price</span>
                    <span>US$ {{ total.toFixed(2) }}</span>
                  </div>
                </div>

                <div class="mt-4">
                  <button
                    class="btn btn-primary btn-block"
                    :disabled="isProcessing"
                    @click="payNow"
                  >
                    <span v-if="!isProcessing">Pay now</span>
                    <span v-else class="loading loading-spinner loading-sm"/>
                  </button>
                </div>
                <div class="text-xs text-base-content/60 flex items-center justify-center gap-2 mt-3">
                  🔒 Secure checkout
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- Bottom removed -->
    </div>
  </dialog>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue' // added nextTick
import { useOpenDialog } from '~/composables/useOpenDialog.js'

const props = defineProps({
  open: { type: Boolean, required: true },
  onComplete: { type: Function, default: () => {} },
  id: { type: [String, Number], default: null }
})
const emit = defineEmits(['close'])
const dialogRef = ref(null)

const LOCAL_KEY = 'hidden_costs_tutorial_complete'

const tutorialComplete = ref(false)
const step = ref(1)

// Mimic the screenshot values
const seatSection = '112'
const seatRow = 'Row Y'
const BASE_TICKET_PRICE = 310.05
const SERVICE_RATE = 86.13 / 310.05
const FULFILLMENT_FEE = 4.95

const qty = ref(1)

const ticketPrice = computed(() => +(BASE_TICKET_PRICE * qty.value).toFixed(2))
const revealFees = ref(false)
const serviceFee = computed(() => (revealFees.value ? +(BASE_TICKET_PRICE * SERVICE_RATE * qty.value).toFixed(2) : 0))
const fulfillmentFee = computed(() => (revealFees.value ? FULFILLMENT_FEE : 0))
const total = computed(() => +(ticketPrice.value + serviceFee.value + fulfillmentFee.value).toFixed(2))

const buyerName = ref('')
const buyerEmail = ref('')

const isProcessing = ref(false)

/* New: unified loader state + derived view */
const isLoading = ref(false)
const loaderText = ref('')
const view = computed(() => (isLoading.value ? 'loading' : `step-${step.value}`))

function money(n) {
  return `US$ ${Number(n).toFixed(2)}`
}

function nextFromStep1() {
  step.value = 2
}
function goToReview() {
  step.value = 3
  // Delay to "reveal" hidden fees like the example
  revealFees.value = false
  setTimeout(() => {
    revealFees.value = true
    if (!tutorialComplete.value) {
      tutorialComplete.value = true
      localStorage.setItem(LOCAL_KEY, '1')
    }
  }, 900)
}

/* Helper: show loader, then target step (match Confirmshaming) */
function goToLoadingThen(targetStep, delay = 900, message = 'Loading…') {
  loaderText.value = message
  isLoading.value = true
  setTimeout(async () => {
    step.value = targetStep          // prepare next view while still loading
    await nextTick()                 // ensure DOM updates keep loader mounted first
    isLoading.value = false          // switch to target step; out-in ensures smooth swap
    loaderText.value = ''            // clear after transition
  }, delay)
}

// Loop back to step 1 when user clicks Pay now (with loader)
function payNow() {
  isProcessing.value = true
  setTimeout(() => {
    qty.value = 1
    buyerName.value = ''
    buyerEmail.value = ''
    revealFees.value = false
    isProcessing.value = false
    goToLoadingThen(1, 900, 'reseting dark pattern view') // message aligned with Confirmshaming
  }, 300)
}

// Close helpers (X/ESC/backdrop) consistent with other modals
function handleClose() {
  emit('close')
  if (tutorialComplete.value && typeof props.onComplete === 'function') props.onComplete()
}
function onXClick() {
  dialogRef.value?.close()
  handleClose()
}
function onDialogCancel(e) {
  e.preventDefault()
  dialogRef.value?.close()
  handleClose()
}
function onDialogNativeClose() {
  handleClose()
}

useOpenDialog(props, dialogRef, () => {
  // Reset per-open
  step.value = 1
  qty.value = 1
  buyerName.value = ''
  buyerEmail.value = ''
  revealFees.value = false
  isLoading.value = false
  loaderText.value = ''
  tutorialComplete.value = !!localStorage.getItem(LOCAL_KEY)
})
</script>

<style scoped>
.fee-fade-enter-active,
.fee-fade-leave-active { transition: opacity .18s ease, transform .18s ease; }
.fee-fade-enter-from,
.fee-fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* Keep modal open animation only */
@keyframes tutorial-modal-in {
  from { opacity:0; transform: translateY(12px) scale(.97); }
  to { opacity:1; transform: translateY(0) scale(1); }
}
.animate-in { animation: tutorial-modal-in .28s cubic-bezier(.25,.8,.25,1); }
@media (prefers-reduced-motion: reduce) { .animate-in { animation: none; } }

/* Card polish for hidden-costs */
.hc-card {
  border-radius: 0.9rem;
  will-change: transform;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
</style>
