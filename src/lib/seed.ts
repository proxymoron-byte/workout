import { db } from './db';
import { SEED_EXERCISES, SEED_ROUTINES } from './seedData';

const SEED_FLAG_KEY = 'workout.seeded.v1';

export async function runSeedIfEmpty(): Promise<void> {
  if (localStorage.getItem(SEED_FLAG_KEY) === '1') return;
  const [exCount, rtCount] = await Promise.all([db.exercises.count(), db.routines.count()]);
  if (exCount === 0) {
    await db.exercises.bulkAdd(SEED_EXERCISES);
  }
  if (rtCount === 0) {
    await db.routines.bulkAdd(SEED_ROUTINES);
  }
  localStorage.setItem(SEED_FLAG_KEY, '1');
}
