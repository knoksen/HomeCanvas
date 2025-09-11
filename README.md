# Home Canvas

[![CI](https://github.com/knoksen/HomeCanvas/actions/workflows/ci.yml/badge.svg)](https://github.com/knoksen/HomeCanvas/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/knoksen/HomeCanvas)](https://github.com/knoksen/HomeCanvas/releases)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
![Platforms](https://img.shields.io/badge/platforms-Web%20%7C%20Windows%20%7C%20Android-success)
![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)

Drag & drop photorealistic AI product staging across **Web**, **Windows Desktop (Electron)** & **Android (Capacitor)**.

Release: <https://github.com/knoksen/HomeCanvas/releases>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Install & Run (Web Dev)](#install--run-web-dev)
- [Quick Launch (Free Online)](#quick-launch-free-online)
- [Desktop (Electron)](#desktop-electron)
- [Android (Capacitor)](#android-capacitor)
- [Scripts Reference](#scripts-reference)
- [Testing (Playwright)](#testing-playwright)
- [Unit Tests](#unit-tests)
- [Coverage](#coverage)
- [Release Workflow](#release-workflow)
- [Security Considerations](#security-considerations)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Roadmap (Ideas)](#roadmap-ideas)
- [License](#license)


## Overview

Home Canvas lets you upload (or pick sample) room scenes and product images, then place products with precise spatial control. A multi‑step Gemini pipeline:

1. Resizes & pads images for model stability
2. Marks the intended placement point
3. Generates a dense semantic location description
4. Produces a composite image with realistic lighting, scale & perspective

The project now ships in three forms:

| Target | Stack | Output |
| ------ | ----- | ------ |
| Web | Vite + React 19 | SPA (dist/) & Vercel deploy |
| Desktop | Electron | Windows installer + portable .exe (release/) |
| Android | Capacitor + WebView | APK / AAB (android/) |

> NOTE: The current implementation calls Gemini directly from the client. For production you should proxy or move sensitive logic server‑side.

## Features

- Drag/drop or tap placement with visual drop orb
- Touch support & custom drag ghost
- Multi‑stage loading messages & debug modal (shows marked image + final prompt)
- Electron desktop packaging (one‑click installer & portable)
- Android Capacitor wrapper (debug & release builds)
- Playwright E2E test for core flow & error handling

## Tech Stack

- React 19 / TypeScript / Vite
- Tailwind (via CDN) for styling
- Gemini ( @google/genai ) multimodal API
- Electron (Windows desktop)
- Capacitor (Android)
- Playwright (E2E tests)

## Prerequisites

| Purpose | Requirement |
| ------- | ----------- |
| Web + Desktop | Node.js (LTS 18+ or 20+/22) |
| Desktop build | Windows 10+, optional code-sign cert |
| Android | JDK 17, Android Studio (SDK + Build Tools) |

## Environment Variables

Create `.env.local` (dev) & `.env.production` (prod builds):

```env
GEMINI_API_KEY=your_key_here
```

The Vite config injects `process.env.GEMINI_API_KEY` / `process.env.API_KEY` at build time. Missing key triggers a clear runtime error.

## Install & Run (Web Dev)

```powershell
npm install
Copy-Item .env.local.example .env.local -ErrorAction SilentlyContinue
notepad .env.local  # add GEMINI_API_KEY
npm run dev
```

Visit: <http://localhost:5173>

## Quick Launch (Free Online)

Spin up a disposable dev environment in the browser. Add your `GEMINI_API_KEY` (placeholder is fine for UI tests; real key needed for generation) by creating a `.env.local` file after launch.

| Service | Launch | Notes |
| ------- | ------ | ----- |
| GitHub Codespaces | [Open](https://codespaces.new/knoksen/HomeCanvas) | Free monthly hours on eligible plans; auto-detects Node project |
| Gitpod | [![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/knoksen/HomeCanvas) | Starts workspace; run `npm install && npm run dev` |
| StackBlitz | [Open](https://stackblitz.com/fork/github/knoksen/HomeCanvas) | Fast web container; may need manual `npm install` |
| CodeSandbox | [Open](https://codesandbox.io/p/github/knoksen/HomeCanvas) | Auto dependency detection; add `.env.local` manually |
| VS Code Remote (local) | `git clone` then `code HomeCanvas` | Use built-in terminal; create `.env.local` |

> Tip: In any cloud IDE add a `.env.local` with `GEMINI_API_KEY=your_key` before running `npm run dev`. Without a key UI loads but generation calls fail gracefully.

## Desktop (Electron)

Dev (auto‑reload renderer):

```powershell
npm run dev:app
```

Package Windows installer & portable exe:

```powershell
npm run build:app
# Artifacts: release/ ("Home Canvas Setup <ver>.exe" & portable exe)
```

## Android (Capacitor)

Scaffold (already done) & sync after changes:

```powershell
npm run cap:sync
```

Add Android platform (already created, repeat only if removed):

```powershell
npm run cap:android
```

Open in Android Studio:

```powershell
npm run android:open
```

Build debug APK (Gradle):

```powershell
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

Release APK:

```powershell
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```
Provide a signing keystore for distribution (Android Studio wizard or Gradle config).

## Scripts Reference

| Script | Purpose |
| ------ | ------- |
| `dev` | Vite dev server |
| `dev:app` | Vite + Electron development |
| `build` | Web production build (Vite) |
| `build:renderer` | Explicit renderer build only |
| `build:app` | Renderer + Electron packaging (Windows) |
| `cap:sync` | Build web + sync Capacitor platforms |
| `cap:android` | Add & sync Android platform |
| `android:open` | Open Android Studio |
| `test:e2e` | Playwright E2E tests |
| `typecheck` | TypeScript diagnostics |

## Testing (Playwright)

Run all E2E tests:

```powershell
npx playwright install
npm run test:e2e
```

The provided spec aborts Gemini calls to confirm graceful error handling path.

## Unit Tests

Lightweight Vitest suite covers utility caching logic (`SimpleCache`, `PersistentCache`).

Run:

```powershell
npm run test:unit
```

## Coverage

Vitest coverage (v8) is enabled. After running unit tests a `coverage/` directory is generated containing `lcov.info`, `json-summary`, and HTML report.

Generate locally:

```powershell
npm run test:unit
```

Open `coverage/lcov-report/index.html` for a visual report. CI uploads the folder as an artifact.

## Release Workflow

1. Update `package.json` version & `CHANGELOG.md`
2. Commit & tag (e.g. `v0.1.0`)
3. Build artifacts:
    - `npm run build:app` (Windows exe/installer)
    - `cd android && ./gradlew assembleRelease`
4. Draft GitHub Release attaching:
    - Installer & portable exe from `release/`
    - `app-release.apk`
5. (Optional) Add CI to automate above on tag push

## Security Considerations

- Don’t ship a production GEMINI_API_KEY in public binaries; move model calls server‑side or behind a secure proxy.
- Consider adding rate limiting & request provenance checks.
- For Electron, sensitive logic can move to main process + IPC.
- Proxy now includes: Helmet security headers, basic rate limiting (60 req/min), payload size checks, simple schema validation, optional bearer auth (`PROXY_ACCESS_TOKEN`) and structured JSON logging.

### Using the Local Proxy (Hide API Key)

To avoid exposing your Gemini key in the browser:

1. Add to `.env.local` (front-end flag):

```env
VITE_USE_PROXY=true
```

1. Export your key for the proxy (or put in a separate `.env` the proxy will read):

```powershell
$env:GEMINI_API_KEY="your_key"
```

1. Run both dev servers:

```powershell
npm run dev:full
```

1. The front-end will call `/api/gemini/*` endpoints (served by `server/proxy.ts`).


If a key is present in the browser environment and `VITE_USE_PROXY` is not set, the app falls back to direct SDK calls.

### Enabling Proxy Bearer Auth

Protect the proxy with a shared bearer token:

1. Set in environment (e.g. `.env` for server):

```env
PROXY_ACCESS_TOKEN=change-me
```

1. Start proxy (`npm run dev:server` or `npm run dev:full`).
1. Ensure client requests add header:

```http
Authorization: Bearer change-me
```

Missing or invalid token yields `401/403` responses. Rotate the token via deployment secrets.

### Caching

The semantic location description is cached in-memory (LRU) and persisted (12h TTL) via `localStorage` to avoid repeating identical analysis for the same scene + drop point. Disable by removing usage in `services/geminiService.ts`.

### Health Check

Local proxy exposes `GET /api/health` returning `{ status, version, time }` for monitoring / readiness probes.

## Deployment

Static front-end can be deployed to any static host (Vercel/Netlify). For a secure production setup, deploy the proxy (or a more robust backend) alongside it and enable `VITE_USE_PROXY`.

| Platform | Button | Notes |
| -------- | ------ | ----- |
| Vercel | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/knoksen/HomeCanvas) | Add `GEMINI_API_KEY` & optionally `VITE_USE_PROXY` (requires serverless proxy adaptation) |
| Netlify | [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/knoksen/HomeCanvas) | For proxy, create a Netlify Function mapping `/api/gemini/*` |
| Render | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy) | Create a web service for proxy + static site |

> Production Tip: Move heavy logic & secrets server-side; implement auth (tokens) + rate limiting.

### Vercel Serverless Proxy

1. Keep `api/gemini.ts` serverless function (added) — automatically mapped to `/api/gemini`.
2. Front-end calls `/api/gemini/<model>` when `VITE_USE_PROXY=true`.
3. Set `GEMINI_API_KEY` in Vercel project Environment Variables.

### Netlify Function (Example Skeleton)

Included: `netlify/functions/gemini.ts` and `netlify.toml` redirect mapping `/api/gemini/:model` → lambda. Deploy with `GEMINI_API_KEY` and set `VITE_USE_PROXY=true` for front-end.

### Render Deployment

Provision:

```text
Static site: build: npm run build  (publish dist)
Proxy service: node server/proxy.js (or ts-node) with GEMINI_API_KEY
Front-end: set VITE_USE_PROXY=true
```

#### Render Blueprint (Infrastructure as Code)

The repository includes `render.yaml` which defines two services:

- `home-canvas-web` (static) – builds with `npm ci && npm run build`, serves `dist/` and sets cache headers.
- `home-canvas-proxy` (Node) – builds the Express proxy (`npm run build:server`) and runs it.

Environment variables set in the blueprint:

| Variable | Service | Purpose |
| -------- | ------- | ------- |
| VITE_USE_PROXY | web | Forces client to call proxy |
| VITE_PROXY_BASE_URL | web | Base URL of deployed proxy |
| GEMINI_API_KEY | proxy | Secret Gemini API key |
| PROXY_ACCESS_TOKEN | proxy (optional) | Bearer auth requirement |

Deploy via Render Blueprint (dashboard > New + Blueprint) pointing at repo root. Override secrets in the UI for `GEMINI_API_KEY` and optional `PROXY_ACCESS_TOKEN`.

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| Missing GEMINI_API_KEY error | Set key in `.env.local` then restart dev server |
| Port 5173 in use | Vite auto-picks next port; follow console URL |
| Electron preview shows blank | Ensure `base: './'` (already set) & assets built |
| Android build: SDK location not found | Install Android Studio; set `sdk.dir` in `android/local.properties` |
| Java not found | Install JDK 17 & set `JAVA_HOME` |
| Large installer warning (SmartScreen) | Code sign in future; otherwise “Run anyway” |

### Android Build Deep-Dive

If you see an early Gradle failure (before dependency download) with an `IOException` about filename syntax:

1. Verify `android/local.properties` points to an existing SDK path (Windows default: `C:\Users\\<user>\\AppData\\Local\\Android\\Sdk`).
2. Ensure required components installed (API 34 Platform + Build-Tools 34.x) in SDK Manager.
3. Clear Gradle caches (optional): delete `%USERPROFILE%\.gradle\caches`.
4. Re-run with diagnostics:

 
```powershell
cd android
./gradlew assembleDebug --stacktrace --info --scan
```

1. If flatDir repository warnings persist, prefer real maven repos; local jars should be moved to `app/libs`.
1. Spaces or special characters in path segments can also trigger path syntax issues; avoid non-ASCII in project path.

> AGP Version: Updated to 8.5.2 (ensure Android Gradle Plugin and wrapper versions are compatible; wrapper currently 8.7). If build errors mention plugin version, clear `~/.gradle/caches` and sync again.

Captured metadata logging has been added to `build.gradle` to print repository roots during configuration.

## Roadmap (Ideas)

- Backend proxy for secure model access
- Improved object segmentation / masking
- Batch placements & undo stack
- Multi-language UI & accessibility enhancements
- Offline caching of generated composites

## License

Licensed under the Apache License, Version 2.0. See `LICENSE` for full text. Source files include `SPDX-License-Identifier: Apache-2.0` headers where applicable.

---
Made with a focus on clarity & extensibility. PRs & suggestions welcome.

_Enjoy creating photorealistic compositions!_
