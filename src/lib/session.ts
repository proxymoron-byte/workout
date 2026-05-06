import { db, newId } from './db';
import type { Routine, SessionExerciseResult, WorkoutSession } from './types';

export async function startSession(routine: Routine): Promise<WorkoutSession> {
  const exercises: SessionExerciseResult[] = await Promise.all(
    routine.exercises.map(async (re) => {
      const ex = await db.exercises.get(re.exerciseId);
      return {
        exerciseId: re.exerciseId,
        exerciseNameSnapshot: ex?.name ?? '(deleted exercise)',
        plannedSets: re.sets,
        plannedReps: re.reps,
        restSec: re.restSec,
        sets: Array.from({ length: re.sets }, () => ({ completed: false })),
      };
    }),
  );

  const session: WorkoutSession = {
    id: newId(),
    routineId: routine.id,
    routineNameSnapshot: routine.name,
    routineKindSnapshot: routine.kind,
    startedAt: new Date().toISOString(),
    exercises,
    rowingBlockSnapshot: routine.rowingBlock,
    activityLabel: routine.kind === 'active-recovery' ? routine.defaultActivity : undefined,
  };
  await db.sessions.add(session);
  return session;
}

export async function patchSession(id: string, patch: Partial<WorkoutSession>): Promise<void> {
  await db.sessions.update(id, patch);
}

export async function completeSession(id: string): Promise<void> {
  const s = await db.sessions.get(id);
  if (!s) return;
  const completedAt = new Date().toISOString();
  const durationSec = Math.round((Date.parse(completedAt) - Date.parse(s.startedAt)) / 1000);
  await db.sessions.update(id, { completedAt, durationSec });
}

export async function discardSession(id: string): Promise<void> {
  await db.sessions.delete(id);
}

export async function getInProgressSession(): Promise<WorkoutSession | undefined> {
  return db.sessions.filter((s) => !s.completedAt).first();
}

export function exerciseStartedCount(s: WorkoutSession): number {
  return s.exercises.filter((e) => e.sets.some((set) => set.completed)).length;
}
