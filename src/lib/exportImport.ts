import { db, SCHEMA_VERSION } from './db';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './settings';
import type {
  Checkup,
  CycleStart,
  Exercise,
  NutritionEntry,
  Routine,
  Settings,
  StepsEntry,
  WeightEntry,
  WorkoutSession,
} from './types';
import { todayCET } from './date';

export interface ExportBundle {
  schemaVersion: number;
  exportedAt: string;
  settings: Settings;
  exercises: Exercise[];
  routines: Routine[];
  sessions: WorkoutSession[];
  nutrition: NutritionEntry[];
  weights: WeightEntry[];
  cycleStarts: CycleStart[];
  steps: StepsEntry[];
  checkups: Checkup[];
}

export async function exportAll(): Promise<ExportBundle> {
  const [exercises, routines, sessions, nutrition, weights, cycleStarts, steps, checkups] = await Promise.all([
    db.exercises.toArray(),
    db.routines.toArray(),
    db.sessions.toArray(),
    db.nutrition.toArray(),
    db.weights.toArray(),
    db.cycleStarts.toArray(),
    db.steps.toArray(),
    db.checkups.toArray(),
  ]);
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: loadSettings(),
    exercises,
    routines,
    sessions,
    nutrition,
    weights,
    cycleStarts,
    steps,
    checkups,
  };
}

export async function downloadExport(): Promise<void> {
  const bundle = await exportAll();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `health-dashboard-export-${todayCET()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  const settings = loadSettings();
  saveSettings({ ...settings, lastExportAt: new Date().toISOString() });
}

export type ImportMode = 'replace' | 'merge';

function migrate(bundle: ExportBundle): ExportBundle {
  if (bundle.schemaVersion === SCHEMA_VERSION) return bundle;
  throw new Error(`Unsupported schema version ${bundle.schemaVersion}; current is ${SCHEMA_VERSION}.`);
}

export async function importBundle(raw: unknown, mode: ImportMode): Promise<void> {
  if (!raw || typeof raw !== 'object') throw new Error('Import file is not a JSON object.');
  const bundle = migrate(raw as ExportBundle);

  if (mode === 'replace') {
    await db.transaction(
      'rw',
      [db.exercises, db.routines, db.sessions, db.nutrition, db.weights, db.cycleStarts, db.steps, db.checkups, db.driftDismissals],
      async () => {
        await Promise.all([
          db.exercises.clear(),
          db.routines.clear(),
          db.sessions.clear(),
          db.nutrition.clear(),
          db.weights.clear(),
          db.cycleStarts.clear(),
          db.steps.clear(),
          db.checkups.clear(),
        ]);
        await Promise.all([
          db.exercises.bulkAdd(bundle.exercises ?? []),
          db.routines.bulkAdd(bundle.routines ?? []),
          db.sessions.bulkAdd(bundle.sessions ?? []),
          db.nutrition.bulkAdd(bundle.nutrition ?? []),
          db.weights.bulkAdd(bundle.weights ?? []),
          db.cycleStarts.bulkAdd(bundle.cycleStarts ?? []),
          db.steps.bulkAdd(bundle.steps ?? []),
          db.checkups.bulkAdd(bundle.checkups ?? []),
        ]);
      },
    );
    saveSettings({ ...DEFAULT_SETTINGS, ...bundle.settings });
  } else {
    await db.transaction(
      'rw',
      [db.exercises, db.routines, db.sessions, db.nutrition, db.weights, db.cycleStarts, db.steps, db.checkups],
      async () => {
        await Promise.all([
          db.exercises.bulkPut(bundle.exercises ?? []),
          db.routines.bulkPut(bundle.routines ?? []),
          db.sessions.bulkPut(bundle.sessions ?? []),
          db.nutrition.bulkPut(bundle.nutrition ?? []),
          db.weights.bulkPut(bundle.weights ?? []),
          db.cycleStarts.bulkPut(bundle.cycleStarts ?? []),
          db.steps.bulkPut(bundle.steps ?? []),
          db.checkups.bulkPut(bundle.checkups ?? []),
        ]);
      },
    );
    const current = loadSettings();
    saveSettings({ ...current, ...bundle.settings });
  }
}

export async function clearAll(): Promise<void> {
  await db.transaction(
    'rw',
    [db.exercises, db.routines, db.sessions, db.nutrition, db.weights, db.cycleStarts, db.steps, db.checkups, db.driftDismissals],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.routines.clear(),
        db.sessions.clear(),
        db.nutrition.clear(),
        db.weights.clear(),
        db.cycleStarts.clear(),
        db.steps.clear(),
        db.checkups.clear(),
        db.driftDismissals.clear(),
      ]);
    },
  );
  saveSettings(DEFAULT_SETTINGS);
}
