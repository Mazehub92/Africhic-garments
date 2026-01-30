import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false
      }
    },
    sourcemap: false,
    rollupOptions: {
      input: {
        main: './index.html',
        shop: './shop.html',
        cart: './cart.html',
        checkout: './checkout.html',
        login: './login.html',
        orders: './orders.html',
        profile: './profile.html',
        admin: './admin.html',
        success: './success.html'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage', 'firebase/analytics']
  }
})
