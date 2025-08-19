<!-- file: pages/home.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount, reactive, watch } from 'vue'
import type { Component } from 'vue'

import ComparisonPreventionTutorial from '~/components/tutorials/ComparisonPreventionTutorial.vue'
import ConfirmshamingTutorial from '~/components/tutorials/ConfirmshamingTutorial.vue'
import FakeScarcityTutorial from '~/components/tutorials/FakeScarcityTutorial.vue'
import FakeUrgencyTutorial from '~/components/tutorials/FakeUrgencyTutorial.vue'
import HiddenCostsTutorial from '~/components/tutorials/HiddenCostsTutorial.vue'
import NaggingTutorial from '~/components/tutorials/NaggingTutorial.vue'
import ObstructionTutorial from '~/components/tutorials/ObstructionTutorial.vue'
import PreselectionTutorial from '~/components/tutorials/PreselectionTutorial.vue'
import TrickWordingTutorial from '~/components/tutorials/TrickWordingTutorial.vue'
import VisualInterfaceTutorial from '~/components/tutorials/VisualInterfaceTutorial.vue'

definePageMeta({ title: 'Home – Dark Patterns IO' })

const _tutorialComponentKeys = [
  'ComparisonPreventionTutorial','ConfirmshamingTutorial','FakeScarcityTutorial','FakeUrgencyTutorial',
  'HiddenCostsTutorial','NaggingTutorial','ObstructionTutorial','PreselectionTutorial','TrickWordingTutorial','VisualInterfaceTutorial',
] as const
type TutorialComponentKey = typeof _tutorialComponentKeys[number]
const tutorialComponents: Record<TutorialComponentKey, Component> = {
  ComparisonPreventionTutorial, ConfirmshamingTutorial, FakeScarcityTutorial, FakeUrgencyTutorial,
  HiddenCostsTutorial, NaggingTutorial, ObstructionTutorial, PreselectionTutorial, TrickWordingTutorial, VisualInterfaceTutorial,
}

/** Pattern list + short helper/user messages used in chat */
const patterns: Array<{ id:string; label:string; component:TutorialComponentKey; message:string; action:string }> = [
  {
    id: 'comparisonprevention',
    label: 'Comparison prevention',
    component: 'ComparisonPreventionTutorial',
    message: 'Some sites make it hard to compare products. For example, hiding features or burying prices so you can’t easily see what’s better or cheaper. It’s like shopping blindfolded. Let’s keep it going—open the next example.',
    action: 'Oooh, what’s this one about?'
  },
  {
    id: 'confirmshaming',
    label: 'Confirmshaming',
    component: 'ConfirmshamingTutorial',
    message: 'Yep. Confirmshaming makes the “No” option sound guilty, like “No, I don’t want to save money.” It pushes you to feel bad for saying no. Nice pace—on to the next one.',
    action: 'Wait, did they just insult me?'
  },
  {
    id: 'fakescarcity',
    label: 'Fake scarcity',
    component: 'FakeScarcityTutorial',
    message: 'Not always. Fake scarcity shows a fake “low stock” warning to pressure you into buying fast—even when plenty is available. Keep the momentum—let’s see what’s next.',
    action: 'Uh oh, only 2 left in stock?! Panic time?'
  },
  {
    id: 'fakeurgency',
    label: 'Fake urgency',
    component: 'FakeUrgencyTutorial',
    message: 'Relax 😎. Fake urgency uses countdowns or “deal ending soon” popups to stress you, even when the sale isn’t really ending. You’re doing great—next example.',
    action: 'OMG, timer is ticking down, I gotta click!'
  },
  {
    id: 'hiddencosts',
    label: 'Hidden costs',
    component: 'HiddenCostsTutorial',
    message: 'That’s hidden costs—extra fees, shipping, or random add-ons that only appear at the last step of checkout. Let’s keep it rolling—check the next step.',
    action: 'Why is my cart suddenly more expensive?!'
  },
  {
    id: 'nagging',
    label: 'Nagging',
    component: 'NaggingTutorial',
    message: 'Exactly. Nagging repeats the same request—like “Download our app” or “Turn on notifications”—over and over until you give in. Great progress—onto the next one.',
    action: 'This popup AGAIN?! Didn’t I close it?'
  },
  {
    id: 'obstruction',
    label: 'Obstruction',
    component: 'ObstructionTutorial',
    message: 'That’s obstruction. Making the easy choice hard (like cancelling or unsubscribing) while the company’s preferred choice is quick and simple. Nice work—let’s keep going.',
    action: 'Why does it take 3 clicks to cancel but 1 click to subscribe?'
  },
  {
    id: 'preselection',
    label: 'Preselection',
    component: 'PreselectionTutorial',
    message: 'Preselection is when boxes are already ticked for you—here it’s additional cookies (like “marketing” or “personalization”) turned on by default. Unless you manually uncheck them, you accept more tracking than you intended. Steady pace—see what’s next.',
    action: 'Huh, why are the additional cookies already checked?'
  },
  {
    id: 'trickwording',
    label: 'Trick wording',
    component: 'TrickWordingTutorial',
    message: 'Trick wording uses double negatives or confusing phrases so you’re not sure what you’re agreeing to. Classic brain twister. Nearly there—next example.',
    action: 'Uncheck this box if I don’t want to… wait, what?'
  },
  {
    id: 'visualinterface',
    label: 'Visual interface',
    component: 'VisualInterfaceTutorial',
    message: 'That’s visual manipulation. Using colors, size, or layout to make the company’s option super obvious while hiding yours. That’s the last example—nice finish!',
    action: 'Why’s the “Yes, keep sharing” button shiny and huge, but the No option tiny and grey?'
  },
]

