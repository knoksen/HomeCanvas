# Home Canvas

[![Release](https://img.shields.io/github/v/release/knoksen/HomeCanvas)](https://github.com/knoksen/HomeCanvas/releases)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
![Platforms](https://img.shields.io/badge/platforms-Web%20%7C%20Windows%20%7C%20Android-success)

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
- [Desktop (Electron)](#desktop-electron)
- [Android (Capacitor)](#android-capacitor)
- [Scripts Reference](#scripts-reference)
- [Testing (Playwright)](#testing-playwright)
- [Release Workflow](#release-workflow)
- [Security Considerations](#security-considerations)
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

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| Missing GEMINI_API_KEY error | Set key in `.env.local` then restart dev server |
| Port 5173 in use | Vite auto-picks next port; follow console URL |
| Electron preview shows blank | Ensure `base: './'` (already set) & assets built |
| Android build: SDK location not found | Install Android Studio; set `sdk.dir` in `android/local.properties` |
| Java not found | Install JDK 17 & set `JAVA_HOME` |
| Large installer warning (SmartScreen) | Code sign in future; otherwise “Run anyway” |

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
