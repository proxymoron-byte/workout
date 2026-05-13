import { db } from './db';
import { SEED_CHECKUPS, SEED_EXERCISES, SEED_ROUTINES } from './seedData';

const SEED_FLAG_KEY = 'workout.seeded.v1';
const SEED_REFURL_MIGRATION_KEY = 'workout.seedRefUrlBackfilled.v1';
const SEED_SCULPT_ROUTINES_KEY = 'workout.seedSculptRoutines.v1';

const SCULPT_ROUTINE_IDS = ['seed-routine-sculpt-a-glutes', 'seed-routine-sculpt-b-upper'];

export async function runSeedIfEmpty(): Promise<void> {
  if (localStorage.getItem(SEED_FLAG_KEY) !== '1') {
    const [exCount, rtCount, ckCount] = await Promise.all([
      db.exercises.count(),
      db.routines.count(),
      db.checkups.count(),
    ]);
    if (exCount === 0) await db.exercises.bulkAdd(SEED_EXERCISES);
    if (rtCount === 0) await db.routines.bulkAdd(SEED_ROUTINES);
    if (ckCount === 0) await db.checkups.bulkAdd(SEED_CHECKUPS);
    localStorage.setItem(SEED_FLAG_KEY, '1');
  }

  if (localStorage.getItem(SEED_REFURL_MIGRATION_KEY) !== '1') {
    for (const seed of SEED_EXERCISES) {
      const existing = await db.exercises.get(seed.id);
      if (existing && !existing.referenceUrl && seed.referenceUrl) {
        await db.exercises.update(seed.id, { referenceUrl: seed.referenceUrl });
      }
    }
    localStorage.setItem(SEED_REFURL_MIGRATION_KEY, '1');
  }

  if (localStorage.getItem(SEED_SCULPT_ROUTINES_KEY) !== '1') {
    // Add any seed exercise not already present (introduces the new sculpt-specific exercises).
    for (const seed of SEED_EXERCISES) {
      const existing = await db.exercises.get(seed.id);
      if (!existing) await db.exercises.add(seed);
    }
    // Add the two sculpt routines if they're not already there.
    for (const id of SCULPT_ROUTINE_IDS) {
      const routine = SEED_ROUTINES.find((r) => r.id === id);
      if (!routine) continue;
      const existing = await db.routines.get(id);
      if (!existing) await db.routines.add(routine);
    }
    localStorage.setItem(SEED_SCULPT_ROUTINES_KEY, '1');
  }
}