/* Progress & modal */
const completed = ref<boolean[]>(Array(patterns.length).fill(false))
const activeModal = ref<string|null>(null)
const afterCloseMessages = ref<{side:'start'|'end',text:string}[]>([])
const completionAnnounced = ref<Set<string>>(new Set())

/* Share link reveal */
const showLinkHolder = ref<boolean>(false)
const linkAnimating = ref<boolean>(false)
function unlockLinkHolder() {
  showLinkHolder.value = true
  linkAnimating.value = false
  requestAnimationFrame(() => { requestAnimationFrame(() => { linkAnimating.value = true }) })
}

/* Chat state */
type Msg = { id:number; side:'start'|'end'; text?:string; typed?:string; typingIndicator?:boolean; pendingText?:string; duration?:number }
const chatMessages = ref<Msg[]>([])
const chatBoxRef = ref<HTMLDivElement|null>(null)
const messageQueue: Msg[] = []
const isTyping = ref(false)
let msgSeq = 0
const activeIntervals = new Set<number>()
const betweenBubbleDelayMs = 180
const wait = (ms:number)=>new Promise(r=>setTimeout(r,ms))

function scrollChatToBottom(){ const el = chatBoxRef.value; if(el) el.scrollTop = el.scrollHeight }

function startTyping(msg:Msg, speed=22){
  msg.typed=''; const full=msg.text||''; let i=0
  return new Promise<void>(resolve=>{
    const interval = window.setInterval(()=>{
      i++; msg.typed = full.slice(0,i); scrollChatToBottom()
      if(i>=full.length){ window.clearInterval(interval); activeIntervals.delete(interval); resolve() }
    }, speed)
    activeIntervals.add(interval)
  })
}
async function processQueue(){
  if(isTyping.value) return
  const next = messageQueue.shift(); if(!next) return
  isTyping.value = true; chatMessages.value.push(next); await nextTick()

  if(next.typingIndicator){
    scrollChatToBottom(); await wait(next.duration||700)
    if(next.pendingText){
      next.typingIndicator=false; next.text=next.pendingText; delete next.pendingText; next.typed=''
      await startTyping(next)
    } else {
      const idx = chatMessages.value.findIndex(m=>m.id===next.id)
      if(idx!==-1) chatMessages.value.splice(idx,1)
    }
  } else {
    await startTyping(next)
  }

  isTyping.value=false
  if(messageQueue.length) setTimeout(processQueue, betweenBubbleDelayMs)
}
function enqueueTypingThenMessage(side:'start'|'end', text:string, typingMs=800){
  const m = reactive<Msg>({ id: msgSeq++, side, typingIndicator:true, duration:typingMs, pendingText:text, typed:'' })
  messageQueue.push(m); processQueue()
}

/* Intro */
const initialDelayDone = ref(false)
const finishBtnDisabled = ref(true) // disable Finish button briefly so intro animates

