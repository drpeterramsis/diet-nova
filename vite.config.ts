// vite.config.ts (أو .js)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // ⬅️ استيراد الحزمة الجديدة

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // ⬅️ إضافة المكون الإضافي هنا
  ],
})