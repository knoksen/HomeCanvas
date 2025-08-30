/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'url';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // FIX: In ES modules, __dirname is not available. Using import.meta.url is the modern replacement.
          '@': fileURLToPath(new URL('.', import.meta.url)),
        }
      }
    };
});