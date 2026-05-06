import type { CycleStart } from './types';
import { addDaysCET, daysBetweenCET, todayCET, type DateString } from './date';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export function phaseForDay(day: number): CyclePhase {
  if (day <= 5) return 'menstrual';
  if (day <= 13) return 'follicular';
  if (day <= 16) return 'ovulatory';
  return 'luteal';
}

export const PHASE_RANGES: { phase: CyclePhase; start: number; end: number }[] = [
  { phase: 'menstrual', start: 1, end: 5 },
  { phase: 'follicular', start: 6, end: 13 },
  { phase: 'ovulatory', start: 14, end: 16 },
  { phase: 'luteal', start: 17, end: 28 },
];

export interface CycleSummary {
  averageLength: number;
  lastStart: DateString | null;
  todayDay: number | null;
  todayPhase: CyclePhase | null;
  predictedNext: DateString | null;
}

const DEFAULT_LENGTH = 28;

export function summarizeCycle(starts: CycleStart[], today: DateString = todayCET()): CycleSummary {
  const sorted = [...starts].sort((a, b) => a.date.localeCompare(b.date));
  const lastStart = sorted.at(-1)?.date ?? null;

  let averageLength = DEFAULT_LENGTH;
  if (sorted.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(daysBetweenCET(sorted[i - 1].date, sorted[i].date));
    }
    const valid = gaps.filter((g) => g > 0 && g < 90);
    if (valid.length > 0) {
      averageLength = Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
    }
  }

  if (!lastStart) {
    return { averageLength, lastStart: null, todayDay: null, todayPhase: null, predictedNext: null };
  }

  const dayOffset = daysBetweenCET(lastStart, today);
  const todayDay = dayOffset >= 0 ? dayOffset + 1 : null;
  const lutealEnd = Math.max(28, averageLength);
  const todayPhase = todayDay !== null && todayDay >= 1 && todayDay <= lutealEnd ? phaseForDay(todayDay) : null;
  const predictedNext = addDaysCET(lastStart, averageLength);

  return { averageLength, lastStart, todayDay, todayPhase, predictedNext };
}
