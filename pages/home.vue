// file: pages/home.vue
<script setup lang="ts">
/* Key fixes:
   - Remove DOM reads from template; use reactive viewport width instead.
   - Keep all window access inside onMounted; guard resize with a single handler.
   - Keep comments short + high-signal for publication. */

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

definePageMeta({ title: 'Home – Dark Patterns IO' }) // page-level title; keeps SSR/CSR head in sync

// Strongly-typed component map
const _tutorialComponentKeys = [
  'ComparisonPreventionTutorial',
  'ConfirmshamingTutorial',
  'FakeScarcityTutorial',
  'FakeUrgencyTutorial',
  'HiddenCostsTutorial',
  'NaggingTutorial',
  'ObstructionTutorial',
  'PreselectionTutorial',
  'TrickWordingTutorial',
  'VisualInterfaceTutorial',
] as const
type TutorialComponentKey = typeof _tutorialComponentKeys[number]
const tutorialComponents: Record<TutorialComponentKey, Component> = {
  ComparisonPreventionTutorial,
  ConfirmshamingTutorial,
  FakeScarcityTutorial,
  FakeUrgencyTutorial,
  HiddenCostsTutorial,
  NaggingTutorial,
  ObstructionTutorial,
  PreselectionTutorial,
  TrickWordingTutorial,
  VisualInterfaceTutorial,
}

// Static content (pure data keeps SSR stable)
const patterns: Array<{
  id: string
  label: string
  component: TutorialComponentKey
  message: string
  action: string
}> = [
  { id: 'comparisonprevention', label: 'Comparison prevention', component: 'ComparisonPreventionTutorial', message: 'The carousel made comparing plans hard – especially since plan UltraStream hid taxes. Always check per-unit costs and fine print to avoid false discounts.', action:'Opened the first one, let’s go.' },
  { id: 'confirmshaming', label: 'Confirmshaming', component: 'ConfirmshamingTutorial', message: 'Here, declining a newsletter shows "OK, I’ll pay more" – framing "no" as foolish. Remember: ethical design never punishes refusal!', action:'Alright, #2 is checked off.' },
  { id: 'fakescarcity', label: 'Fake scarcity', component: 'FakeScarcityTutorial', message: 'Notice how "Only 2 left!" triggered urgency despite ample stock? This exact tactic is used daily on shopping sites – always verify stock claims to avoid false pressure.', action:'Just had a look at example three.' },
  { id: 'fakeurgency', label: 'Fake urgency', component: 'FakeUrgencyTutorial', message: 'The artificial timer rushed you, but real sales rarely end – they just restart. This endless "urgency" cycle is standard on retail sites.', action:'Fourth one done and dusted.' },
  { id: 'hiddencosts', label: 'Hidden costs', component: 'HiddenCostsTutorial', message: 'Notice the "service fees" added at checkout? This bait-and-switch tactic is standard on ticketing sites – always check the final total before paying.', action:'#5 is out of the way.' },
  { id: 'nagging', label: 'Nagging', component: 'NaggingTutorial', message: 'Notice how the popup reappeared after declining? Real nagging systems loop until you choose what they wanted – this denies genuine choice.', action:'I went through the sixth example.' },
  { id: 'obstruction', label: 'Obstruction', component: 'ObstructionTutorial', message: 'Notice how many steps it took? This isn’t poor design – it’s deliberate obstruction. Real sites bury cancellation to retain users', action:'Number seven opened, moving on.' },
  { id: 'preselection', label: 'Preselection', component: 'PreselectionTutorial', message: 'All options were pre-checked – forcing you to manually uncheck extras. Sites do this to trick users into accidental consent.', action:'Example eight is wrapped up.' },
  { id: 'trickwording', label: 'Trick wording', component: 'TrickWordingTutorial', message: 'The double-negative might have tricked you. Real sites use this language maze to retain users – always pause and reread options.', action:'Took care of #9.' },
  { id: 'visualinterface', label: 'Visual interface', component: 'VisualInterfaceTutorial', message: 'You’ve just learned how to spot dark patterns and how to stay safer online by recognizing tricks that websites often use. Before you go, we’d love your help. A new button has been unlocked below — filling out the short form will support our research and make this project even better. Your experience matters, and together we can help make the web a fairer place.', action:'All ten finished — that’s the lot.' },
]

