// file: nuxt.config.ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true }, // enable in dev

  css: ['~/assets/css/main.css'],

  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxtjs/tailwindcss',
  ],

  tailwindcss: {
    configPath: 'tailwind.config.js',
  },

  app: {
    head: {
      title: 'Dark Patterns App',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        // Preload + stylesheet to reduce FOUC
        { rel: 'preload', as: 'style', href: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap' },
      ],
    },
  },

  // ✅ Static deploy on Vercel: we’ll run `npm run generate`
  // Ensure all key routes are prerendered (crawler might miss client-only navigations)
  nitro: {
    prerender: {
      routes: ['/', '/loading', '/home'],
    },
  },

  routeRules: {
    // Pages are prerendered to static HTML
    '/': { prerender: true },
    '/loading': { prerender: true },
    '/home': { prerender: true },

    // If any page must be client-only (avoids SSR hydration), you can keep ssr:false:
    // '/': { ssr: false, prerender: true },
  },
})
