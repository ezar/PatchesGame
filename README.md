# 🟧 Patches — A Grid Puzzle

[![Live demo](https://img.shields.io/badge/Play%20now-netlify-00C7B7?logo=netlify&logoColor=white)](https://precious-platypus-837e9b.netlify.app)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?logo=vite&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Fill the grid by dragging rectangles. A Shikaku-inspired puzzle game — playable in any browser and installable as a native app.

> **Disclaimer:** Patches is an independent puzzle game inspired by LinkedIn Games. Not affiliated with LinkedIn or Microsoft.

---

## ✨ Features

- **Drag to draw** — drag from any two points to define a rectangle; the seed just needs to be somewhere inside
- **Smooth overlay** — single positioned div during drag, zero per-cell DOM updates
- **Tap to erase** — tap a painted region to clear it
- **Shape hints** — seeds show square / tall / wide / any constraint
- **Auto-check** — puzzle validates automatically after every move
- **Victory** — confetti + synthesized arpeggio on win (no audio files)
- **Undo & Hint** — up to 50 undo steps; hint reveals one correct cell
- **Progress saved** — localStorage saves your progress per level
- **PWA** — installable on iOS (Safari), Android, Windows (Edge/Chrome)

---

## 🕹️ How to play

1. The grid must be filled completely with **non-overlapping rectangles**
2. Each rectangle must contain exactly **one seed tile**
3. The number on the seed is the **required area** of its rectangle
4. The shape icon hints at the rectangle's form: square, tall, wide, or free

---

## 🛠️ Tech stack

| | |
|---|---|
| Language | Vanilla TypeScript (no framework) |
| Bundler | Vite 5 |
| PWA | vite-plugin-pwa + Workbox |
| Animation | canvas-confetti |
| Audio | Web Audio API (synthesized, no files) |
| Deploy | Netlify (auto-deploy on push) |

---

## 🚀 Getting started

```bash
npm install
npm run dev       # dev server → http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build locally
```

---

## 📁 Project structure

```
src/
├── data/
│   └── puzzles.ts       # handcrafted puzzle definitions
├── types.ts             # Puzzle, Seed, ShapeType
├── state.ts             # singleton game state
├── engine.ts            # core logic: drag, commit, undo, hint, win
├── render.ts            # DOM: board, drag overlay, center numbers
├── ui.ts                # mouse & touch event wiring
├── generator.ts         # procedural puzzle generator
├── puzzle-store.ts      # merges handcrafted + generated puzzles
├── colors.ts            # colour palette
├── storage.ts           # localStorage helpers
├── style.css
└── main.ts
public/
└── icons/               # SVG + PNG app icons
index.html               # game shell
help.html                # how-to-play page
netlify.toml             # build config
vite.config.ts
```

---

## 🏗️ Architecture notes

**Drag mechanic** — `dragOrigin` + cursor define the bounding rectangle. The seed just needs to fall inside; it doesn't anchor a corner. On mouseup, `commitDrag()` consumes the `pendingRect` and paints it.

**Overlay rendering** — during drag, a single absolutely-positioned `<div>` moves over the board using `%` coordinates. No cells are touched until commit — keeps drag perfectly smooth.

**Validation** — `validateSolution()` is silent (returns `null` or an error string). It runs after every commit. If it returns `null`, the win overlay appears.

---

## 📄 License

MIT © César Ramos
