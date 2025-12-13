import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest-and-icons',
      closeBundle() {
        // Create dist/icons directory
        if (!existsSync('dist/icons')) {
          mkdirSync('dist/icons', { recursive: true });
        }
        
        // Copy manifest
        copyFileSync('manifest.json', 'dist/manifest.json');
        
        // Copy PNG icons
        ['icon16.png', 'icon48.png', 'icon128.png'].forEach(icon => {
          copyFileSync(`icons/${icon}`, `dist/icons/${icon}`);
        });
        
        console.log('✓ Copied manifest and icons to dist/');
      }
    }
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
});
