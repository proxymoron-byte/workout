import type { Checkup, Exercise, Routine } from './types';

export const SEED_CHECKUPS: Checkup[] = [
  { id: 'seed-checkup-bloodwork', name: 'Annual bloodwork', intervalMonths: 12 },
  { id: 'seed-checkup-dental', name: 'Dental cleaning', intervalMonths: 6 },
  { id: 'seed-checkup-eye', name: 'Eye exam', intervalMonths: 24 },
  { id: 'seed-checkup-skin', name: 'Skin / dermatology check', intervalMonths: 12 },
  { id: 'seed-checkup-cervical', name: 'Cervical screening', intervalMonths: 36 },
  { id: 'seed-checkup-gp', name: 'General GP checkup', intervalMonths: 12 },
];

const FITBOD_LOOP_BAND = 'https://fitbod.me/exercises/loop-band';

export const SEED_EXERCISES: Exercise[] = [
  // Original 15
  { id: 'seed-banded-squat', name: 'Banded squat', muscleGroup: 'legs', defaultSets: 3, defaultReps: '12', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-row', name: 'Banded row', muscleGroup: 'back', defaultSets: 3, defaultReps: '12', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-chest-press', name: 'Banded chest press', muscleGroup: 'chest', defaultSets: 3, defaultReps: '12', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-lateral-raise', name: 'Banded lateral raise', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '15', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-pallof-press', name: 'Banded Pallof press', muscleGroup: 'core', defaultSets: 3, defaultReps: '12 each side', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-good-morning', name: 'Banded good morning', muscleGroup: 'legs', defaultSets: 3, defaultReps: '12', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-deadlift', name: 'Banded deadlift', muscleGroup: 'full body', defaultSets: 3, defaultReps: '10', defaultRestSec: 60, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-glute-kickback', name: 'Banded glute kickback', muscleGroup: 'legs', defaultSets: 3, defaultReps: '12 each side', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-face-pull', name: 'Banded face pull', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '15', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-hip-thrust', name: 'Banded hip thrust', muscleGroup: 'legs', defaultSets: 3, defaultReps: '12', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-side-step', name: 'Banded side step', muscleGroup: 'legs', defaultSets: 3, defaultReps: '15 each side', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-pull-apart', name: 'Banded pull-apart', muscleGroup: 'back', defaultSets: 3, defaultReps: '15', defaultRestSec: 30, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-tricep-extension', name: 'Banded tricep extension', muscleGroup: 'chest', defaultSets: 3, defaultReps: '12', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-bicep-curl', name: 'Banded bicep curl', muscleGroup: 'back', defaultSets: 3, defaultReps: '12', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-glute-bridge', name: 'Banded glute bridge', muscleGroup: 'legs', defaultSets: 3, defaultReps: '15', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },

  // Added for sculpt routines
  { id: 'seed-banded-rdl', name: 'Banded Romanian deadlift', muscleGroup: 'legs', defaultSets: 3, defaultReps: '12', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-sumo-deadlift', name: 'Banded sumo deadlift', muscleGroup: 'legs', defaultSets: 3, defaultReps: '12', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-overhead-pull-apart', name: 'Banded overhead pull-apart', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '15', defaultRestSec: 30, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-hip-abduction-standing', name: 'Banded standing hip abduction', muscleGroup: 'legs', defaultSets: 3, defaultReps: '12 each side', defaultRestSec: 30, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-pulse-lunge', name: 'Banded pulse lunge', muscleGroup: 'legs', defaultSets: 3, defaultReps: '10 each side', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-ab-twist-standing', name: 'Banded standing ab twist', muscleGroup: 'core', defaultSets: 3, defaultReps: '12 each side', defaultRestSec: 30, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-shoulder-external-rotation', name: 'Banded shoulder external rotation', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '12 each side', defaultRestSec: 30, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-push-up', name: 'Banded push-up', muscleGroup: 'chest', defaultSets: 3, defaultReps: '10', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-seated-row', name: 'Banded seated row', muscleGroup: 'back', defaultSets: 3, defaultReps: '12', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-lat-pulldown', name: 'Banded lat pulldown', muscleGroup: 'back', defaultSets: 3, defaultReps: '12', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-underhand-front-raise', name: 'Banded underhand front raise', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '12', defaultRestSec: 30, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-hammer-curl', name: 'Banded hammer curl', muscleGroup: 'back', defaultSets: 3, defaultReps: '12', defaultRestSec: 30, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-back-squat', name: 'Banded back squat', muscleGroup: 'legs', defaultSets: 3, defaultReps: '15', defaultRestSec: 45, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-hamstring-curl-standing', name: 'Banded standing hamstring curl', muscleGroup: 'legs', defaultSets: 3, defaultReps: '12 each side', defaultRestSec: 30, referenceUrl: FITBOD_LOOP_BAND },
  { id: 'seed-banded-pallof-twist', name: 'Banded Pallof press + twist', muscleGroup: 'core', defaultSets: 3, defaultReps: '10 each side', defaultRestSec: 30, referenceUrl: FITBOD_LOOP_BAND },

  // Bodyweight / isometric
  { id: 'seed-bw-plank', name: 'Plank hold', muscleGroup: 'core', defaultSets: 2, defaultReps: '30–45 sec', defaultRestSec: 30 },
  { id: 'seed-bw-hollow-hold', name: 'Hollow hold', muscleGroup: 'core', defaultSets: 3, defaultReps: '30 sec', defaultRestSec: 30 },
];

const FIVE_CORE: { exerciseId: string; sets: number; reps: string; restSec: number }[] = [
  { exerciseId: 'seed-banded-squat', sets: 3, reps: '12', restSec: 45 },
  { exerciseId: 'seed-banded-row', sets: 3, reps: '12', restSec: 45 },
  { exerciseId: 'seed-banded-chest-press', sets: 3, reps: '12', restSec: 45 },
  { exerciseId: 'seed-banded-lateral-raise', sets: 3, reps: '15', restSec: 45 },
  { exerciseId: 'seed-banded-pallof-press', sets: 3, reps: '12 each side', restSec: 45 },
];

const PROGRESSION_NOTE = [
  'Progressive overload — bands cap out fast, so push these levers:',
  '• add reps before adding bands (hit 15 cleanly, then move up)',
  '• 3–4 sec slow eccentric for time under tension',
  '• 1–2 sec pause at peak contraction (top of hip thrust, row, kickback)',
  '• stack two bands when one feels easy',
].join('\n');

const WORKOUT_A_NOTES = [
  'Glutes & posterior chain · ~40 min · do 3–4 sessions in a row before switching to Workout B.',
  '',
  'Warm-up (5 min): Loop band side step 30 sec each way · overhead pull-apart 15 reps · bodyweight squats 15 · banded good morning 10 slow · cat-cow + hip circles 1 min.',
  '',
  'Block 1 — 3 rounds, ~45 sec rest between rounds: RDL → Hip Thrust → Sumo Deadlift.',
  'Block 2 — 3 rounds, ~30 sec rest: Glute Kickback → Standing Hip Abduction → Pulse Lunge.',
  'Block 3 — 2 rounds, minimal rest (finisher): Bent Over Row → Bicep Curl → Standing Ab Twist → Plank hold 30–45 sec.',
  '',
  'Cool-down: pigeon pose · hamstring stretch · child’s pose.',
  '',
  PROGRESSION_NOTE,
].join('\n');

const WORKOUT_B_NOTES = [
  'Upper sculpt + legs · ~40 min · do 3–4 sessions in a row before switching back to Workout A.',
  '',
  'Warm-up (5 min): arm circles + shoulder rolls 1 min · overhead pull-apart 15 reps · shoulder external rotation 12 each side · bodyweight glute bridges 15 · walkouts to plank 8.',
  '',
  'Block 1 — 3 rounds, ~45 sec rest: Banded Push Up → Seated Row → Lat Pulldown.',
  'Block 2 — 3 rounds, ~30 sec rest: Underhand Front Raise → Face Pull → Tricep Extension → Hammer Curl.',
  'Block 3 — 3 rounds, minimal rest: Back Squat → Standing Hamstring Curl → Pallof Press + Twist → Hollow hold 30 sec.',
  '',
  'Cool-down: chest opener · lat stretch · spinal twist.',
  '',
  PROGRESSION_NOTE,
].join('\n');

const WORKOUT_A_EXERCISES: { exerciseId: string; sets: number; reps: string; restSec: number }[] = [
  // Block 1 — lower-body strength, 3 rounds × 45s rest
  { exerciseId: 'seed-banded-rdl', sets: 3, reps: '12', restSec: 45 },
  { exerciseId: 'seed-banded-hip-thrust', sets: 3, reps: '15', restSec: 45 },
  { exerciseId: 'seed-banded-sumo-deadlift', sets: 3, reps: '12', restSec: 45 },
  // Block 2 — glute & hip isolation, 3 rounds × 30s rest
  { exerciseId: 'seed-banded-glute-kickback', sets: 3, reps: '12 each side', restSec: 30 },
  { exerciseId: 'seed-banded-hip-abduction-standing', sets: 3, reps: '12 each side', restSec: 30 },
  { exerciseId: 'seed-banded-pulse-lunge', sets: 3, reps: '10 each side', restSec: 30 },
  // Block 3 — upper-body + core finisher, 2 rounds × minimal rest
  { exerciseId: 'seed-banded-row', sets: 2, reps: '12', restSec: 20 },
  { exerciseId: 'seed-banded-bicep-curl', sets: 2, reps: '12', restSec: 20 },
  { exerciseId: 'seed-banded-ab-twist-standing', sets: 2, reps: '12 each side', restSec: 20 },
  { exerciseId: 'seed-bw-plank', sets: 2, reps: '30–45 sec', restSec: 20 },
];

const WORKOUT_B_EXERCISES: { exerciseId: string; sets: number; reps: string; restSec: number }[] = [
  // Block 1 — push & pull, 3 rounds × 45s rest
  { exerciseId: 'seed-banded-push-up', sets: 3, reps: '10', restSec: 45 },
  { exerciseId: 'seed-banded-seated-row', sets: 3, reps: '12', restSec: 45 },
  { exerciseId: 'seed-banded-lat-pulldown', sets: 3, reps: '12', restSec: 45 },
  // Block 2 — shoulders & arms, 3 rounds × 30s rest
  { exerciseId: 'seed-banded-underhand-front-raise', sets: 3, reps: '12', restSec: 30 },
  { exerciseId: 'seed-banded-face-pull', sets: 3, reps: '15', restSec: 30 },
  { exerciseId: 'seed-banded-tricep-extension', sets: 3, reps: '12', restSec: 30 },
  { exerciseId: 'seed-banded-hammer-curl', sets: 3, reps: '12', restSec: 30 },
  // Block 3 — legs & core, 3 rounds × minimal rest
  { exerciseId: 'seed-banded-back-squat', sets: 3, reps: '15', restSec: 20 },
  { exerciseId: 'seed-banded-hamstring-curl-standing', sets: 3, reps: '12 each side', restSec: 20 },
  { exerciseId: 'seed-banded-pallof-twist', sets: 3, reps: '10 each side', restSec: 20 },
  { exerciseId: 'seed-bw-hollow-hold', sets: 3, reps: '30 sec', restSec: 20 },
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
  {
    id: 'seed-routine-sculpt-a-glutes',
    name: 'Sculpt A · glutes & posterior',
    kind: 'standard',
    exercises: WORKOUT_A_EXERCISES,
    defaultRestSec: 30,
    estimatedMinutes: 40,
    notes: WORKOUT_A_NOTES,
  },
  {
    id: 'seed-routine-sculpt-b-upper',
    name: 'Sculpt B · upper + legs',
    kind: 'standard',
    exercises: WORKOUT_B_EXERCISES,
    defaultRestSec: 30,
    estimatedMinutes: 40,
    notes: WORKOUT_B_NOTES,
  },
];
