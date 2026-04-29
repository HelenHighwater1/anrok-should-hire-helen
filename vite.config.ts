import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['react-simple-maps', 'prop-types'],
  },
  server: {
    // Polling is slightly higher CPU but fixes flaky native file watchers
    // (HMR not firing after saves on some macOS / iCloud / network drive setups).
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
})
