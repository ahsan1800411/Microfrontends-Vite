import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'remote_app',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/Button',
        './store': './src/store'
      },
      shared: ['react', 'react-dom', 'jotai'],
    }),
  ],
  build: {
    cssCodeSplit: false,
    minify: false,
    target: 'esnext',
    modulePreload: false
  }
});
