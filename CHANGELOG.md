# Changelog

## 0.2.0 - 2025-09-11

- Secure Express proxy with Helmet, rate limiting, validation & health endpoint
- Serverless functions for Vercel and Netlify deployment
- Dual-layer caching (in-memory + persistent localStorage) for semantic descriptions
- Added unit tests (Vitest) & integrated into CI
- Electron packaging verified (NSIS & portable)
- Improved README (Quick Launch envs, deployment docs, caching, proxy, health)
- Network error banner & improved error handling
- Android build toolchain upgraded (Gradle wrapper 8.7, AGP 8.5.2)
- Playwright E2E test updated for new instant start flow

## 0.1.0 - 2025-08-30

- First release
- Web app build (Vite)
- Windows desktop packaging (Electron): installer and portable exe in `release/`
- Android packaging (Capacitor): Android project under `android/` and debug/release build support