// Progress + modal state
const completed = ref<boolean[]>(Array(patterns.length).fill(false))
const activeModal = ref<string|null>(null)
const afterCloseMessages = ref<{side:'start'|'end',text:string}[]>([])
const openedPatterns = ref<Set<string>>(new Set())
const completionAnnounced = ref<Set<string>>(new Set())

// Share button state
const showLinkHolder = ref<boolean>(false)
function unlockLinkHolder() {
  showLinkHolder.value = true
}

// Chat state
type Msg = { id:number; side:'start'|'end'; text?:string; typed?:string; typingIndicator?:boolean; pendingText?:string; duration?:number }
const chatMessages = ref<Msg[]>([])
const chatBoxRef = ref<HTMLDivElement|null>(null)
const messageQueue: Msg[] = []
const isTyping = ref(false)
let msgSeq = 0
const activeIntervals = new Set<number>()
const betweenBubbleDelayMs = 180
const wait = (ms:number) => new Promise(r => setTimeout(r, ms))

// Typewriter
function startTyping(msg: Msg, speed = 22) {
  msg.typed = ''
  const full = msg.text || ''
  let i = 0
  return new Promise<void>(resolve => {
    const interval = window.setInterval(() => {
      i++
      msg.typed = full.slice(0, i)
      scrollChatToBottom()
      if (i >= full.length) {
        window.clearInterval(interval)
        activeIntervals.delete(interval)
        resolve()
      }
    }, speed)
    activeIntervals.add(interval)
  })
}
async function processQueue() {
  if (isTyping.value) return
  const next = messageQueue.shift()
  if (!next) return
  isTyping.value = true
  chatMessages.value.push(next)
  await nextTick()

  if (next.typingIndicator) {
    scrollChatToBottom()
    await wait(next.duration || 700)
    if (next.pendingText) {
      next.typingIndicator = false
      next.text = next.pendingText
      delete next.pendingText
      next.typed = ''
      await startTyping(next)
    } else {
      const idx = chatMessages.value.findIndex(m => m.id === next!.id)
      if (idx !== -1) chatMessages.value.splice(idx, 1)
    }
  } else {
    await startTyping(next)
  }

  isTyping.value = false
  if (messageQueue.length) setTimeout(processQueue, betweenBubbleDelayMs)
}
function enqueueMessage(side:'start'|'end', text:string) {
  const m = reactive<Msg>({ id: msgSeq++, side, text, typed: '' })
  messageQueue.push(m)
  processQueue()
}
function enqueueTypingThenMessage(side:'start'|'end', text:string, typingMs = 750) {
  const m = reactive<Msg>({ id: msgSeq++, side, typingIndicator: true, duration: typingMs, pendingText: text, typed: '' })
  messageQueue.push(m)
  processQueue()
}
function pushGuide(text:string) { enqueueMessage('start', text) }

// Safe DOM access via ref (not in template)
function scrollChatToBottom() {
  const el = chatBoxRef.value
  if (el) el.scrollTop = el.scrollHeight
}