// Helper-first intro pairs (light, descriptive)
const introPairs: Array<{ helper: string; me: string }> = [
  {
    helper:
      'Welcome! This site is a short, hands-on tour of DARK PATTERNS—design tricks that can steer choices without you noticing. We’ll explain the idea in plain language while you try small interactive examples.',
    me: 'Sounds good. What do I start with?'
  },
  {
    helper:
      'On the left side you’ll see the STEPS of the guide. Finish one and the next unlocks, so you learn one idea at a time without clutter.',
    me: 'Got it—go through them in order.'
  },
  {
    helper:
      'Each example is a simplified interface inspired by real sites. If you think back to your own browsing, you’ve probably seen something similar.',
    me: 'Yeah, that already feels familiar.'
  },
  {
    helper:
      'Under every example you’ll find small TIPS that tell you what to try so you can complete the step. Read the tip, interact a bit, then close the window to continue.',
    me: 'Easy enough. I’ll follow the tips.'
  },
  {
    helper:
      'Chats stay brief and you can go at your own pace—stop any time. When you’re ready, open the first step: Comparison Prevention.',
    me: 'Alright, opening the first step now.'
  },
  {
    helper:
      'Nice. When you finish, click the next item on the left—let’s see what’s next and keep the momentum.',
    me: 'On it.'
  }
]

// Final wrap-up sequence to append as the last messages
const wrapupSequence: Array<{side:'start'|'end'; text:string}> = [
  {
    side: 'start',
    text: 'Thanks for completing the tour! With this knowledge you can spot dark patterns, slow down when things feel pushy, compare clearly, and find opt-outs—so you stay in control when buying, subscribing, or handling cookies.'
  },
  {
    side: 'end',
    text: 'Nice—this was helpful. I’ll watch for these from now on.'
  },
  {
    side: 'start',
    text: 'If you have a minute, the short optional form below helps us improve the guide. If not, no worries—the button stays unlocked and you’re all set.'
  }
]
const appendedFinalChat = ref(false)

onMounted(async ()=>{
  await wait(2000) // 2s gate before step 1 can be opened
  initialDelayDone.value = true

  // Helper-first intro
  introPairs.forEach((p) => {
    enqueueTypingThenMessage('start', p.helper, 900) // Helper
    enqueueTypingThenMessage('end',   p.me,     500) // Me
  })

  // Re-enable the Finish button shortly after intro begins animating
  setTimeout(() => { finishBtnDisabled.value = false }, 1000)
})

/* Build full transcript (used after Finish Now) — includes wrap-up at the end */
function buildFinishedTranscript(): Msg[] {
  const out: Msg[] = []
  let idCounter = 0

  // Intro as Helper → Me
  for (const p of introPairs) {
    out.push({ id: idCounter++, side: 'start', text: p.helper, typed: p.helper })
    out.push({ id: idCounter++, side: 'end',   text: p.me,     typed: p.me })
  }

  // Each completed pattern: Me action → Helper message
  patterns.forEach((p) => {
    out.push({ id: idCounter++, side: 'end',   text: p.action,  typed: p.action })
    out.push({ id: idCounter++, side: 'start', text: p.message, typed: p.message })
  })

  // Final wrap-up (always last)
  wrapupSequence.forEach(s => out.push({ id: idCounter++, side: s.side, text: s.text, typed: s.text }))

  return out
}

/* Finish Now (2-click confirm) */
const wantConfirmFinish = ref(false)
const finishedByButton = ref(false)

function finishNow() {
  if (finishedByButton.value) return
  if (!wantConfirmFinish.value) { wantConfirmFinish.value = true; return }
  finishNowConfirmed()
}
function cancelFinishConfirm() { wantConfirmFinish.value = false }
function finishNowConfirmed() {
  wantConfirmFinish.value = false
  finishedByButton.value = true

  // mark all steps done
  completed.value = completed.value.map(() => true)

  // stop queues/typing
  activeIntervals.forEach(clearInterval); activeIntervals.clear()
  isTyping.value = false
  messageQueue.length = 0

  // print full transcript without typing (now includes wrap-up)
  chatMessages.value = buildFinishedTranscript()

  // reveal link
  unlockLinkHolder()
}

