import Dexie, { type Table } from 'dexie';
import type {
  Exercise,
  Routine,
  WorkoutSession,
  NutritionEntry,
  WeightEntry,
  CycleStart,
  StepsEntry,
  Checkup,
  DriftDismissal,
} from './types';

export const SCHEMA_VERSION = 1;

export class WorkoutDB extends Dexie {
  exercises!: Table<Exercise, string>;
  routines!: Table<Routine, string>;
  sessions!: Table<WorkoutSession, string>;
  nutrition!: Table<NutritionEntry, string>;
  weights!: Table<WeightEntry, string>;
  cycleStarts!: Table<CycleStart, string>;
  steps!: Table<StepsEntry, string>;
  checkups!: Table<Checkup, string>;
  driftDismissals!: Table<DriftDismissal, string>;

  constructor() {
    super('workout');
    this.version(1).stores({
      exercises: 'id, name, muscleGroup',
      routines: 'id, name, kind',
      sessions: 'id, routineId, startedAt, completedAt',
      nutrition: 'id, date, name',
      weights: 'id, date',
      cycleStarts: 'id, date',
      steps: 'id, date',
      checkups: 'id, name',
      driftDismissals: 'ruleId',
    });
  }
}

export const db = new WorkoutDB();

export function newId(): string {
  return crypto.randomUUID();
}