// Step helper
function explainFor(id:string) {
  const map: Record<string,string> = {
    comparisonprevention: 'The carousel made comparing plans hard – especially since Plan C hid taxes. Always check per-unit costs and fine print to avoid false discounts.',
    confirmshaming: 'Confirmshaming guilts users into choices by shaming refusal. See what would happen if you didn’t want to give your email — notice how they present that choice. Try it out, then we’ll move to the next.',
    fakescarcity: 'The next one is Fake Scarcity. This pressures quick decisions by implying limited stock. Here, you’ll toggle between real inventory and manipulated low-stock displays.',
    fakeurgency: 'Pattern #4 is Fake Urgency. This pressures quick decisions with false time limits. Below, a countdown claims "Sale ends soon!" – use the "End Sale" button to skip waiting. Test this tactic, then we’ll proceed.',
    hiddencosts: 'Hidden Costs is next on the list. Sites add unexpected fees late in checkout. Below, try buying concert tickets but be ready for a surprise. Complete the process, then we’ll continue.',
    nagging: 'Nagging is dark pattern that overwhelm you with repeated permission requests. Below, you’ll face a popup asking for notifications – interact with it to experience the persistence.',
    obstruction: 'At #7 we have Obstruction. This intentionally complicates simple tasks like canceling subscriptions. Below, hunt for the cancellation option hidden among these cards – try stopping your "service".',
    preselection: 'Preselection is dark pattern where sites set default choices against your interests. Below, try selecting only "Necessary Cookies" – notice how options are pre-checked against you. Test the buttons, then proceed.',
    trickwording: 'Pattern #9: Trick Wording. This uses confusing language to mislead decisions. Below, try unsubscribing from the newsletter – pay close attention to the checkbox wording.',
    visualinterface: 'For the last one we have Visual Interface Interference. Sites use size and color to steer your choices. Below, a large colored button pushes their goal while your true option is small and neutral. Test both buttons to feel the influence.'
  }
  return map[id] || 'Short guidance for this step.'
}

// Initial guide
onMounted(() => {
  pushGuide(`Hi there! Welcome to Dark Patterns Exposed – your friendly guide to sneaky design tricks online. I’m here to help you spot them like a pro! Ready to dive in?`)
  pushGuide(`Here’s how it works: I’ll send short chat bubbles (like this!). You’ll explore real interactive examples. Learn to protect yourself in under 5 mins!`)
  pushGuide(`Let’s start! Click "Comparison prevention" on the list to uncover your first dark pattern. Trust me – you’ll spot these everywhere after today!`)
  pushGuide(`This dark pattern hides options to manipulate choice. Here, a carousel shows one data plan at a time to make side-by-side comparison difficult.`)
})

// Modal control
function openModal(id:string) {
  const idx = patterns.findIndex(p => p.id === id)
  if (!canOpen(idx)) return
  if (!openedPatterns.value.has(id)) {
    afterCloseMessages.value = [{ side: 'end', text: patterns[idx].action }]
    openedPatterns.value.add(id)
  }
  activeModal.value = null
  setTimeout(() => { activeModal.value = id }, 0)
}
function closeModal() { activeModal.value = null }
function completePattern(id:string) {
  const idx = patterns.findIndex(p => p.id === id)
  if (completionAnnounced.value.has(id)) return
  if (!completed.value[idx]) completed.value[idx] = true
  const msgs = [...afterCloseMessages.value]
  msgs.push({ side: 'start', text: patterns[idx].message })
  const next = patterns[idx + 1]
  if (next) msgs.push({ side: 'start', text: explainFor(next.id) })
  afterCloseMessages.value = msgs
  completionAnnounced.value.add(id)
}

// Flush queued messages after modal closes
function flushAfterCloseIfReady() {
  if (!activeModal.value && afterCloseMessages.value.length) {
    const toFlush = afterCloseMessages.value.slice()
    afterCloseMessages.value = []
    nextTick(() => { toFlush.forEach(m => enqueueTypingThenMessage(m.side, m.text, 750)) })
  }
}
watch(activeModal, flushAfterCloseIfReady)
watch(afterCloseMessages, flushAfterCloseIfReady)

// Progress helpers
const completedCount = computed(() => completed.value.filter(Boolean).length)
const allCompleted = computed(() => completed.value.length > 0 && completed.value.every(Boolean))
function canOpen(index:number) { return index === 0 || completed.value.slice(0, index).every(Boolean) }
const activePattern = computed(() => patterns.filter(p => p.id === activeModal.value))

