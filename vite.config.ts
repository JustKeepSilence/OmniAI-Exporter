import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';

export default defineConfig({
  plugins: [
    crx({ manifest }),
    {
      name: 'strip-cdn-plugin',
      enforce: 'post', 
      renderChunk(code) {
        if (code.includes('cdnjs.cloudflare.com')) {
          const cleanCode = code.replace(
            /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/pdfobject\/[\d\.]+\/pdfobject\.min\.js/gi,
            '' 
          );
          return { code: cleanCode, map: null };
        }
        return null;
      }
    }
  ],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});