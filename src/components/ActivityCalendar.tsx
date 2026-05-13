import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/db';
import { useSettings } from '../lib/settings';
import {
  addDaysCET,
  startOfWeekCET,
  todayCET,
  weekdayKeyCET,
  type DateString,
} from '../lib/date';

type ActivityIntensity = 0 | 1 | 2 | 3;

interface DayCell {
  date: DateString;
  inMonth: boolean;
  intensity: ActivityIntensity;
  isToday: boolean;
  workoutCompleted: boolean;
  nutritionEntries: number;
  steps: number;
}

function monthStartCET(today: DateString): DateString {
  // First day of the month for `today`.
  return `${today.slice(0, 7)}-01`;
}

function monthRange(today: DateString): { firstCell: DateString; numCells: number; monthLabel: string; monthIso: string } {
  const monthStart = monthStartCET(today);
  const firstCell = startOfWeekCET(monthStart);
  const monthIso = today.slice(0, 7);
  // Find next month's first day in CET.
  const [y, m] = monthStart.split('-').map(Number);
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  const nextMonthStart: DateString = `${String(nextY).padStart(4, '0')}-${String(nextM).padStart(2, '0')}-01`;
  // Count cells from firstCell up to (but not including) the Monday on/after nextMonthStart.
  const tail = startOfWeekCET(nextMonthStart);
  let count = 0;
  let cursor = firstCell;
  while (cursor < tail) {
    count++;
    cursor = addDaysCET(cursor, 1);
  }
  // Always include the partial week containing the last day of the current month.
  // The previous loop already handles that because startOfWeek of next-month-first is the Monday of the week containing the last day of current month, plus 7 days if the last day is Sunday.
  const monthLabel = new Date(`${monthStart}T12:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  return { firstCell, numCells: count, monthLabel, monthIso };
}

interface Props {
  className?: string;
}

export function ActivityCalendar({ className }: Props) {
  const [settings] = useSettings();
  const today = todayCET();
  const monthIso = today.slice(0, 7);

  const sessions = useLiveQuery(() => db.sessions.toArray(), []);
  const nutrition = useLiveQuery(() => db.nutrition.toArray(), []);
  const stepsAll = useLiveQuery(() => db.steps.toArray(), []);

  const { firstCell, numCells, monthLabel } = useMemo(() => monthRange(today), [today]);

  const cells = useMemo<DayCell[]>(() => {
    const sessByDate = new Map<DateString, number>();
    for (const s of sessions ?? []) {
      if (!s.completedAt) continue;
      const d = s.startedAt.slice(0, 10);
      sessByDate.set(d, (sessByDate.get(d) ?? 0) + 1);
    }
    const nutByDate = new Map<DateString, number>();
    for (const n of nutrition ?? []) nutByDate.set(n.date, (nutByDate.get(n.date) ?? 0) + 1);
    const stepsByDate = new Map<DateString, number>();
    for (const s of stepsAll ?? []) stepsByDate.set(s.date, s.steps);

    const out: DayCell[] = [];
    for (let i = 0; i < numCells; i++) {
      const date = addDaysCET(firstCell, i);
      const inMonth = date.slice(0, 7) === monthIso;
      const workout = (sessByDate.get(date) ?? 0) > 0;
      const nutCount = nutByDate.get(date) ?? 0;
      const steps = stepsByDate.get(date) ?? 0;
      let logged = 0;
      if (workout) logged++;
      if (nutCount > 0) logged++;
      if (steps > 0) logged++;
      const intensity = (workout ? Math.max(2 as ActivityIntensity, Math.min(3, logged) as ActivityIntensity) : (logged as ActivityIntensity));
      out.push({
        date,
        inMonth,
        intensity: intensity as ActivityIntensity,
        isToday: date === today,
        workoutCompleted: workout,
        nutritionEntries: nutCount,
        steps,
      });
    }
    return out;
  }, [sessions, nutrition, stepsAll, firstCell, numCells, monthIso, today]);

  // Stats below the calendar.
  const monthSessions = cells.filter((c) => c.inMonth && c.workoutCompleted).length;
  const streak = useMemo(() => {
    let n = 0;
    for (let i = 0; i < 365; i++) {
      const d = addDaysCET(today, -i);
      const c = cells.find((x) => x.date === d);
      if (!c) {
        // Outside the current calendar window; query maps directly.
        const w = (sessions ?? []).some((s) => s.completedAt && s.startedAt.slice(0, 10) === d);
        const nutCount = (nutrition ?? []).some((x) => x.date === d);
        const stepC = (stepsAll ?? []).some((x) => x.date === d && x.steps > 0);
        const active = w || nutCount || stepC;
        if (active) n++;
        else if (i === 0) continue;
        else break;
        continue;
      }
      const active = c.workoutCompleted || c.nutritionEntries > 0 || c.steps > 0;
      if (active) n++;
      else if (i === 0) continue;
      else break;
    }
    return n;
  }, [cells, sessions, nutrition, stepsAll, today]);

  // Next scheduled workout (today or beyond, Monday-first).
  const nextScheduled = useMemo(() => {
    for (let i = 0; i < 7; i++) {
      const d = addDaysCET(today, i);
      const wk = weekdayKeyCET(d);
      const slot = settings.weeklySchedule[wk];
      if (slot.kind === 'routine') {
        return { date: d, kind: 'routine' as const, routineId: slot.routineId, offset: i };
      }
      if (slot.kind === 'active-recovery' && i > 0) {
        return { date: d, kind: 'active' as const, offset: i };
      }
    }
    return null;
  }, [settings.weeklySchedule, today]);

  const routines = useLiveQuery(() => db.routines.toArray(), []);
  const nextRoutineName = useMemo(() => {
    if (!nextScheduled || nextScheduled.kind !== 'routine') return null;
    return (routines ?? []).find((r) => r.id === nextScheduled.routineId)?.name ?? '(deleted)';
  }, [routines, nextScheduled]);

  const weekdayHeader: ('M' | 'T' | 'W' | 'T' | 'F' | 'S' | 'S')[] = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <aside className={`activity-calendar ${className ?? ''}`}>
      <div className="card">
        <div className="card-head" style={{ marginBottom: 12 }}>
          <div>
            <span className="card-eyebrow">This month</span>
            <h3 className="card-title">{monthLabel}</h3>
          </div>
        </div>

        <div className="cal-weekday-row">
          {weekdayHeader.map((d, i) => (
            <span key={i} className="cal-weekday">{d}</span>
          ))}
        </div>
        <div className="cal-grid">
          {cells.map((c) => (
            <CalendarCell key={c.date} cell={c} />
          ))}
        </div>

        <div className="cal-legend">
          <span className="cal-legend-item">
            <span className="cal-dot intensity-0" /> rest
          </span>
          <span className="cal-legend-item">
            <span className="cal-dot intensity-1" /> log
          </span>
          <span className="cal-legend-item">
            <span className="cal-dot intensity-2" /> active
          </span>
          <span className="cal-legend-item">
            <span className="cal-dot intensity-3" /> full
          </span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="cal-stats">
          <div>
            <div className="cal-stat-num">{streak}</div>
            <div className="cal-stat-label">day streak</div>
          </div>
          <div>
            <div className="cal-stat-num">{monthSessions}</div>
            <div className="cal-stat-label">workouts this month</div>
          </div>
        </div>
        {nextScheduled && (
          <div className="cal-next">
            <span className="card-eyebrow">Next up</span>
            <div className="cal-next-name">
              {nextScheduled.kind === 'routine' ? nextRoutineName : 'Active recovery'}
            </div>
            <div className="cal-next-when">
              {nextScheduled.offset === 0
                ? 'today'
                : nextScheduled.offset === 1
                ? 'tomorrow'
                : new Date(`${nextScheduled.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long' })}
            </div>
          </div>
        )}
        {!nextScheduled && (
          <div className="cal-next">
            <span className="card-eyebrow">Next up</span>
            <div className="cal-next-name muted" style={{ fontSize: 14 }}>
              Nothing scheduled in the next 7 days. <Link to="/settings">Set a weekly schedule →</Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function CalendarCell({ cell }: { cell: DayCell }) {
  const dayNum = Number(cell.date.slice(-2));
  const title = [
    cell.date,
    cell.workoutCompleted ? 'workout' : null,
    cell.nutritionEntries > 0 ? `${cell.nutritionEntries} food entries` : null,
    cell.steps > 0 ? `${cell.steps.toLocaleString()} steps` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const intensityClass = `intensity-${cell.intensity}`;
  return (
    <Link
      to={cell.workoutCompleted ? '/workouts/history' : '/nutrition'}
      className={`cal-cell ${intensityClass}${cell.inMonth ? '' : ' outside'}${cell.isToday ? ' today' : ''}`}
      title={title}
    >
      <span className="cal-cell-num">{dayNum}</span>
    </Link>
  );
}
