// file: pages/index.vue
<template>
  <!-- Entire page is client-only via definePageMeta({ ssr:false }) to avoid hydration issues -->
  <div class="h-screen w-screen overflow-hidden bg-base-200">
    <!-- Mobile block -->
    <template v-if="isMobile">
      <div class="flex items-center justify-center min-h-screen bg-base-200">
        <div class="bg-base-100 rounded-xl shadow-lg p-8 text-center max-w-md mx-auto">
          <h2 class="text-2xl font-bold mb-4">Mobile Not Supported</h2>
          <p class="text-lg text-base-content/80">
            This website is not available for mobile format right now.<br>
            For the full experience, please use a desktop browser in full screen.
          </p>
        </div>
      </div>
    </template>

    <!-- Too-small desktop block -->
    <template v-else-if="isTooSmall">
      <div class="flex items-center justify-center min-h-screen bg-base-200">
        <div class="bg-base-100 rounded-xl shadow-lg p-8 text-center max-w-md mx-auto">
          <h2 class="text-2xl font-bold mb-4">Screen Too Small</h2>
          <p class="text-lg text-base-content/80">
            For the full experience, please put your browser in full screen.
          </p>
        </div>
      </div>
    </template>

    <!-- Main hero panes -->
    <template v-else>
      <Transition :name="showLeft ? 'slide-left' : 'slide-right'" mode="out-in">
        <!-- LEFT PANE -->
        <section
          v-if="showLeft"
          key="left"
          class="fixed inset-0 bg-primary text-base-100 h-screen w-screen grid place-items-center"
          aria-labelledby="title-dark-patterns"
        >
          <div>
            <h1 id="title-dark-patterns" class="text-9xl font-black text-center leading-none">
              DARK PATTERNS
            </h1>
            <p class="mt-8 text-2xl text-base-100 text-center max-w-xl mx-auto">
              Discover how design tricks can influence your choices online. Learn to spot manipulative patterns and protect yourself.
            </p>
            <div class="flex justify-center mt-10">
              <!-- Keep disabled state derived; start as true to avoid UI jumps -->
              <button
                type="button"
                class="btn btn-lg bg-base-100 text-primary border-none font-semibold text-lg w-80 py-4 transition-all duration-200"
                :disabled="!loaded"
                @click="showLeft = false"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <!-- RIGHT PANE -->
        <section
          v-else
          key="right"
          class="fixed inset-0 bg-base-200 text-base-content h-screen w-screen grid place-items-center"
          aria-labelledby="title-honest-design"
        >
          <!-- Adds slide-out-on-click effect before route change -->
          <div :class="{ 'slide-content-out': slideOut }">
            <h2 id="title-honest-design" class="text-9xl font-black text-center leading-none">
              Honest Design
            </h2>
            <p class="mt-8 text-2xl text-center max-w-xl mx-auto">
              This site helps you spot dark patterns and avoid being tricked. Explore real world examples and test your awareness.
            </p>
            <div class="flex justify-center items-center gap-6 mt-10">
              <button
                type="button"
                class="btn btn-lg btn-outline font-semibold text-lg w-40 py-4"
                @click="showLeft = true"
              >
                Back
              </button>
              <button
                type="button"
                class="btn btn-lg btn-primary font-semibold text-base-content text-lg w-40 py-4"
                @click="handleLearnMore"
              >
                Learn More
              </button>
            </div>
          </div>
        </section>
      </Transition>
    </template>
  </div>
</template>

<script setup lang="ts">
// Turn off SSR for this page to eliminate hydration node mismatches caused by window-dependent layout.
definePageMeta({ ssr: false, title: 'Dark Patterns — Intro', layout: false })

// Basic SEO; loads on client only due to ssr:false
useHead({
  meta: [
    { name: 'description', content: 'Learn to recognize dark patterns and embrace honest design.' },
    { property: 'og:title', content: 'Dark Patterns — Honest Design' },
    { property: 'og:description', content: 'Explore examples and test your awareness.' },
  ],
})

// UI state
const showLeft = ref<boolean>(true)
const loaded = ref<boolean>(true)        // true to avoid initial disabled button flicker
const slideOut = ref<boolean>(false)

// Responsive guards (client-only)
const isTooSmall = ref<boolean>(false)
const isMobile = ref<boolean>(false)

// Keep JS timeout in sync with CSS duration (see <style>)
const TRANSITION_MS = 600

// Compute breakpoints on client; match Tailwind sm (<640px)
const checkScreen = () => {
  isMobile.value = window.matchMedia('(max-width: 639px)').matches
  // "Too small" = half of physical screen width (conservative gate)
  isTooSmall.value = window.innerWidth < Math.max(1, Math.floor(window.screen.width / 2))
}

onMounted(() => {
  checkScreen()
  window.addEventListener('resize', checkScreen, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkScreen)
})

// Play slide-out, then navigate (Nuxt navigateTo preferred over router.push)
function handleLearnMore() {
  slideOut.value = true
  setTimeout(() => navigateTo('/loading'), TRANSITION_MS)
}
</script>

<style scoped>
/* Pane transitions */
.slide-left-enter-active, .slide-left-leave-active,
.slide-right-enter-active, .slide-right-leave-active {
  transition: transform 0.6s cubic-bezier(.55, 0, .1, 1);
}
.slide-left-enter-from { transform: translateX(-100vw); }
.slide-left-leave-to   { transform: translateX(100vw);  }
.slide-right-enter-from{ transform: translateX(100vw);  }
.slide-right-leave-to  { transform: translateX(-100vw); }

/* Content slides left before route change; keep in sync with TRANSITION_MS */
.slide-content-out {
  transform: translateX(-100vw);
  transition: transform 0.6s cubic-bezier(.55, 0, .1, 1);
}
</style>
