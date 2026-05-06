# Workout

Health, nutrition, and fitness goal tracker. Static PWA built with Vite + React, deployed to GitHub Pages. Single-user, client-only — all data lives in the browser.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

Push to `main`. The `Deploy to GitHub Pages` workflow builds and publishes `dist/` to the `gh-pages` branch.

---

# v1 Plan: Health Dashboard

A personal health dashboard for tracking workouts, nutrition, body weight, cycle, steps, and health checkups. Single-user. Data stored locally in the browser. No accounts, no sync, no third-party integrations in v1.

The dashboard is the daily home: at a glance, the user sees today's workout, today's intake, and anything drifting off-target. Logging is fast — a few taps for the common cases, never more than one screen.

## Desiderata (success criteria)

The v1 is "done" when all of these hold:

1. **Dashboard is the daily home.** Opening the app shows today's workout, today's calories/protein/steps/cycle day, this week's training, cycle status, and checkup status — all without scrolling on a typical desktop. Empty states render cleanly on day one.
2. **Logging is fast.** Adding a nutrition entry, weight, period start, steps, or checkup completion takes ≤2 taps from the dashboard via the "Quick log" button or a clicked metric card.
3. **Workouts are the workhorse.** A user can pick today's routine, run a session via the session player (set check-offs, rest timer, notes), and end up with a saved session in history. Active-recovery and rowing-interval routines work without retrofitting the standard player.
4. **The seed content is usable on first launch.** 3 routines, 15+ exercises, 6 checkups are pre-loaded. Nothing requires manual setup before the app feels populated.
5. **Drift notifications work.** All 6 rules are implemented and toggleable in settings. The bar shows the highest-priority active rule and is dismissible for 24 h per rule.
6. **Data is portable.** Export produces a versioned JSON of everything. Import supports both Replace and Merge (with timestamp-based conflict resolution).
7. **Persistence is robust.** Refresh, navigate away, close the tab — nothing is lost. Schema is versioned so future migrations don't strand existing users.
8. **Tested in browser.** Every feature has been exercised end-to-end in the local dev environment, not just type-checked.
9. **PWA basics.** Installable, offline-capable, autoUpdate on next load.

## Scope

**In:** dashboard, nutrition logging, workout system (routines + exercises + session player + history + rule-based generator), body weight, manual cycle tracking, manual steps entry, checkup tracker, drift notifications, settings, data export/import.

**Out:** auth, multi-device sync, mobile-specific UI (responsive desktop is enough), Apple Health / Google Fit / Clue integrations, AI-generated workouts, photos, sleep, mood, supplements, medication reminders, lab-value tracking, social.

## Architecture

