import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { db } from '../lib/db';
import { useSettings } from '../lib/settings';
import { addDaysCET, startOfWeekCET, todayCET, weekdayKeyCET, type WeekdayKey } from '../lib/date';
import { sortViews, viewFor } from '../lib/checkups';
import { getInProgressSession, startSession } from '../lib/session';
import type { Routine, ScheduleSlot } from '../lib/types';
import { DriftBar } from '../components/DriftBar';

export function Dashboard() {
  const [settings] = useSettings();
  const today = todayCET();
  const todayWeekday = weekdayKeyCET(today);

  const nutrition = useLiveQuery(() => db.nutrition.toArray(), []);
  const stepsAll = useLiveQuery(() => db.steps.toArray(), []);
  const sessionsAll = useLiveQuery(() => db.sessions.toArray(), []);
  const checkups = useLiveQuery(() => db.checkups.toArray(), []);
  const routines = useLiveQuery(() => db.routines.toArray(), []);

  const todayKcal = useMemo(
    () => (nutrition ?? []).filter((e) => e.date === today).reduce((s, e) => s + e.kcal, 0),
    [nutrition, today],
  );
  const todayProtein = useMemo(
    () => (nutrition ?? []).filter((e) => e.date === today).reduce((s, e) => s + e.proteinG, 0),
    [nutrition, today],
  );
  const todaySteps = useMemo(
    () => (stepsAll ?? []).find((e) => e.date === today)?.steps ?? null,
    [stepsAll, today],
  );

  const weekStart = startOfWeekCET(today);
  const weekDays = useMemo(() => {
    const days: { date: string; key: WeekdayKey }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDaysCET(weekStart, i);
      days.push({ date: d, key: weekdayKeyCET(d) });
    }
    return days;
  }, [weekStart]);

  const completedSessionsThisWeek = useMemo(
    () =>
      (sessionsAll ?? []).filter((s) => {
        if (!s.completedAt) return false;
        const d = s.startedAt.slice(0, 10);
        return d >= weekStart && d <= today;
      }),
    [sessionsAll, weekStart, today],
  );

  const lastSessionAny = useMemo(() => {
    const completed = (sessionsAll ?? []).filter((s) => s.completedAt);
    return completed.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null;
  }, [sessionsAll]);

  const checkupViews = useMemo(() => sortViews((checkups ?? []).map((c) => viewFor(c, today))), [checkups, today]);
  const dashboardCheckups = checkupViews.slice(0, 4);

  const todaysSlot = settings.weeklySchedule[todayWeekday];
  const todaysRoutine = useMemo<Routine | null>(() => {
    if (todaysSlot.kind !== 'routine') return null;
    return (routines ?? []).find((r) => r.id === todaysSlot.routineId) ?? null;
  }, [todaysSlot, routines]);

  const hasAnyData = (nutrition?.length ?? 0) > 0 || (stepsAll?.length ?? 0) > 0 || completedSessionsThisWeek.length > 0;

  const greeting = settings.displayName ? `Hello, ${settings.displayName}.` : 'Hello.';
  const todayPretty = new Date(`${today}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="page">
      <header className="section">
        <h1>{greeting}</h1>
        <p className="muted">
          {todayPretty} · {completedSessionsThisWeek.length} workout{completedSessionsThisWeek.length === 1 ? '' : 's'} this week
        </p>
      </header>

      {!hasAnyData && (
        <div className="card section" style={{ background: 'var(--color-info-soft)', borderColor: 'var(--color-info)' }}>
          <h2 style={{ marginBottom: 'var(--space-3)' }}>Get started</h2>
          <ol style={{ margin: 0, paddingLeft: '1.2em' }}>
            <li>
              <Link to="/settings">Set your daily goals</Link> (calories, protein, steps, weekly workouts).
            </li>
            <li>
              <Link to="/workouts">Browse routines</Link> and assign them to days of the week in settings.
            </li>
            <li>
              <Link to="/nutrition">Log your first meal</Link> — autocomplete kicks in after a few entries.
            </li>
          </ol>
        </div>
      )}

      <section className="metric-grid section">
        <MetricCard
          to="/nutrition"
          label="Calories"
          value={Math.round(todayKcal).toLocaleString()}
          unit="kcal"
          goal={settings.goals.kcalDaily}
          actual={todayKcal}
        />
        <MetricCard
          to="/nutrition"
          label="Protein"
          value={Math.round(todayProtein).toLocaleString()}
          unit="g"
          goal={settings.goals.proteinDaily}
          actual={todayProtein}
        />
        <MetricCard
          to="/steps"
          label="Steps"
          value={todaySteps === null ? '—' : todaySteps.toLocaleString()}
          unit=""
          goal={settings.goals.stepsDaily}
          actual={todaySteps ?? null}
          subline={todaySteps === null ? 'Tap to log' : undefined}
        />
      </section>

      <section className="section">
        <TodaysWorkoutCard
          slot={todaysSlot}
          routine={todaysRoutine}
          lastSessionDate={lastSessionAny?.startedAt.slice(0, 10) ?? null}
        />
      </section>

      <section className="bottom-grid section">
        <WeekTrainingCard sessions={completedSessionsThisWeek} weekDays={weekDays} />
        <CheckupsCard items={dashboardCheckups} />
      </section>

      <DriftBarSlot />
    </main>
  );
}

function MetricCard({
  to,
  label,
  value,
  unit,
  goal,
  actual,
  subline,
}: {
  to: string;
  label: string;
  value: string;
  unit: string;
  goal: number;
  actual: number | null;
  subline?: string;
}) {
  const pct = goal > 0 && actual !== null ? Math.round((actual / goal) * 100) : null;
  const computed = subline ?? (pct !== null ? `${pct}% of ${goal.toLocaleString()} ${unit}`.trim() : goal > 0 ? `Goal: ${goal.toLocaleString()} ${unit}`.trim() : 'No goal set');
  return (
    <Link to={to} className="metric-card">
      <div className="muted" style={{ fontSize: '0.85rem' }}>{label}</div>
      <div className="metric-value">
        {value}
        {unit && <span className="muted" style={{ fontSize: '1rem', fontWeight: 400 }}> {unit}</span>}
      </div>
      <div className="muted" style={{ fontSize: '0.85rem' }}>{computed}</div>
    </Link>
  );
}

function TodaysWorkoutCard({
  slot,
  routine,
  lastSessionDate,
}: {
  slot: ScheduleSlot;
  routine: Routine | null;
  lastSessionDate: string | null;
}) {
  const navigate = useNavigate();
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const exMap = useMemo(() => new Map((exercises ?? []).map((e) => [e.id, e.name])), [exercises]);

  const onStart = async () => {
    if (!routine) return;
    const inProgress = await getInProgressSession();
    if (inProgress) {
      navigate(`/session/${inProgress.id}`);
      return;
    }
    const s = await startSession(routine);
    navigate(`/session/${s.id}`);
  };

  if (slot.kind === 'rest') {
    const lastLabel = lastSessionDate ? new Date(`${lastSessionDate}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long' }) : null;
    return (
      <div className="card today-workout-card">
        <div className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</div>
        <h2 style={{ marginTop: 'var(--space-1)' }}>Rest day</h2>
        <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
          {lastLabel ? `Last session was ${lastLabel}.` : 'No completed sessions yet.'} Take it easy.
        </p>
        <p className="muted" style={{ fontSize: '0.85rem', marginTop: 'var(--space-3)' }}>
          Change today's plan in <Link to="/settings">Settings → Weekly schedule</Link>.
        </p>
      </div>
    );
  }

  if (slot.kind === 'active-recovery') {
    return (
      <div className="card today-workout-card">
        <div className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</div>
        <h2 style={{ marginTop: 'var(--space-1)' }}>Active recovery</h2>
        <p className="muted" style={{ marginTop: 'var(--space-2)' }}>Walk, skate, mobility — your call.</p>
        <p className="muted" style={{ fontSize: '0.85rem', marginTop: 'var(--space-3)' }}>
          Pick a recovery routine in <Link to="/workouts">Workouts</Link> and start it from there.
        </p>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="card today-workout-card">
        <div className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</div>
        <h2 style={{ marginTop: 'var(--space-1)' }}>No routine assigned</h2>
        <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
          The routine assigned to today no longer exists. Pick a new one in <Link to="/settings">Settings → Weekly schedule</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="card today-workout-card">
      <div className="between" style={{ marginBottom: 'var(--space-3)' }}>
        <div>
          <div className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</div>
          <h2 style={{ marginTop: 'var(--space-1)' }}>{routine.name}</h2>
          <div className="muted" style={{ fontSize: '0.9rem', marginTop: 'var(--space-1)' }}>
            ~{routine.estimatedMinutes} min · {routine.exercises.length} exercise{routine.exercises.length === 1 ? '' : 's'}
            {routine.kind === 'rowing-intervals' && routine.rowingBlock && ` · ${routine.rowingBlock.intervals}× rowing`}
          </div>
        </div>
        <button className="btn btn-primary" onClick={onStart}>Start session</button>
      </div>
      {routine.exercises.length > 0 && (
        <ul className="today-exercise-list">
          {routine.exercises.map((re, i) => (
            <li key={`${re.exerciseId}-${i}`}>
              <span>{exMap.get(re.exerciseId) ?? '(deleted)'}</span>
              <span className="muted" style={{ fontSize: '0.85rem' }}>{re.sets} × {re.reps}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WeekTrainingCard({
  sessions,
  weekDays,
}: {
  sessions: { startedAt: string; durationSec?: number }[];
  weekDays: { date: string; key: WeekdayKey }[];
}) {
  const perDay = weekDays.map((d) => {
    const minutes = sessions
      .filter((s) => s.startedAt.slice(0, 10) === d.date)
      .reduce((sum, s) => sum + Math.round((s.durationSec ?? 0) / 60), 0);
    return { ...d, minutes };
  });
  const max = Math.max(60, ...perDay.map((d) => d.minutes));
  const totalMin = perDay.reduce((s, d) => s + d.minutes, 0);
  const avgMin = sessions.length > 0 ? Math.round(totalMin / sessions.length) : 0;

  return (
    <Link to="/workouts/history" className="card metric-card-secondary">
      <div className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>This week</div>
      <div className="metric-value" style={{ fontSize: '1.6rem' }}>
        {sessions.length} session{sessions.length === 1 ? '' : 's'}
      </div>
      <div className="muted" style={{ fontSize: '0.85rem', marginBottom: 'var(--space-3)' }}>
        Avg {avgMin} min · {totalMin} min total
      </div>
      <div className="strip" style={{ height: 60 }}>
        {perDay.map((d) => {
          const h = max > 0 ? (d.minutes / max) * 100 : 0;
          return (
            <div key={d.date} className="strip-bar-wrap">
              <div className="strip-bar" style={{ height: `${h}%`, background: d.minutes > 0 ? 'var(--color-accent)' : undefined }} title={`${d.date}: ${d.minutes} min`} />
              <div className="strip-day-label muted">{d.key.slice(0, 1).toUpperCase()}</div>
            </div>
          );
        })}
      </div>
    </Link>
  );
}

function CheckupsCard({ items }: { items: ReturnType<typeof viewFor>[] }) {
  return (
    <Link to="/checkups" className="card metric-card-secondary">
      <div className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Checkups</div>
      {items.length === 0 ? (
        <div className="empty" style={{ padding: 'var(--space-4) 0' }}>No checkups configured.</div>
      ) : (
        <ul className="checkup-mini-list">
          {items.map((v) => (
            <li key={v.checkup.id}>
              <span>{v.checkup.name}</span>
              <span className={`pill checkup-${v.status}`}>{statusLabel(v.status)}</span>
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}

function statusLabel(s: ReturnType<typeof viewFor>['status']): string {
  switch (s) {
    case 'overdue':
      return 'Overdue';
    case 'due-soon':
      return 'Due soon';
    case 'up-to-date':
      return 'Up to date';
    case 'schedule':
      return 'Schedule';
  }
}

function DriftBarSlot() {
  return <DriftBar />;
}
