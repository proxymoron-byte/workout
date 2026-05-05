# CLAUDE.md

Guidance for Claude Code working in this repo.

## Project

Workout — a health, nutrition, and fitness goal tracker. Static PWA, client-only (no backend). Vite + React 19 + TypeScript, deployed to GitHub Pages from `main` via `.github/workflows/` (publishes `dist/` to `gh-pages`).

## Working agreements

### Plan in the README before implementing

When we agree on a plan — for a feature, refactor, or any non-trivial change — **update `README.md` with the plan and its desiderata before writing code**. The README is the source of truth for intent; code follows.

- Add a section describing what's being built and the success criteria (desiderata) it must satisfy.
- Get the plan written down first; then implement against it.
- Keep the README current as the plan evolves. Stale plans are worse than no plans.

### Architectural reference: flashidioma

For decisions about state management, persistence, update flow, configuration, and deployment, mirror the patterns from https://github.com/levavakian/flashidioma:

- **Persistence**: client-side only. Prefer IndexedDB (e.g. via Dexie) for structured/large data; localStorage is fine for small settings. No server.
- **Backup/portability**: support full JSON export/import so users can move data between devices.
- **Configuration**: prefer per-entity (per-plan, per-goal) config over global flags where it gives users meaningful control.
- **Modularity**: keep domain data (exercises, food items, etc.) in modular definitions so categories can be added without touching core logic.
- **Deployment**: static build → GitHub Pages via Actions. PWA with `vite-plugin-pwa`, `registerType: 'autoUpdate'` so updates roll out on next load.
- **Build-time data**: if we ingest external datasets, fetch and bundle them at build time rather than at runtime.

When in doubt, look at how flashidioma solves the equivalent problem and adapt.

### UI testing is your job, not the user's

This is a UI-heavy project and the user will not run it for you before deployment. **Test in the local cloud environment** before reporting work as complete:

- Run `npm run dev` (or `npm run build && npm run preview`) in the background and exercise the feature.
- Verify the golden path *and* edge cases. Watch for regressions in existing features.
- Type-checks (`tsc -b`) and tests verify code correctness, not feature correctness — they are necessary, not sufficient.
- If you genuinely cannot test something in this environment, say so explicitly rather than claiming success.

## Stack & layout

- **Framework**: React 19, TypeScript ~5.9, Vite 7
- **PWA**: `vite-plugin-pwa` (autoUpdate, Workbox precache)
- **Base path**: `/workout/` (GitHub Pages project site) — keep this in mind for any routing or asset URLs
- `src/` — application code (entry: `src/main.tsx`, root: `src/App.tsx`)
- `public/` — static assets (favicon, PWA icons)
- `vite.config.ts` — build + PWA manifest
- `.github/workflows/` — deploy pipeline

## Commands

```bash
npm install
npm run dev       # local dev server
npm run build     # tsc -b && vite build
npm run preview   # serve built dist/
```

## Git

Develop on the branch assigned for the task. Commit with descriptive messages. Push with `git push -u origin <branch>`. Don't open PRs unless asked.
