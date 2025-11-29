import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Correctly map '@' to the current directory
      '@': path.resolve(__dirname, './'),
    },
  },
  define: {
    'process.env': process.env
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'recharts', 'lucide-react'],
          ai: ['@google/genai']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});