/* Modal control */
function openModal(id:string){
  const idx = patterns.findIndex(p=>p.id===id)
  if(!canOpen(idx)) return

  // Do NOT enqueue user action on open; only after complete + close.
  activeModal.value = null
  setTimeout(()=>{ activeModal.value = id }, 0)
}
function closeModal(){ activeModal.value = null }

/* Called by modal when a pattern is completed */
function completePattern(id:string){
  if (finishedByButton.value) return
  const idx = patterns.findIndex(p=>p.id===id)
  if (completionAnnounced.value.has(id)) return

  // Mark completed
  if (!completed.value[idx]) completed.value[idx] = true

  // Queue messages to appear ONLY after modal is closed:
  // 1) user's playful "action" line (chat-end)
  // 2) helper's explanation for the finished step (chat-start)
  const msgs: {side:'start'|'end',text:string}[] = []
  msgs.push({ side:'end',   text: patterns[idx].action })
  msgs.push({ side:'start', text: patterns[idx].message })

  // accumulate; flush happens when modal actually closes (see watchers)
  afterCloseMessages.value = afterCloseMessages.value.concat(msgs)
  completionAnnounced.value.add(id)
}

/* After-close flusher: only emits messages when no modal is open */
function flushAfterCloseIfReady(){
  if (finishedByButton.value) return
  if(!activeModal.value && afterCloseMessages.value.length){
    const toFlush = afterCloseMessages.value.slice()
    afterCloseMessages.value = []
    nextTick(()=>{ toFlush.forEach(m=>enqueueTypingThenMessage(m.side, m.text, 750)) })
  }
}
watch(activeModal, flushAfterCloseIfReady)
watch(afterCloseMessages, flushAfterCloseIfReady)

/* When ALL steps are completed normally, append the final wrap-up once the last modal is closed */
const allCompleted = computed(()=> completed.value.length>0 && completed.value.every(Boolean))
watch([allCompleted, activeModal], ()=>{
  if (finishedByButton.value) return
  if (allCompleted.value && !activeModal.value && !appendedFinalChat.value) {
    appendedFinalChat.value = true
    // enqueue final wrap-up messages with typing
    nextTick(()=>{
      wrapupSequence.forEach((m, idx) => {
        enqueueTypingThenMessage(m.side, m.text, idx === 0 ? 900 : 700)
      })
    })
    // also unlock the form when all steps are done
    if (!showLinkHolder.value) unlockLinkHolder()
  }
})

/* Progress helpers */
const completedCount = computed(()=> completed.value.filter(Boolean).length)
function canOpen(index:number){
  if(finishedByButton.value) return true
  if(index===0) return initialDelayDone.value
  return completed.value.slice(0,index).every(Boolean)
}
const activePattern = computed(()=> patterns.filter(p=>p.id===activeModal.value))

/* Viewport */
const viewportW = ref(0)
const isLtLg = computed(()=> viewportW.value>0 && viewportW.value<1024)
const isTooSmall = ref(false)
const isMobile = ref(false)
function updateViewport(){
  viewportW.value = window.innerWidth
  isMobile.value = window.matchMedia('(max-width: 639px)').matches
  isTooSmall.value = window.innerWidth < Math.max(1, Math.floor(window.screen.width/2))
}
onMounted(()=>{
  updateViewport()
  window.addEventListener('resize', updateViewport, { passive:true })
})

/* Entrance animations trigger */
const hasEntered = ref(false)
onMounted(()=>{ setTimeout(()=>{ hasEntered.value = true }, 20) })

/* Cleanup */
onBeforeUnmount(()=>{
  window.removeEventListener('resize', updateViewport)
  activeIntervals.forEach(clearInterval); activeIntervals.clear()
})

/* Footer year */
const year = new Date().getFullYear()
</script>