// Viewport state (replaces $root.$el.offsetWidth usage)
const viewportW = ref(0)
const isLtLg = computed(() => viewportW.value > 0 && viewportW.value < 1024) // lg proxy
const isTooSmall = ref(false)
const isMobile = ref(false)
function updateViewport() {
  viewportW.value = window.innerWidth
  isMobile.value = window.matchMedia('(max-width: 639px)').matches
  isTooSmall.value = window.innerWidth < Math.max(1, Math.floor(window.screen.width / 2))
}
onMounted(() => {
  updateViewport()
  window.addEventListener('resize', updateViewport, { passive: true })
})

// Single unmount cleans everything (intervals + listeners)
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport)
  activeIntervals.forEach(clearInterval)
  activeIntervals.clear()
})

// SSR-safe footer year
const year = new Date().getFullYear()
</script>

<template>
  <div>
    <!-- Responsive gates -->
    <div v-if="isMobile" class="flex items-center justify-center min-h-screen bg-base-200">
      <div class="bg-base-100 rounded-xl shadow-lg p-8 text-center max-w-md mx-auto">
        <h2 class="text-2xl font-bold mb-4">Mobile Not Supported</h2>
        <p class="text-lg text-base-content/80">
          This website is not available for mobile format right now.<br >
          For the full experience, please use a desktop browser in full screen.
        </p>
      </div>
    </div>

    <div v-else-if="isTooSmall" class="flex items-center justify-center min-h-screen bg-base-200">
      <div class="bg-base-100 rounded-xl shadow-lg p-8 text-center max-w-md mx-auto">
        <h2 class="text-2xl font-bold mb-4">Screen Too Small</h2>
        <p class="text-lg text-base-content/80">
          For the full experience, please put your browser in full screen.
        </p>
      </div>
    </div>

    <!-- Main content -->
    <div v-else class="flex min-h-screen flex-col bg-base-200 text-lg font-semibold">
      <!-- Header -->
      <header class="w-full bg-base-100 shadow border-b-1 border-base-300">
        <div class="max-w-6xl mx-auto h-20 px-4 flex items-center justify-start">
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content">Dark Patterns App</h1>
        </div>
      </header>

      <!-- Main -->
      <main class="flex-1 min-h-[calc(100vh-5rem)] w-full flex flex-col">
        <div class="w-full max-w-5xl mx-auto px-2 sm:px-4 h-full py-4 sm:py-6 flex flex-col min-h-0">
          <div class="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 items-stretch flex-1 min-h-0">
            <!-- Steps card (LEFT) -->
            <div class="card w-full bg-base-100 border border-base-300 shadow lg:col-span-1 h-full" :class="{ 'min-h-[340px]': isLtLg }">
              <div class="card-body p-2 sm:p-4 h-full overflow-auto">
                <ul class="steps steps-vertical">
                  <li
                    v-for="(pattern, i) in patterns"
                    :key="pattern.id"
                    :class="[
                      'step',
                      completed[i] ? 'step-primary' : '',
                      !canOpen(i) ? 'pointer-events-none' : 'cursor-pointer'
                    ]"
                    @click="openModal(pattern.id)"
                  >
                    <span :class="['text-lg font-bold text-base-content', !canOpen(i) ? 'opacity-40' : '']">
                      {{ pattern.label }}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Chat + Share (RIGHT) -->
            <div class="flex flex-col flex-1 lg:col-span-2 h-full min-h-0 gap-4" :class="{ 'min-h-[340px]': isLtLg }">
              <!-- Chat card -->
              <div class="card w-full bg-base-100 border border-base-300 shadow flex-1 min-h-0 flex flex-col overflow-hidden max-h-[60vh] lg:min-h-0 lg:max-h-none" :class="{ 'min-h-[340px]': isLtLg }">
                <div ref="chatBoxRef" class="flex-1 basis-0 w-full overflow-y-auto overflow-x-hidden p-2 sm:p-4 space-y-3 overscroll-contain [scrollbar-gutter:stable] text-base">
                  <TransitionGroup name="bubble" tag="div" class="space-y-3">
                    <div v-for="m in chatMessages" :key="m.id" class="chat" :class="m.side === 'start' ? 'chat-start' : 'chat-end'">
                      <div :class="['chat-bubble mx-2', m.side === 'end' ? 'bg-primary text-primary-content' : '']">
                        <div v-if="m.typingIndicator" class="typing-dots"><span /><span /><span /></div>
                        <template v-else>
                          <span v-if="m.typed && m.typed.length">{{ m.typed }}</span>
                          <span v-else class="opacity-60 select-none">...</span>
                        </template>
                      </div>
                    </div>
                  </TransitionGroup>
                </div>
              </div>

              <!-- Share button card -->
              <div class="card w-full bg-base-100 border border-base-300 shadow mt-0" :class="{ 'min-h-[120px]': isLtLg }">
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

                  <div v-else-if="showLinkHolder === true" class="w-full h-12 flex items-center justify-center rounded-btn bg-base-300 text-base-content font-semibold text-lg transition-all">
                    <span>🔗 Link will appear here</span>
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

      <!-- Explanation section -->
      <section class="w-full min-h-screen bg-primary text-base-300 flex flex-col">
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

          <h3 class="mt-8 text-xl font-semibold">What You Can Do</h3>
          <p class="text-lg text-base-100">
            Learn to pause when something feels rushed, unclear, or asymmetric.
            Question: “Does this benefit me or only the platform?” Awareness
            transforms <strong>manipulative friction</strong> into <strong>informed choice</strong>.
          </p>

          <p class="mt-10 italic opacity-90 text-lg text-base-100">
            Thank you for participating—your journey through these examples
            supports educational analysis, not commercial tracking.
          </p>
        </div>

        <footer class="w-full bg-primary/90 backdrop-blur-sm border-t border-base-300/40">
          <div class="max-w-6xl mx-auto px-6 py-4 text-xs sm:text-sm flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <span>&copy; {{ year }} Dark Patterns IO – Educational Use</span>
            <span class="opacity-80">Built for research & awareness. No commercial intent.</span>
          </div>
        </footer>
      </section>

      <!-- Active tutorial modal -->
      <component
        :is="tutorialComponents[pattern.component]"
        v-for="pattern in activePattern"
        :id="pattern.id"
        :key="pattern.id"
        :open="true"
        :on-complete="() => completePattern(pattern.id)"
        @close="closeModal"
      />
    </div>
  </div>
