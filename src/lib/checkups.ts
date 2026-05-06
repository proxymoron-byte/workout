import type { Checkup } from './types';
import { addDaysCET, daysBetweenCET, todayCET, type DateString } from './date';

export type CheckupStatus = 'schedule' | 'overdue' | 'due-soon' | 'up-to-date';

export interface CheckupView {
  checkup: Checkup;
  nextDue: DateString | null;
  status: CheckupStatus;
  daysToDue: number | null;
}

const DUE_SOON_DAYS = 30;

function addMonthsCET(date: DateString, months: number): DateString {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function viewFor(checkup: Checkup, today: DateString = todayCET()): CheckupView {
  if (!checkup.lastCompletedDate) {
    return { checkup, nextDue: null, status: 'schedule', daysToDue: null };
  }
  const nextDue = addMonthsCET(checkup.lastCompletedDate, checkup.intervalMonths);
  const daysToDue = daysBetweenCET(today, nextDue);
  let status: CheckupStatus;
  if (daysToDue < 0) status = 'overdue';
  else if (daysToDue <= DUE_SOON_DAYS) status = 'due-soon';
  else status = 'up-to-date';
  return { checkup, nextDue, status, daysToDue };
}

const STATUS_RANK: Record<CheckupStatus, number> = {
  overdue: 0,
  'due-soon': 1,
  schedule: 2,
  'up-to-date': 3,
};

export function sortViews(views: CheckupView[]): CheckupView[] {
  return [...views].sort((a, b) => {
    const r = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (r !== 0) return r;
    if (a.nextDue && b.nextDue) return a.nextDue.localeCompare(b.nextDue);
    if (a.nextDue) return -1;
    if (b.nextDue) return 1;
    return a.checkup.name.localeCompare(b.checkup.name);
  });
}

export function isOverdueByAtLeast(view: CheckupView, days: number): boolean {
  return view.status === 'overdue' && view.daysToDue !== null && -view.daysToDue >= days;
}

export function markDoneToday(checkup: Checkup): Checkup {
  return { ...checkup, lastCompletedDate: todayCET() };
}

export { addDaysCET as _internalAddDaysCET };
