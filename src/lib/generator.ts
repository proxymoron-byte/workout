import type { Exercise, MuscleGroup, Routine, RoutineExercise } from './types';
import { newId } from './db';

export type GeneratorGoal = 'full-body' | 'upper' | 'lower' | 'core';
export type GeneratorEquipment = 'bands' | 'bands+rowing' | 'bodyweight+bands';
export type GeneratorDuration = 20 | 30 | 45;

export interface GenerateInput {
  goal: GeneratorGoal;
  durationMin: GeneratorDuration;
  equipment: GeneratorEquipment;
}

const GROUPS_FOR_GOAL: Record<GeneratorGoal, MuscleGroup[]> = {
  'full-body': ['legs', 'back', 'chest', 'shoulders', 'core'],
  upper: ['back', 'chest', 'shoulders'],
  lower: ['legs', 'core'],
  core: ['core', 'back', 'shoulders'],
};

const GOAL_LABEL: Record<GeneratorGoal, string> = {
  'full-body': 'Full body',
  upper: 'Upper',
  lower: 'Lower',
  core: 'Core focus',
};

const ROWING_BLOCK_MIN = 20;
const WORK_SEC_PER_SET = 30;

function exerciseMinutes(e: Pick<Exercise, 'defaultSets' | 'defaultRestSec'>): number {
  return (e.defaultSets * (WORK_SEC_PER_SET + e.defaultRestSec)) / 60;
}

function shuffle<T>(xs: T[]): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function generateRoutine(library: Exercise[], input: GenerateInput): Routine {
  const groups = GROUPS_FOR_GOAL[input.goal];
  const filtered = library.filter((e) => groups.includes(e.muscleGroup));
  const byGroup = new Map<MuscleGroup, Exercise[]>();
  for (const g of groups) byGroup.set(g, []);
  for (const e of shuffle(filtered)) byGroup.get(e.muscleGroup)?.push(e);

  const targetMin =
    input.equipment === 'bands+rowing' ? Math.max(8, input.durationMin - ROWING_BLOCK_MIN) : input.durationMin;

  const picked: Exercise[] = [];
  let totalMin = 0;

  // Round-robin across groups so push/pull/legs/core stay balanced.
  let rounds = 0;
  while (totalMin < targetMin && rounds < 10) {
    let pickedThisRound = false;
    for (const g of groups) {
      const pool = byGroup.get(g);
      if (!pool || pool.length === 0) continue;
      const candidate = pool[0];
      const time = exerciseMinutes(candidate);
      // Allow finishing slightly under or over; stop adding once we're within 2 min of target.
      if (totalMin + time > targetMin + 2) continue;
      pool.shift();
      picked.push(candidate);
      totalMin += time;
      pickedThisRound = true;
      if (totalMin >= targetMin) break;
    }
    if (!pickedThisRound) break;
    rounds++;
  }

  if (picked.length === 0 && filtered.length > 0) {
    picked.push(filtered[0]);
  }

  const exercises: RoutineExercise[] = picked.map((e) => ({
    exerciseId: e.id,
    sets: e.defaultSets,
    reps: e.defaultReps,
    restSec: e.defaultRestSec,
  }));

  return {
    id: newId(),
    name: `${GOAL_LABEL[input.goal]} · ${input.durationMin} min`,
    kind: input.equipment === 'bands+rowing' ? 'rowing-intervals' : 'standard',
    exercises,
    defaultRestSec: 45,
    estimatedMinutes: input.durationMin,
    rowingBlock:
      input.equipment === 'bands+rowing'
        ? { warmupMin: 3, intervals: 8, hardMin: 1, easyMin: 1, cooldownMin: 2 }
        : undefined,
  };
}

export function alternativesFor(library: Exercise[], exerciseId: string, excludeIds: string[] = []): Exercise[] {
  const target = library.find((e) => e.id === exerciseId);
  if (!target) return [];
  const exclude = new Set([...excludeIds, exerciseId]);
  return library.filter((e) => e.muscleGroup === target.muscleGroup && !exclude.has(e.id));
}

export function swapExercise(routine: Routine, idx: number, newExerciseId: string, library: Exercise[]): Routine {
  const ex = library.find((e) => e.id === newExerciseId);
  if (!ex) return routine;
  const exercises = [...routine.exercises];
  exercises[idx] = {
    exerciseId: newExerciseId,
    sets: ex.defaultSets,
    reps: ex.defaultReps,
    restSec: ex.defaultRestSec,
  };
  return { ...routine, exercises };
}

export function muscleGroupsForGoal(goal: GeneratorGoal): MuscleGroup[] {
  return GROUPS_FOR_GOAL[goal];
}
