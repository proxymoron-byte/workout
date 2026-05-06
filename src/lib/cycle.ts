import type { CycleStart } from './types';
import { addDaysCET, daysBetweenCET, todayCET, type DateString } from './date';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export const PHASE_LABEL: Record<CyclePhase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulatory: 'Ovulatory',
  luteal: 'Luteal',
};

const DEFAULT_LENGTH = 28;

export function phaseForDay(day: number): CyclePhase {
  if (day <= 5) return 'menstrual';
  if (day <= 13) return 'follicular';
  if (day <= 16) return 'ovulatory';
  return 'luteal';
}

export interface CycleSummary {
  hasData: boolean;
  averageLength: number;
  lastStart: DateString | null;
  currentDay: number | null;
  currentPhase: CyclePhase | null;
  predictedNextStart: DateString | null;
}

export function summarizeCycle(starts: CycleStart[], today: DateString = todayCET()): CycleSummary {
  if (starts.length === 0) {
    return {
      hasData: false,
      averageLength: DEFAULT_LENGTH,
      lastStart: null,
      currentDay: null,
      currentPhase: null,
      predictedNextStart: null,
    };
  }
  const sorted = [...starts].sort((a, b) => a.date.localeCompare(b.date));
  const lastStart = sorted[sorted.length - 1].date;
  let averageLength = DEFAULT_LENGTH;
  if (sorted.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) gaps.push(daysBetweenCET(sorted[i - 1].date, sorted[i].date));
    averageLength = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
    if (averageLength < 14) averageLength = DEFAULT_LENGTH; // sanity
  }
  const sinceLast = daysBetweenCET(lastStart, today);
  let currentDay: number;
  let baseStart: DateString;
  if (sinceLast < 0) {
    currentDay = 1; // last start in the future — treat as day 1
    baseStart = lastStart;
  } else if (sinceLast >= averageLength) {
    // assume cycle has rolled over even though no new start logged
    const cyclesElapsed = Math.floor(sinceLast / averageLength);
    baseStart = addDaysCET(lastStart, cyclesElapsed * averageLength);
    currentDay = daysBetweenCET(baseStart, today) + 1;
  } else {
    baseStart = lastStart;
    currentDay = sinceLast + 1;
  }
  const predictedNextStart = addDaysCET(baseStart, averageLength);
  return {
    hasData: true,
    averageLength,
    lastStart,
    currentDay,
    currentPhase: phaseForDay(currentDay),
    predictedNextStart,
  };
}

export function phaseRanges(averageLength: number): { phase: CyclePhase; from: number; to: number }[] {
  const luteralEnd = Math.max(17, averageLength);
  return [
    { phase: 'menstrual', from: 1, to: 5 },
    { phase: 'follicular', from: 6, to: 13 },
    { phase: 'ovulatory', from: 14, to: 16 },
    { phase: 'luteal', from: 17, to: luteralEnd },
  ];
}
