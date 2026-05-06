import type { DateString, WeekdayKey } from './date';

export type ID = string;

export type MuscleGroup = 'legs' | 'back' | 'chest' | 'shoulders' | 'core' | 'full body';

export interface Exercise {
  id: ID;
  name: string;
  muscleGroup: MuscleGroup;
  defaultSets: number;
  defaultReps: string;
  defaultRestSec: number;
  referenceUrl?: string;
  notes?: string;
}

export type RoutineKind = 'standard' | 'active-recovery' | 'rowing-intervals';

export interface RoutineExercise {
  exerciseId: ID;
  sets: number;
  reps: string;
  restSec: number;
}

export interface RowingBlock {
  warmupMin: number;
  intervals: number;
  hardMin: number;
  easyMin: number;
  cooldownMin: number;
}

export interface Routine {
  id: ID;
  name: string;
  kind: RoutineKind;
  exercises: RoutineExercise[];
  defaultRestSec: number;
  estimatedMinutes: number;
  notes?: string;
  rowingBlock?: RowingBlock;
  defaultActivity?: string;
}

export interface SessionSetResult {
  setIndex: number;
  completed: boolean;
}

export interface SessionExerciseResult {
  exerciseId: ID;
  sets: SessionSetResult[];
  notes?: string;
}

export interface WorkoutSession {
  id: ID;
  routineId: ID;
  routineNameSnapshot: string;
  startedAt: string;
  completedAt?: string;
  durationSec?: number;
  exercises: SessionExerciseResult[];
  activityLabel?: string;
}

export type MealTag = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface NutritionEntry {
  id: ID;
  date: DateString;
  name: string;
  kcal: number;
  proteinG: number;
  meal?: MealTag;
  createdAt: string;
}

export interface WeightEntry {
  id: ID;
  date: DateString;
  weightKg: number;
  createdAt: string;
}

export interface CycleStart {
  id: ID;
  date: DateString;
  createdAt: string;
}

export interface StepsEntry {
  id: ID;
  date: DateString;
  steps: number;
  createdAt: string;
}

export interface Checkup {
  id: ID;
  name: string;
  intervalMonths: number;
  lastCompletedDate?: DateString;
  notes?: string;
}

export interface DriftDismissal {
  ruleId: string;
  dismissedUntil: string;
}

export type DriftRuleId =
  | 'overdueCheckup'
  | 'missedWorkouts'
  | 'proteinLow'
  | 'kcalHigh'
  | 'weightTrend'
  | 'longGap'
  | 'exportReminder';

export type ScheduleSlot = { kind: 'routine'; routineId: ID } | { kind: 'rest' } | { kind: 'active-recovery' };

export type WeeklySchedule = Record<WeekdayKey, ScheduleSlot>;

export interface Goals {
  kcalDaily: number;
  proteinDaily: number;
  stepsDaily: number;
  weeklyWorkouts: number;
  weightGoalKg?: number;
  weighInsPerWeek: number;
}

export interface Settings {
  schemaVersion: number;
  displayName: string;
  goals: Goals;
  weeklySchedule: WeeklySchedule;
  driftRules: Record<DriftRuleId, boolean>;
  audioEnabled: boolean;
  lastExportAt?: string;
  checkupsDisclaimerSeen: boolean;
}
