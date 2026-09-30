import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { GOATCOUNTER_CODE } from './src/config.js'

// GitHub Pages can't send security headers, so the Content Security Policy goes in a
// meta tag. Only in the build: the dev server injects inline scripts for hot reload.
// blob:/data: cover the saved image and html-to-image's embedded fonts; the
// GoatCounter hosts are the visitor counter.
const goatcounter = GOATCOUNTER_CODE ? `https://${GOATCOUNTER_CODE}.goatcounter.com` : ''
const CSP = [
  "default-src 'self'",
  `script-src 'self'${GOATCOUNTER_CODE ? ' https://gc.zgo.at' : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${goatcounter}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' data: blob: ${goatcounter}`.trim(),
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

const contentSecurityPolicy = () => ({
  name: 'content-security-policy',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace(
      '<meta charset="UTF-8" />',
      `$&\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`
    ),
})

// https://vitejs.dev/config/
export default defineConfig({
  // Relative asset paths so the build works at any GitHub Pages URL
  // (https://<user>.github.io/<repo>/) without hardcoding the repo name.
  base: './',
  plugins: [react(), tailwindcss(), contentSecurityPolicy()],
})