</template>

<style scoped>
/* Small, focused styles for publish-ready UI */
.progress-track { width: 100%; height: 6px; border-radius: 9999px; background: linear-gradient(to right, oklch(var(--b3)) 0%, oklch(var(--b3)) 100%); overflow: hidden; }
.progress-fill { height: 100%; width: 0%; background: oklch(var(--p)); transition: width .35s cubic-bezier(.25,.8,.25,1); }

.bubble-enter-active { transition: opacity .18s ease, transform .18s ease; }
.bubble-enter-from { opacity: 0; transform: translateY(4px) scale(.98); }
.bubble-move { transition: transform .18s ease; }

.typing-dots { display: inline-flex; gap: 6px; align-items: center; }
.typing-dots span { width: 6px; height: 6px; border-radius: 9999px; background: currentColor; opacity: .35; animation: typing-blink 1s infinite ease-in-out; }
.typing-dots span:nth-child(2) { animation-delay: .15s; }
.typing-dots span:nth-child(3) { animation-delay: .3s; }
@keyframes typing-blink { 0%, 80%, 100% { opacity: .25; transform: translateY(0) } 40% { opacity: .9; transform: translateY(-1px) } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.35s, transform 0.35s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: scale(0.98); }
.fade-enter-to, .fade-leave-from { opacity: 1; transform: scale(1); }
</style>