Following the [flashidioma](https://github.com/levavakian/flashidioma) reference:

- **Persistence:** IndexedDB via Dexie for entries (sessions, nutrition, weight, cycle, steps), localStorage for small settings (profile, goals, toggles).
- **Schema:** versioned. A `schemaVersion` field at the top of every export. Migrations run on import and on app start.
- **Modularity:** seed exercises, seed routines, and seed checkups live as standalone modules so categories can be added without touching core logic.
- **Configuration:** per-routine config (rest seconds, etc.) over global flags where it gives meaningful control.
- **Build-time data:** none in v1. All seed content ships in the bundle as TS/JSON modules.
- **Deployment:** static build → GitHub Pages, PWA via `vite-plugin-pwa` with `registerType: 'autoUpdate'`.

## Navigation

Persistent left sidebar:

- Dashboard (home)
- Workouts
- Nutrition
- Body (weight + cycle, two tabs)
- Checkups
- Settings

Top-right of every page: **Export** and **Quick log** buttons. Quick log opens a modal that picks the right entry form.

## Features

### Dashboard

Read-mostly home page.

- **Header.** Greeting with display name. Subline: today's date, current cycle day (if any), workouts this week count.
- **Four metric cards.** Calories (today / goal), Protein (g, today / goal), Steps (today / goal), Cycle day (number + phase). Each is clickable → opens its detail/log screen. Each shows a brief secondary line ("75% of goal", "ovulatory").
- **Today's workout card** (full width). Routine name, est. duration, exercise list with sets/reps. "Start session" button → session player. Rest day → friendly "Rest day — last session was Wednesday." If a session is in progress: "Resume session." Small dropdown to swap to another routine for today.
- **Bottom row (3 cards).**
  - *This week's training:* small bar chart of minutes per day, session count, avg duration.
  - *Cycle:* current phase, average cycle length, predicted next period.
  - *Checkups:* up to 4 checkups, status pill (Overdue / Due soon / Up to date / Schedule), sorted overdue first.
- **Drift notification bar.** Thin horizontal bar at the bottom showing one drift signal at a time with a "Quick log" button. Hidden if nothing is drifting.
- **Empty state.** Same layout, placeholder values, "Get started" panel suggesting first three actions: set goals, log a workout, log today's food.

### Nutrition

Lightweight food logging. Only kcal and protein tracked in v1 (no carbs/fat).

- **Nutrition page.** Date selector (defaults today), today's totals (kcal, protein, % of goal), today's entries list with delete, "Add entry" button, 7-day strip with goal lines.
- **Entry modal.** Free-text food name, kcal, protein (g), optional meal tag (breakfast/lunch/dinner/snack). Save.
- **Saved foods.** Autocomplete on food name from past entries; picking a suggestion pre-fills kcal and protein.
- No food database, barcode, or USDA lookup in v1.
- **Empty state:** prompt to set daily goals, link to settings.

### Workouts

The most substantial feature.

#### Routine library

A routine = name + ordered exercises + per-exercise sets/reps/rest.

**Seed routines (3):**

1. **Bands · home** — 5 ex × 3 sets × 12-15 reps, ~25 min: banded squats, banded rows, banded chest press, banded lateral raises, banded Pallof press.
2. **Bands + rowing · gym** — same 5 ex + rowing intervals at start (3 min warmup → 8× 1 min hard / 1 min easy → 2 min cooldown), ~45 min.
3. **Active recovery** — no exercise list; logs duration + activity label (skating, walking, mobility, etc.).

User can edit, duplicate, delete, or create from scratch.

**Routine page** lists routines as cards (name, duration, exercise count, last-performed date). Detail view → edit/duplicate/delete/start.

#### Exercise library

Reusable list. Each exercise: name, primary muscle group (legs/back/chest/shoulders/core/full body), default sets/reps/rest seconds, optional reference link (typically Fitbod), optional notes.

**Seed:** 5 core band exercises + 10–12 from Fitbod's top loop-band exercises (good morning, deadlift, glute kickback, face pull, hip thrust, side step, shoulder squeeze, tricep extension, bicep curl, etc.). Reference links open Fitbod in a new tab — no embedding, no copying.

#### Today's workout selection

Driven by a simple weekly schedule in settings (Mon–Sun → routine name / Rest / Active recovery). Editable. Dropdown on the dashboard card swaps for today.

#### Session player

The core daily-use screen.

- **Header:** routine name, live elapsed time, "End session."
- **Progress bar:** one segment per exercise.
- **Current exercise card:** name, "X of Y", instruction line ("Anchor band behind back · 3 sets × 12 reps"), "View form" link, set rows (checkbox + Set N + target reps), rest timer (counts down, "+15 s", "Skip rest →", auto-advance), single-line per-exercise notes.
- **Up next card:** small, next exercise + target.
- **Behavior:** mark sets in any order; skip exercises; end early. Rest timer is the same per routine in v1 (default 45 s for band work, configurable per routine). "End session" prompts: "Save partial session? You completed N of M exercises."
- **Active recovery:** stopwatch + activity dropdown + "Done." No exercise rows, no rest timer.
- **Rowing intervals:** one "exercise" with structured timer (3 min warmup → 8× 1 min hard / 1 min easy → 2 min cooldown), auto-advance, soft beep at transitions (audio toggle in settings).

#### History

Page of past sessions, most-recent-first. Row: date, routine, duration, exercises completed (e.g. "5/5"). Click → detail. Filter by routine and date range. Powers the dashboard's "this week's training" card.

#### Generator (rule-based, v1)

"Generate" button on the routine library page. Form: goal (full body / upper / lower / core), duration (20/30/45 min), equipment (bands / bands+rowing / bodyweight+bands). Composes a routine using simple rules: pick from library by muscle group, balance push/pull, fit duration via defaults. Result is shown for review (swap any exercise) before saving with a name. **Not LLM-powered in v1.**

### Body — Weight

Light tracking, 3 entries/week target.

- Current 3-entry rolling average shown prominently.
- 90-day trend chart with rolling average overlay.
- "Log weight" modal: weight + date (defaults today).
- Recent entries list with edit/delete.
- "You've logged 2 of 3 this week" cadence note (cadence configurable in settings).
- Optional weight goal in settings → horizontal line on chart.
- **Empty state:** prompt for first weight; trend chart appears at ≥5 entries.

### Body — Cycle

Minimal. The user keeps Clue as primary; this just gives today's context + next-period prediction.

- Current cycle day + phase (menstrual / follicular / ovulatory / luteal).
- Average cycle length (computed from logged history; default 28 if <2 entries).
- Predicted next period (last start + average length).
- Phase strip with today's position marked.
- "Log period start" modal (single date).
- List of past starts with edit/delete.
- **Phase model:** menstrual 1–5, follicular 6–13, ovulatory 14–16, luteal 17 → next start.
- **Bulk import:** one-time "Import from Clue" — paste CSV, parse period start dates. Only import surface in v1 outside of full JSON import.
- **Empty state:** prompt for last period start; full view activates after one entry.

### Steps

Manual, daily.

- Dashboard card: today vs goal.
- Detail view: today vs goal, "Log steps" modal (steps + date), 7-day bar chart with goal line, 30-day average.
- No reminders; no entry → "—" + "Log" CTA.

### Checkups

Reference table of preventive screenings.

- Each row: name, recommended interval, last completed, next due (computed), status pill (Up to date ≥30 d / Due soon ≤30 d / Overdue / Schedule), actions ("Mark as done today", "Edit").
- "+ Add checkup" modal: name, interval (months), optional notes.
- **Seed (6):** Annual bloodwork (12 mo), Dental cleaning (6 mo), Eye exam (24 mo), Skin/dermatology (12 mo), Cervical screening (36 mo), General GP (12 mo). Editable.
- **Disclaimer:** small once-shown line — defaults are starting points; verify with a healthcare provider.
- Dashboard surfacing: up to 4, sorted overdue → due soon → next due.

### Drift notifications

Rules engine, evaluated on dashboard load. Highest-priority active rule wins. Bar above footer; dismiss for 24 h per rule.

| Pri | Rule | Trigger | Action |
|---|---|---|---|
| 1 | Overdue checkup | Any checkup overdue ≥30 d | Open checkups |
| 2 | Missed workouts | <2 sessions/last 7 d, weekly goal ≥3 | Start today's workout |
| 3 | Protein low | 7-day avg protein <85% goal | Open nutrition entry |
| 4 | Calories high | 7-day avg kcal >115% goal | Open nutrition |
| 5 | Weight trend | 14-day rolling avg moved opposite to goal direction by ≥1.5% | Open body |
| 6 | Long gap | No logging in 3+ days | Open quick log |

(Plus a 30-day no-export reminder, treated as a rule.)

Each rule toggleable in settings. Default: all on except #5.

### Settings

- **Profile.** Display name.
- **Goals.** Daily kcal, daily protein (g), daily steps, weekly workout count, optional weight goal.
- **Weekly schedule.** 7-row table Mon–Sun → routine name / Rest / Active recovery. Drives dashboard default.
- **Routines / Exercises / Checkups.** Links to those pages.
- **Drift notifications.** Toggle each rule.
- **Data.** Export all (JSON), Import from JSON (Replace or Merge), Clear all (two-step confirm).
- **Audio.** Session-player beep toggle.

### Export / Import

Critical because everything is local.

- **Export.** Button on dashboard header and in settings. Single JSON: settings + routines + exercises + sessions + nutrition + weight + cycle + steps + checkups + `schemaVersion`. Filename `health-dashboard-export-YYYY-MM-DD.json`. Drift rule fires if no export in 30 days.
- **Import.** Settings only. **Replace** wipes and loads. **Merge** combines, preferring newer of conflicts by timestamp. Schema versioning supports migrations.

## Out of scope (v1) — listed so they don't get rebuilt accidentally

Auth, multi-user, online DB / sync, Health Connect / Apple Health / Google Fit / Clue API, native mobile (PWA only), AI-generated workouts, photos, sleep, mood, supplements/meds, lab-value detail, social, push reminders.

## Open questions to resolve before implementation

1. **Time zone handling.** All dates = local-device date. Travelers' "today" follows device clock. OK for v1?
2. **Units.** Metric throughout (kg, g, kcal). Confirm.
3. **First day of week.** Monday. Confirm.
4. **Visual identity.** Calm, multi-color palette inspired by Intelly reference. Concrete palette/typography to be agreed before UI work.
5. **Browser support.** Latest Chrome/Safari/Firefox only.

## Implementation order (proposed)

A vertical-slice approach so we have a working app at every step:

1. **Foundations.** Dexie schema + storage layer, settings (profile, goals, weekly schedule), versioned export/import, sidebar shell, routing.
2. **Workouts core.** Exercise library (seed + CRUD), routine library (seed + CRUD), routine detail.
3. **Session player.** Standard player, history, then active-recovery and rowing-interval variants.
4. **Nutrition.** Page, entry modal, autocomplete, 7-day strip.
5. **Body.** Weight tab (chart + log), cycle tab (phase model + log + Clue CSV import).
6. **Steps + Checkups.** Manual steps entry; checkup table with status pills + seed list.
7. **Dashboard.** Compose all the above into the home view, including empty states.
8. **Drift engine.** All 6 rules + 30-day-export reminder, snooze, settings toggles.
9. **Generator.** Rule-based routine generator.
10. **PWA polish.** Manifest, icons, offline shell, autoUpdate verification.

Each step ends with browser testing before moving on.
