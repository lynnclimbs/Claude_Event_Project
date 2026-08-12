# Claude Event Project

Hackathon project — a visual product built with Vite + React + TypeScript + Tailwind CSS v4.

## Getting started

```bash
npm install
npm run dev
```

The dev server prints a local URL (default http://localhost:5173) with hot reload.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

## Project layout

```
src/
  main.tsx     # App entry — mounts React, imports index.css
  App.tsx      # Root component, start building here
  index.css    # Tailwind entry (@import 'tailwindcss')
index.html     # Vite HTML entry
```

## Styling

Tailwind v4 is wired in through the `@tailwindcss/vite` plugin in `vite.config.ts`.
There is no `tailwind.config.js` — v4 is configured in CSS. To add design tokens,
use a `@theme` block in `src/index.css`:

```css
@import 'tailwindcss';

@theme {
  --color-brand: oklch(0.62 0.19 265);
}
```

## Environment variables

Copy `.env.example` to `.env` for local config. Only `VITE_`-prefixed variables
reach the browser — and anything that reaches the browser is **public**, so keep
API keys out of them and call third-party APIs from a server or proxy instead.

## Team

Clone and run:

```bash
git clone https://github.com/Handschug/Claude_Event_Project.git
cd Claude_Event_Project
npm install && npm run dev
```
