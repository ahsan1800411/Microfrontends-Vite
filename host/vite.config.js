import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
  federation({
    name: 'app',
    remotes: {
      remote_app: 'http://localhost:5001/assets/remoteEntry.js'
    },
    shared: ['react', 'react-dom'],
  })
  ],
  build: {
    cssCodeSplit: false,
    minify: false,
    target: 'esnext',
    modulePreload: false
  }
})
