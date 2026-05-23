# Health Tracker

A personal fitness, nutrition, and recovery tracker. Offline-first PWA, installable on phone or desktop, all data lives locally in your browser — nothing leaves your device.

![Health Tracker](public/icons/icon-192.png)

## Features

- **Training** — Upper/Lower 4-day split seeded by default. Create, edit, and delete routines. Inline exercise editor (sets / reps / RIR / cues). Pick from 36 built-in exercises or add your own.
- **Active workout** — Live timer, per-set weight/reps logging, tap-to-mark-done, add sets on the fly. Optional heart rate and calories on finish.
- **Workout history** — Full log with HR and calorie info, click any entry for a detailed view. Manual entry for past workouts.
- **Nutrition** — Daily macro targets (kcal / protein / carbs / fat) with progress bars. Meal log with time-stamped entries. Save and quick-log recipes.
- **Body progress** — Weight history with sparkline chart, 7-day average, change since first entry. Body measurements (chest, waist, hips, bicep, thigh, calf) with deltas. Auto-computed estimated 1RM PRs from your workout log.
- **Recovery** — Daily check-in for sleep / energy / soreness. 7-day log with composite score.
- **Streak + weekly goal** — Configurable target sessions/week, current streak counter.

## Tech stack

- **Vanilla JS ES6 modules** — no build step, no `node_modules`, no transpiler.
- **Object-oriented design** — domain models, repositories, services, and UI pages cleanly separated. See [Architecture](#architecture).
- **Browser localStorage** — single namespace (`ht_*`), with export/import hooks already in place.
- **PWA** — installable, offline-capable, includes manifest + service worker.

## Running locally

This is a static site. You need a local HTTP server because ES modules can't load from `file://`.

### Option 1 — Python
```bash
cd health-tracker
python3 -m http.server 8000
```
Open <http://localhost:8000>.

### Option 2 — Node
```bash
npx serve .
```

### Option 3 — VS Code
Install the "Live Server" extension, right-click `index.html` → "Open with Live Server".

## Installing as an app

### iPhone / iPad
1. Open the site in Safari.
2. Tap the share button → **Add to Home Screen**.

### Android
1. Open in Chrome.
2. Tap the menu → **Install app** (or "Add to Home Screen").

### Desktop (Chrome / Edge)
1. Open the site.
2. Click the install icon in the address bar (or menu → **Install Health Tracker**).

Once installed, the app runs full-screen with its own icon and works offline.

## Deploying to GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/health-tracker.git
git push -u origin main
```

Then in your repo settings: **Pages → Source → Deploy from branch → `main` / `/ (root)`**. After a minute the app is live at `https://<you>.github.io/health-tracker/`.

## Architecture

The app is structured as concentric layers — outer layers depend on inner ones, never the reverse.

```
src/
├── core/                   Framework-agnostic primitives
│   ├── App.js              Composition root (wires everything up)
│   ├── EventBus.js         Pub/sub for decoupled communication
│   ├── Store.js            Namespaced localStorage wrapper
│   ├── dateUtils.js        Date helpers (ISO, weekday, week start, ...)
│   └── dom.js              $/$$/on/esc helpers
│
├── data/
│   └── defaults.js         Default exercises, routines, muscle groups
│
├── models/                 Domain objects with behavior (not anemic DTOs)
│   ├── Exercise.js         Exercise, RoutineExercise
│   ├── Routine.js          Routine (add/remove/move/update exercises)
│   ├── Workout.js          LoggedSet (+ Epley 1RM), LoggedExercise, Workout
│   ├── Nutrition.js        Macros, Meal, Recipe, MacroTargets (+ percent calc)
│   └── Body.js             WeightEntry, Measurement, RecoveryEntry (+ score)
│
├── repositories/           CRUD over Store, emit "<name>:changed" events
│   ├── BaseRepository.js   Generic add/remove/update/replaceAll
│   └── repositories.js     RoutineRepo, WorkoutRepo, MealRepo,
│                           RecipeRepo, WeightRepo, MeasurementRepo,
│                           RecoveryRepo, ExerciseRepo, SettingsRepo
│
├── services/               Logic that spans multiple models
│   ├── WorkoutSession.js   Active session: timer, sets, finish → Workout
│   └── calculators.js      sumMacros, StreakCalculator, PRCalculator
│
└── ui/
    ├── components/
    │   ├── ModalManager.js     Open/close bottom-sheet modals
    │   ├── Router.js           Bottom-nav tab controller
    │   ├── Toast.js            Transient status banner
    │   └── WeightChart.js      Canvas sparkline for body weight
    └── pages/
        ├── Page.js             Base class
        ├── HomePage.js         Dashboard
        ├── WorkoutPage.js      Routines + history
        ├── ActiveWorkoutPage.js  In-progress session
        ├── NutritionPage.js    Targets + meals + recipes
        └── ProgressPage.js     Weight + measurements + PRs + recovery
```

### Data flow

1. User clicks something → an inline handler (e.g., `logMeal()`) delegates to a `Flows` method on `App`.
2. `Flows` reads form values, builds a domain model (e.g., `new Meal({...})`), and calls the appropriate repository.
3. The repository persists to `Store` and emits `meals:changed` on the `EventBus`.
4. Every page subscribed to that event re-renders itself.

Pages never call other pages directly, never touch `localStorage` directly, and don't know about each other. Adding a new page or repository doesn't require touching anything else.

## Extending

### Add a new domain (e.g., supplements)

1. Create `src/models/Supplement.js` — a class with `toJSON` and a static `fromJSON`.
2. Create a repository in `src/repositories/repositories.js`:
   ```js
   export class SupplementRepository extends BaseRepository {
     constructor(store, bus) {
       super({ store, bus, key: 'supplements', eventName: 'supplements',
               revive: Supplement.fromJSON });
     }
   }
   ```
3. Instantiate it in `App` constructor: `this.supplements = new SupplementRepository(this.store, this.bus);`.
4. Add a UI page extending `Page`, subscribe to `supplements:changed`.

### Add a new metric to the dashboard

Open `src/ui/pages/HomePage.js`, add a render method, subscribe to the relevant `*:changed` event, and add the matching DOM nodes to `index.html`.

### Tweak the visual theme

All design tokens are CSS variables in `styles/app.css` under `:root` — change `--accent`, `--bg`, etc., and the entire app re-themes.

## Data privacy

- **Nothing is sent anywhere.** All data lives in your browser's `localStorage` under the `ht_` prefix.
- **Clearing browser data wipes everything.** Use export (see below) to back up.
- **No analytics, no tracking, no third-party requests** (other than Google Fonts, which can be self-hosted by replacing the `<link>` in `index.html`).

## Backup / restore

The `Store` class exposes `exportAll()` and `importAll()` for full data export/restore. You can wire these to UI buttons in `App._exposeGlobalHandlers` and a settings modal — left as an exercise so the default UI stays focused. From DevTools:

```js
// Export to JSON
copy(JSON.stringify(app.store.exportAll()));

// Restore from JSON
app.store.importAll(JSON.parse(prompt('Paste JSON')));
location.reload();
```

## License

MIT — see [LICENSE](LICENSE).

## Credits

UI design: dark minimalist with lime-green accent. Built with DM Sans + DM Mono. Original UI by Mateo, refactored to OOP modular architecture.
