import type { Checkup, Exercise, Routine } from './types';

export const SEED_CHECKUPS: Checkup[] = [
  { id: 'seed-checkup-bloodwork', name: 'Annual bloodwork', intervalMonths: 12 },
  { id: 'seed-checkup-dental', name: 'Dental cleaning', intervalMonths: 6 },
  { id: 'seed-checkup-eye', name: 'Eye exam', intervalMonths: 24 },
  { id: 'seed-checkup-skin', name: 'Skin / dermatology check', intervalMonths: 12 },
  { id: 'seed-checkup-cervical', name: 'Cervical screening', intervalMonths: 36 },
  { id: 'seed-checkup-gp', name: 'General GP checkup', intervalMonths: 12 },
];

export const SEED_EXERCISES: Exercise[] = [
  { id: 'seed-banded-squat', name: 'Banded squat', muscleGroup: 'legs', defaultSets: 3, defaultReps: '12', defaultRestSec: 45 },
  { id: 'seed-banded-row', name: 'Banded row', muscleGroup: 'back', defaultSets: 3, defaultReps: '12', defaultRestSec: 45 },
  { id: 'seed-banded-chest-press', name: 'Banded chest press', muscleGroup: 'chest', defaultSets: 3, defaultReps: '12', defaultRestSec: 45 },
  { id: 'seed-banded-lateral-raise', name: 'Banded lateral raise', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '15', defaultRestSec: 45 },
  { id: 'seed-banded-pallof-press', name: 'Banded Pallof press', muscleGroup: 'core', defaultSets: 3, defaultReps: '12 each side', defaultRestSec: 45 },
  { id: 'seed-banded-good-morning', name: 'Banded good morning', muscleGroup: 'legs', defaultSets: 3, defaultReps: '12', defaultRestSec: 45 },
  { id: 'seed-banded-deadlift', name: 'Banded deadlift', muscleGroup: 'full body', defaultSets: 3, defaultReps: '10', defaultRestSec: 60 },
  { id: 'seed-banded-glute-kickback', name: 'Banded glute kickback', muscleGroup: 'legs', defaultSets: 3, defaultReps: '12 each side', defaultRestSec: 45 },
  { id: 'seed-banded-face-pull', name: 'Banded face pull', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '15', defaultRestSec: 45 },
  { id: 'seed-banded-hip-thrust', name: 'Banded hip thrust', muscleGroup: 'legs', defaultSets: 3, defaultReps: '12', defaultRestSec: 45 },
  { id: 'seed-banded-side-step', name: 'Banded side step', muscleGroup: 'legs', defaultSets: 3, defaultReps: '15 each side', defaultRestSec: 45 },
  { id: 'seed-banded-pull-apart', name: 'Banded pull-apart', muscleGroup: 'back', defaultSets: 3, defaultReps: '15', defaultRestSec: 30 },
  { id: 'seed-banded-tricep-extension', name: 'Banded tricep extension', muscleGroup: 'chest', defaultSets: 3, defaultReps: '12', defaultRestSec: 45 },
  { id: 'seed-banded-bicep-curl', name: 'Banded bicep curl', muscleGroup: 'back', defaultSets: 3, defaultReps: '12', defaultRestSec: 45 },
  { id: 'seed-banded-glute-bridge', name: 'Banded glute bridge', muscleGroup: 'legs', defaultSets: 3, defaultReps: '15', defaultRestSec: 45 },
];

const FIVE_CORE: { exerciseId: string; sets: number; reps: string; restSec: number }[] = [
  { exerciseId: 'seed-banded-squat', sets: 3, reps: '12', restSec: 45 },
  { exerciseId: 'seed-banded-row', sets: 3, reps: '12', restSec: 45 },
  { exerciseId: 'seed-banded-chest-press', sets: 3, reps: '12', restSec: 45 },
  { exerciseId: 'seed-banded-lateral-raise', sets: 3, reps: '15', restSec: 45 },
  { exerciseId: 'seed-banded-pallof-press', sets: 3, reps: '12 each side', restSec: 45 },
];

export const SEED_ROUTINES: Routine[] = [
  {
    id: 'seed-routine-bands-home',
    name: 'Bands · home',
    kind: 'standard',
    exercises: FIVE_CORE,
    defaultRestSec: 45,
    estimatedMinutes: 25,
  },
  {
    id: 'seed-routine-bands-rowing-gym',
    name: 'Bands + rowing · gym',
    kind: 'rowing-intervals',
    exercises: FIVE_CORE,
    defaultRestSec: 45,
    estimatedMinutes: 45,
    rowingBlock: {
      warmupMin: 3,
      intervals: 8,
      hardMin: 1,
      easyMin: 1,
      cooldownMin: 2,
    },
  },
  {
    id: 'seed-routine-active-recovery',
    name: 'Active recovery',
    kind: 'active-recovery',
    exercises: [],
    defaultRestSec: 0,
    estimatedMinutes: 30,
    defaultActivity: 'walking',
  },
];