<template>
  <div :class="[{ entered: hasEntered }]">
    <!-- Guards -->
    <div v-if="isMobile" class="flex items-center justify-center min-h-screen bg-base-200">
      <div class="bg-base-100 rounded-xl shadow-lg p-8 text-center max-w-md mx-auto animate-fade-up" style="--delay:80ms">
        <h2 class="text-2xl font-bold mb-4">Mobile Not Supported</h2>
        <p class="text-lg text-base-content/80">
          This website is not available for mobile format right now.<br>
          For the full experience, please use a desktop browser in full screen.
        </p>
      </div>
    </div>

    <div v-else-if="isTooSmall" class="flex items-center justify-center min-h-screen bg-base-200">
      <div class="bg-base-100 rounded-xl shadow-lg p-8 text-center max-w-md mx-auto animate-fade-up" style="--delay:80ms">
        <h2 class="text-2xl font-bold mb-4">Screen Too Small</h2>
        <p class="text-lg text-base-content/80">
          For the full experience, please put your browser in full screen.
        </p>
      </div>
    </div>

    <!-- Main content -->
    <div v-else class="flex min-h-screen flex-col bg-base-200 text-lg font-semibold">
      <!-- Header -->
      <header class="w-full bg-base-100 shadow border-b-1 border-base-300 animate-fade-down" style="--delay:0ms">
        <div class="max-w-6xl mx-auto h-20 px-4 flex items-center justify-between">
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content">Dark Patterns App</h1>

          <!-- Finish Now / Confirm / Finished -->
          <div class="relative flex items-center">
            <button
              v-if="finishedByButton"
              class="btn btn-disabled pointer-events-none"
              aria-disabled="true"
            >
              Finished
            </button>

            <div v-else-if="wantConfirmFinish" class="flex items-center gap-2">
              <button class="btn btn-primary gap-2 confirm-grow" title="Click again to confirm" @click="finishNow">
                Click again to confirm
              </button>
              <button class="btn btn-ghost" title="Cancel" @click="cancelFinishConfirm">
                Cancel
              </button>
            </div>

            <button
              v-else
              class="btn btn-primary gap-2"
              :disabled="finishBtnDisabled"
              :title="finishBtnDisabled ? 'Starting…' : 'Finish tutorial and unlock the form'"
              @click="finishNow"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Finish now
            </button>
          </div>
        </div>
      </header>

      <!-- Main -->
      <main class="flex-1 min-h-[calc(100vh-5rem)] w-full flex flex-col">
        <div class="w-full max-w-5xl mx-auto px-2 sm:px-4 h-full py-4 sm:py-6 flex flex-col min-h-0">
          <div class="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 items-stretch flex-1 min-h-0">
            <!-- Steps card (LEFT) -->
            <div
              class="card w-full bg-base-100 border border-base-300 shadow lg:col-span-1 h-full"
              :class="{ 'min-h-[340px]': isLtLg }"
            >
              <div class="card-body p-2 sm:p-4 h-full overflow-auto">
                <ul class="steps steps-vertical">
                  <li
                    v-for="(pattern, i) in patterns"
                    :key="pattern.id"
                    class="step"
                    :class="completed[i] ? 'step-primary' : ''"
                    :title="canOpen(i) ? 'Open tutorial' : (i === 0 ? 'Opens after intro' : 'Complete prior steps first')"
                    @click="canOpen(i) && openModal(pattern.id)"
                  >
                    <!-- Circle stays normal, label dims if not clickable -->
                    <span
                      :class="[
                        'text-lg font-bold transition-opacity',
                        canOpen(i) ? 'opacity-100 cursor-pointer hover:underline' : 'opacity-40 cursor-not-allowed'
                      ]"
                    >
                      {{ pattern.label }}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Chat + Share -->
            <div class="flex flex-col flex-1 lg:col-span-2 h-full min-h-0 gap-4" :class="{ 'min-h-[340px]': isLtLg }">
              <!-- Chat -->
              <div
                class="card w-full bg-base-100 border border-base-300 shadow flex-1 min-h-0 flex flex-col overflow-hidden max-h-[60vh] lg:min-h-0 lg:max-h-none animate-fade-up"
                style="--delay:140ms"
                :class="{ 'min-h-[340px]': isLtLg }"
              >
                <div
                  ref="chatBoxRef"
                  class="flex-1 basis-0 w-full overflow-y-auto overflow-x-hidden p-2 sm:p-4 space-y-3 overscroll-contain [scrollbar-gutter:stable] text-base"
                >
                  <TransitionGroup name="bubble" tag="div" class="space-y-3">
                    <div
                      v-for="m in chatMessages"
                      :key="m.id"
                      class="chat"
                      :class="m.side === 'start' ? 'chat-start' : 'chat-end'"
                    >
                      <!-- Chat header -->
                      <div class="chat-header text-xs opacity-70 mb-1">
                        {{ m.side === 'start' ? 'Helper' : 'Me' }}
                      </div>

                      <!-- Chat bubble -->
                      <div
                        :class="[
                          'chat-bubble mx-2',
                          m.side === 'end' ? 'bg-primary text-primary-content' : ''
                        ]"
                      >
                        <div v-if="m.typingIndicator" class="typing-dots">
                          <span /><span /><span />
                        </div>
                        <template v-else>
                          <span v-if="m.typed && m.typed.length">{{ m.typed }}</span>
                          <span v-else class="opacity-60 select-none">...</span>
                        </template>
                      </div>
                    </div>
                  </TransitionGroup>
                </div>
              </div>

              <!-- Share -->
              <div
                class="card w-full bg-base-100 border border-base-300 shadow mt-0 animate-fade-up"
                style="--delay:200ms"
                :class="{ 'min-h-[120px]': isLtLg }"
              >
                <div class="card-body p-2 sm:p-6">
                  <button
                    v-if="allCompleted && showLinkHolder !== true"
                    class="btn btn-primary w-full text-center"
                    :disabled="!allCompleted"
                    :title="'Ready to share'"
                    @click="unlockLinkHolder"
                  >
                    Form unlocked
                  </button>

                  <div
                    v-else-if="showLinkHolder === true"
                    class="w-full flex items-center justify-center rounded-btn bg-base-300 text-base-content font-semibold text-sm px-3 py-2 overflow-x-auto"
                    :class="{ 'reveal-pop': linkAnimating }"
                  >
                    <a
                      href="https://docs.google.com/forms/d/e/1FAIpQLSf8YubbPL3MiE19FYhTSwhWl3dgw_C9CIXKadyCjJFUm2ifxA/viewform?usp=sharing&ouid=110532940221351851170"
                      target="_blank" rel="noopener noreferrer"
                      class="underline whitespace-nowrap hover:opacity-90"
                    >
                      CLICK HERE TO OPEN THE FORM
                    </a>
                  </div>

                  <button
                    v-if="!allCompleted"
                    class="btn btn-primary w-full text-center"
                    :disabled="!allCompleted"
                    :title="`${completedCount}/${patterns.length} to unlock`"
                  >
                    {{ completedCount }}/{{ patterns.length }} to unlock
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Explanation -->
      <section class="w-full min-h-screen bg-primary text-base-300 flex flex-col animate-fade-up" style="--delay:260ms">
        <div class="flex-1 max-w-6xl mx-auto py-12 sm:py-16 prose prose-invert px-3 sm:px-6">
          <h2 class="text-3xl font-semibold mb-6">What Are <strong>Dark Patterns</strong>?</h2>
          <p class="text-lg text-base-100">
            <strong>Dark patterns</strong> are <strong>deceptive interface design choices</strong> that
            nudge or manipulate users into taking actions they might not have taken
            if the design were neutral or transparent.
          </p>
          <p class="text-lg text-base-100">
            They exploit cognitive biases, urgency, confusion, or misdirection to
            drive <strong>sign-ups</strong>, <strong>purchases</strong>, <strong>data sharing</strong>,
            or <strong>unwanted consent</strong>.
          </p>

          <h3 class="mt-8 text-xl font-semibold">Common Examples</h3>
          <ul class="list-disc pl-6 space-y-2 text-lg text-base-100">
            <li><strong>Comparison Prevention</strong>: hides or fragments comparisons to limit informed choice.</li>
            <li><strong>Confirmshaming</strong>: guilt-laden or shaming opt-out wording.</li>
            <li><strong>Fake Scarcity</strong>: unverified or recurring low-stock claims.</li>
            <li><strong>Fake Urgency</strong>: countdowns/timers that reset or lack real deadlines.</li>
            <li><strong>Hidden Costs</strong>: fees added late in the checkout journey.</li>
            <li><strong>Nagging</strong>: repeated prompts after dismissal.</li>
            <li><strong>Obstruction</strong>: making cancellation or preferred flows harder.</li>
            <li><strong>Preselection</strong>: default-checked boxes steering user choices.</li>
            <li><strong>Trick Wording</strong>: confusing syntax, double negatives, or ambiguity.</li>
            <li><strong>Visual Interface Manipulation</strong>: layout/color emphasis nudging less transparent options.</li>
          </ul>

          <h3 class="mt-8 text-xl font-semibold">Why This Matters</h3>
          <p class="text-lg text-base-100">
            These patterns can erode <strong>trust</strong>, reduce <strong>user autonomy</strong>, and
            in some jurisdictions may even challenge emerging <strong>regulatory standards</strong>.
          </p>

          <h3 class="mt-8 text-xl font-semibold">About This Project</h3>
          <p class="text-lg text-base-100">
            This is a <strong>school research project</strong> exploring how many people
            can recognize and correctly identify different dark patterns once they
            experience guided examples. Your interaction helps evaluate:
          </p>
          <ul class="list-disc pl-6 space-y-1 text-lg text-base-100">
            <li><strong>Awareness</strong>: which patterns users already know.</li>
            <li><strong>Recognition</strong>: which designs cause hesitation or confusion.</li>
            <li><strong>Retention</strong>: whether sequential exposure improves recall.</li>
          </ul>
          <p class="text-lg text-base-100">
            The tutorials you complete contribute to understanding how effective a
            <strong>step-by-step experiential approach</strong> is versus passive definitions.
          </p>
          <p class="mt-10 italic opacity-90 text-lg text-base-100">
            Thank you for participating—your journey through these examples
            supports educational analysis, not commercial tracking.
          </p>
        </div>

        <footer class="w-full bg-primary/90 backdrop-blur-sm border-t border-base-300/40 animate-fade-up" style="--delay:320ms">
          <div class="max-w-6xl mx-auto px-6 py-4 text-xs sm:text-sm flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <span>&copy; {{ year }} Dark Patterns IO – Educational Use</span>
            <span class="opacity-80">Built for research & awareness. No commercial intent.</span>
          </div>
        </footer>
      </section>

      <!-- Active tutorial modals -->
      <component
        :is="tutorialComponents[pattern.component]"
        v-for="pattern in activePattern"
        :id="pattern.id" :key="pattern.id"
        :open="true" :on-complete="() => completePattern(pattern.id)"
        @close="closeModal"
      />
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes fadeDown { from { opacity: 0; transform: translateY(-14px) scale(1); } to { opacity: 1; transform: translateY(0) scale(1); } }
.entered .animate-fade-up   { animation: fadeUp .56s cubic-bezier(.25,.8,.25,1) both;   animation-delay: var(--delay, 0ms); }
.entered .animate-fade-down { animation: fadeDown .56s cubic-bezier(.25,.8,.25,1) both; animation-delay: var(--delay, 0ms); }

