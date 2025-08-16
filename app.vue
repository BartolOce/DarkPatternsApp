// file: app.vue
<template>
  <!-- Minimal, SSR-stable shell: no DOM reads/writes here -->
  <NuxtLoadingIndicator /> <!-- built-in top progress bar -->
  <NuxtLayout>             <!-- implicit default layout (even if you didn't create one) -->
    <NuxtPage />           <!-- renders current route component -->
  </NuxtLayout>
</template>

<script setup lang="ts">
// Keep head tags in nuxt.config.ts (app.head) to ensure identical SSR/CSR markup.
// This avoids head-related hydration diffs and reduces FOUC risk.
</script>

<style>
/* Global font family (matches the loaded Google Font in nuxt.config.ts) */
html, body, button, input, select, textarea {
  font-family: 'Quicksand', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
}

/* Make regular text semibold; avoid overriding headings */
body, p, span, li, a, button, input, select, textarea, label,
.chat-bubble, .card-body, .steps .step, .modal-box {
  font-weight: 600;
}
</style>
