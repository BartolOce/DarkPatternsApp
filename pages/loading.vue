// file: pages/loading.vue
<template>
  <div class="h-screen w-screen flex items-center justify-center bg-base-200">
    <!-- Fade transition handles spinner in/out -->
    <transition name="fade" mode="out-in">
      <div v-if="showSpinner" class="flex items-center justify-center w-full h-full">
        <span class="loading loading-dots loading-xl" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
/* Key flow: mount → fade-in spinner → wait → fade-out → redirect */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showSpinner = ref(false)

onMounted(() => {
  setTimeout(() => {
    showSpinner.value = true // fade-in
    setTimeout(() => {
      showSpinner.value = false // fade-out
      setTimeout(() => {
        router.replace('/home') // then redirect
      }, 600) // match CSS fade duration
    }, 3000) // visible duration
  }, 20) // minimal delay for transition trigger
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.6s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