@keyframes confirmGrow { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
.confirm-grow { animation: confirmGrow .18s ease-out both; }

@keyframes revealPop {
  0% { opacity: 0; transform: scale(.96); }
  60% { opacity: 1; transform: scale(1.03); }
  100% { opacity: 1; transform: scale(1); }
}
.reveal-pop { animation: revealPop .38s cubic-bezier(.2,.8,.2,1) both; }

.bubble-enter-active { transition: opacity .18s ease, transform .18s ease; }
.bubble-enter-from   { opacity: 0; transform: translateY(4px) scale(.98); }
.bubble-move         { transition: transform .18s ease; }

.typing-dots { display: inline-flex; gap: 6px; align-items: center; }
.typing-dots span {
  width: 6px; height: 6px; border-radius: 9999px; background: currentColor; opacity: .35;
  animation: typing-blink 1s infinite ease-in-out;
}
.typing-dots span:nth-child(2){ animation-delay: .15s; }
.typing-dots span:nth-child(3){ animation-delay: .3s; }
@keyframes typing-blink { 0%,80%,100%{opacity:.25; transform:translateY(0)} 40%{opacity:.9; transform:translateY(-1px)} }

.fade-enter-active, .fade-leave-active { transition: opacity .35s, transform .35s; }
.fade-enter-from,   .fade-leave-to     { opacity: 0; transform: scale(.98); }
.fade-enter-to,     .fade-leave-from   { opacity: 1; transform: scale(1); }

.progress-track { width: 100%; height: 6px; border-radius: 9999px; background: linear-gradient(to right, oklch(var(--b3)) 0%, oklch(var(--b3)) 100%); overflow: hidden; }
.progress-fill  { height: 100%; width: 0%; background: oklch(var(--p)); transition: width .35s cubic-bezier(.25,.8,.25,1); }
</style>
