<template>
  <div class="card pc-card w-80 bg-gradient-to-br from-base-100 to-base-200/60 border border-base-300/60 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20">
    <figure class="relative h-48 w-full overflow-hidden m-0 group">
      <img
        :src="image"
        :alt="title"
        class="w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        @error="useFallbackImage"
      >
    </figure>
    <div class="card-body pt-4">
      <!-- Title and Price closer together -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center">
          <div class="badge badge-primary shadow-sm text-xs font-semibold px-2 py-1 mr-2 rounded-md h-5">NEW</div>
          <h2 class="card-title break-words leading-tight">
            {{ truncatedTitle }}
          </h2>
        </div>
        <div class="flex items-center">
          <span class="text-2xl font-extrabold text-primary mr-2">{{ price }}</span>
          <span class="line-through text-base-content/60">{{ oldPrice }}</span>
        </div>
      </div>

      <!-- Bigger gap before rating/sold/save/left -->
      <div class="mt-1 flex flex-col gap-1">
        <div class="flex items-center">
          <div class="flex items-center">
            <div class="rating rating-xs rating-half p-0 m-0">
              <template v-for="i in 10" :key="i">
                <input
                  type="radio"
                  :name="`rating-card-${idx}`"
                  :aria-label="`${i/2} star`"
                  :checked="Math.round(roundedRating * 2) === i"
                  class="mask mask-star-2"
                  :class="i % 2 === 0 ? 'mask-half-2 bg-warning' : 'mask-half-1 bg-warning'"
                  disabled
                >
              </template>
            </div>
            <span class="ml-2 text-base-content/70 font-semibold flex items-center">
              {{ roundedRating }}
              <!-- Visible primary-content divider -->
              <span class="mx-2 inline-block h-4 w-px bg-primary-content opacity-90 rounded-full" aria-hidden="true"/>
              {{ sold > 100 ? '100+ sold' : sold + ' sold' }}
            </span>
          </div>
        </div>

        <div
          v-if="showStock && left < 1000"
          class="relative h-6 overflow-hidden rounded-md bg-error/5 px-2"
        >
          <transition-group name="dramatic-stock-slide" tag="div" class="w-full h-full">
            <span
              v-if="dramaticStockStep === 0"
              key="dramatic-1"
              class="flex items-center text-error font-bold animate-pulse absolute left-0 top-0 w-full h-full"
            >
              <svg class="w-4 h-4 mr-1 text-error" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Hurry! Only {{ left }} left in stock!
            </span>
            <span
              v-else
              key="dramatic-2"
              class="flex items-center text-warning font-bold animate-pulse absolute left-0 top-0 w-full h-full"
            >
              <svg class="w-4 h-4 mr-1 text-warning" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"/>
              </svg>
              Almost gone! Don't miss out!
            </span>
          </transition-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  idx: { type: Number, default: 0 },
  title: { type: String, default: 'Comfort Mesh Sneakers – White & Gray' },
  image: { type: String, default: '/images/product.png' },
  price: { type: String, default: '$49.99' },
  oldPrice: { type: String, default: '$69.99' },
  rating: { type: Number, default: 4.5 },
  sold: { type: Number, default: 120 },
  saveAmount: { type: String, default: '$20' },
  left: { type: Number, default: 5 },
  showStock: { type: Boolean, default: true }
})

// Truncate title if too long
const truncatedTitle = computed(() => {
  const maxLength = 18
  return props.title.length > maxLength
    ? props.title.slice(0, maxLength) + '...'
    : props.title
})

// Fix: Compute roundedRating locally instead of relying on parent
const roundedRating = computed(() => {
  return Math.round(props.rating * 2) / 2
})

// Fallback image logic
const useFallbackImage = (e) => {
  e.target.src = 'https://via.placeholder.com/300x300.png?text=No+Image'
}

// Dramatic stock message logic
const dramaticStockStep = ref(0)
let intervalId
onMounted(() => {
  intervalId = setInterval(() => {
    dramaticStockStep.value = 1 - dramaticStockStep.value
  }, 3500) // slower: 3.5s per change
})
onBeforeUnmount(() => {
  clearInterval(intervalId)
})
</script>

<style scoped>
/* Card polish */
.pc-card {
  border-radius: 0.9rem;
  will-change: transform;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, ring-color .2s ease;
}

.dramatic-stock-slide-enter-active,
.dramatic-stock-slide-leave-active {
  transition: transform 0.4s cubic-bezier(.25,.8,.25,1), opacity 0.4s cubic-bezier(.25,.8,.25,1);
  position: absolute;
  width: 100%;
}
.dramatic-stock-slide-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}
.dramatic-stock-slide-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
