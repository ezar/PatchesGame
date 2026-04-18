# Patches — A Grid Puzzle

A Shikaku-style grid puzzle game built with Vanilla TypeScript + Vite. Installable as a PWA.

🎮 **[Play it live](https://precious-platypus-837e9b.netlify.app)**

> Patches is an independent puzzle game inspired by LinkedIn Games · Not affiliated with LinkedIn or Microsoft.

---

## How to play

1. The grid must be filled completely with non-overlapping rectangles.
2. Each rectangle contains exactly **one numbered seed tile**.
3. The number on the seed tells you how many cells the rectangle must cover.
4. Seeds also show a shape hint — square, tall, wide, or any.

Drag from any cell to draw a rectangle. The seed just needs to be somewhere inside it. Tap a painted region to erase it.

---

## Tech stack

- **Vanilla TypeScript** — no frameworks
- **Vite** — dev server and bundler
- **vite-plugin-pwa** — PWA manifest + Workbox service worker
- **canvas-confetti** — victory animation
- **Web Audio API** — victory sound (no audio files)

---

## Development

```bash
npm install
npm run dev       # dev server at localhost:5173
npm run build     # production build → dist/
npm run preview   # preview the production build
```

---

## Project structure

```
src/
  data/puzzles.ts   # handcrafted puzzle definitions
  types.ts          # Puzzle, Seed, ShapeType
  state.ts          # singleton game state
  engine.ts         # game logic (drag, commit, undo, hint, win)
  render.ts         # DOM rendering (board, overlay, center numbers)
  ui.ts             # mouse/touch event wiring
  generator.ts      # random puzzle generator
  puzzle-store.ts   # merges handcrafted + generated puzzles
  colors.ts         # color palette
  storage.ts        # localStorage (last played level)
  style.css
  main.ts
public/
  icons/            # SVG + PNG app icons
index.html
help.html           # how-to-play page
netlify.toml        # Netlify build config
vite.config.ts
```

---

## Deploy

The project auto-deploys to Netlify on every push to `master`.

Build command: `npm run build`  
Publish directory: `dist`
