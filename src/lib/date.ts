import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addDays, differenceInCalendarDays, parseISO } from 'date-fns';

export const CET_ZONE = 'Europe/Berlin';

export type DateString = string;

export function todayCET(now: Date = new Date()): DateString {
  return formatInTimeZone(now, CET_ZONE, 'yyyy-MM-dd');
}

export function nowInCET(now: Date = new Date()): Date {
  return toZonedTime(now, CET_ZONE);
}

export function dateStringInCET(d: Date): DateString {
  return formatInTimeZone(d, CET_ZONE, 'yyyy-MM-dd');
}

export function parseDateString(s: DateString): Date {
  return fromZonedTime(`${s}T00:00:00`, CET_ZONE);
}

export function addDaysCET(s: DateString, days: number): DateString {
  return dateStringInCET(addDays(parseDateString(s), days));
}

export function daysBetweenCET(a: DateString, b: DateString): number {
  return differenceInCalendarDays(parseDateString(b), parseDateString(a));
}

const DAY_NAMES_MON_FIRST = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type WeekdayKey = typeof DAY_NAMES_MON_FIRST[number];

export function weekdayKeyCET(s: DateString): WeekdayKey {
  const dow = parseISO(`${s}T12:00:00Z`).getUTCDay();
  const idx = (dow + 6) % 7;
  return DAY_NAMES_MON_FIRST[idx];
}

export function startOfWeekCET(s: DateString): DateString {
  const dow = parseISO(`${s}T12:00:00Z`).getUTCDay();
  const offset = (dow + 6) % 7;
  return addDaysCET(s, -offset);
}

export function lastNDaysCET(n: number, anchor: DateString = todayCET()): DateString[] {
  const out: DateString[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDaysCET(anchor, -i));
  return out;
}
