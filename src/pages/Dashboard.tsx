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
import { ActivityCalendar } from '../components/ActivityCalendar';
import { ArtBand, ArtDrop, ArtFlame, ArtFootprint, ArtMoon } from '../components/Illustrations';
import { IconChevronRight, IconClock, IconExternal, IconPlay, IconStethoscope } from '../components/Icons';

export function Dashboard() {
  const [settings] = useSettings();
  const today = todayCET();
  const todayWeekday = weekdayKeyCET(today);

  const nutrition = useLiveQuery(() => db.nutrition.toArray(), []);
  const stepsAll = useLiveQuery(() => db.steps.toArray(), []);
  const sessionsAll = useLiveQuery(() => db.sessions.toArray(), []);
  const checkups = useLiveQuery(() => db.checkups.toArray(), []);
  const routines = useLiveQuery(() => db.routines.toArray(), []);
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const exMap = useMemo(() => new Map((exercises ?? []).map((e) => [e.id, e.name])), [exercises]);

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

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();
  const name = settings.displayName || 'there';

  const todayPretty = new Date(`${today}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const kcalGoal = settings.goals.kcalDaily;
  const proteinGoal = settings.goals.proteinDaily;
  const stepsGoal = settings.goals.stepsDaily;
  const kcalPct = kcalGoal > 0 ? Math.round((todayKcal / kcalGoal) * 100) : null;
  const proteinPct = proteinGoal > 0 ? Math.round((todayProtein / proteinGoal) * 100) : null;
  const stepsPct = stepsGoal > 0 && todaySteps !== null ? Math.round((todaySteps / stepsGoal) * 100) : null;

  return (
    <div className="page page-dashboard">
      <section className="greeting">
        <div className="greeting-text">
          <h1 className="greeting-title">
            <span className="greet-eyebrow">{greeting},</span>
            <span className="greet-name">{name}</span>
          </h1>
          <p className="greeting-sub">
            {todayPretty} · {' '}
            <strong>{completedSessionsThisWeek.length}</strong>{' '}
            workout{completedSessionsThisWeek.length === 1 ? '' : 's'} this week.
          </p>
        </div>
        <div className="greeting-actions">
          <Link className="pill-btn" to="/nutrition">Quick log</Link>
          <Link className="pill-btn" to="/workouts/generate">Generate routine</Link>
          {todaysRoutine && (
            <button
              className="pill-btn pill-btn-dark"
              onClick={async () => {
                const inProgress = await getInProgressSession();
                if (inProgress) {
                  window.location.assign(`${import.meta.env.BASE_URL}session/${inProgress.id}`);
                  return;
                }
                const s = await startSession(todaysRoutine);
                window.location.assign(`${import.meta.env.BASE_URL}session/${s.id}`);
              }}
            >
              <IconPlay size={14} stroke={1.8} /> Start workout
            </button>
          )}
        </div>
      </section>

      <div className="dash-body">
        <div className="dash-main">
      <section className="metrics">
        <MetricCard
          to="/nutrition"
          tone="kcal"
          label="Calories"
          value={Math.round(todayKcal).toLocaleString()}
          unit={kcalGoal > 0 ? `/ ${kcalGoal.toLocaleString()} kcal` : 'kcal'}
          foot={kcalPct !== null
            ? <><strong>{kcalPct}%</strong> of goal · {Math.max(0, kcalGoal - todayKcal).toLocaleString()} kcal left</>
            : 'No goal set'}
          art={<ArtFlame size={120} />}
        />
        <MetricCard
          to="/nutrition"
          tone="protein"
          label="Protein"
          value={Math.round(todayProtein).toString()}
          unit={proteinGoal > 0 ? `/ ${proteinGoal} g` : 'g'}
          foot={proteinPct !== null
            ? <><strong>{proteinPct}%</strong> of goal · {Math.max(0, proteinGoal - todayProtein)} g to go</>
            : 'No goal set'}
          art={<ArtDrop size={110} />}
        />
        <MetricCard
          to="/steps"
          tone="steps"
          label="Steps"
          value={todaySteps === null ? '—' : todaySteps.toLocaleString()}
          unit={stepsGoal > 0 ? `/ ${stepsGoal.toLocaleString()}` : ''}
          foot={stepsPct !== null
            ? <><strong>{stepsPct}%</strong> of goal · log at end of day</>
            : todaySteps === null ? 'Tap to log' : 'No goal set'}
          art={<ArtFootprint size={110} />}
        />
        <MetricCard
          to="/body/cycle"
          tone="cycle"
          label="Cycle"
          value="Body"
          unit="weight + cycle"
          foot="Open Body section"
          art={<ArtMoon size={110} />}
        />
      </section>

      <FeaturedWorkoutCard slot={todaysSlot} routine={todaysRoutine} exMap={exMap} lastSessionDate={lastSessionAny?.startedAt.slice(0, 10) ?? null} />

      <section className="bottom-row">
        <TrainingCard sessions={completedSessionsThisWeek} weekDays={weekDays} weeklyGoal={settings.goals.weeklyWorkouts} today={today} />
        <CheckupsCard items={dashboardCheckups} />
      </section>
        </div>
        <ActivityCalendar className="dash-rail" />
      </div>

      <DriftBar />
    </div>
  );
}

function MetricCard({
  to,
  tone,
  label,
  value,
  unit,
  foot,
  art,
}: {
  to: string;
  tone: 'kcal' | 'protein' | 'steps' | 'cycle';
  label: string;
  value: string;
  unit: string;
  foot: React.ReactNode;
  art: React.ReactNode;
}) {
  return (
    <Link to={to} className={`metric metric-${tone}`}>
      <div className="metric-art" aria-hidden>{art}</div>
      <div className="metric-head">
        <span className="metric-label">{label}</span>
        <span className="metric-arrow"><IconChevronRight size={14} stroke={1.6} /></span>
      </div>
      <div className="metric-value">
        <span className="metric-num">{value}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      <div className="metric-foot">{foot}</div>
    </Link>
  );
}

function FeaturedWorkoutCard({
  slot,
  routine,
  exMap,
  lastSessionDate,
}: {
  slot: ScheduleSlot;
  routine: Routine | null;
  exMap: Map<string, string>;
  lastSessionDate: string | null;
}) {
  const navigate = useNavigate();

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
    const lastLabel = lastSessionDate
      ? new Date(`${lastSessionDate}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long' })
      : null;
    return (
      <section className="featured">
        <div className="featured-art" aria-hidden><ArtBand size={300} /></div>
        <div className="featured-head">
          <div>
            <span className="featured-eyebrow">Today · rest day</span>
            <h2 className="featured-title">Take it easy.</h2>
            <div className="featured-meta">
              <span>{lastLabel ? `Last session ${lastLabel}` : 'No completed sessions yet'}</span>
            </div>
          </div>
          <div className="featured-actions">
            <Link to="/settings" className="ghost-btn">Edit schedule</Link>
          </div>
        </div>
      </section>
    );
  }

  if (slot.kind === 'active-recovery' || !routine) {
    return (
      <section className="featured">
        <div className="featured-art" aria-hidden><ArtBand size={300} /></div>
        <div className="featured-head">
          <div>
            <span className="featured-eyebrow">Today · active recovery</span>
            <h2 className="featured-title">{slot.kind === 'active-recovery' ? 'Walk, skate, mobility' : 'No routine assigned'}</h2>
            <div className="featured-meta">
              <span>Pick something light — your call.</span>
            </div>
          </div>
          <div className="featured-actions">
            <Link to="/workouts" className="ghost-btn">Choose routine</Link>
            <Link to="/settings" className="cta-btn">Edit schedule</Link>
          </div>
        </div>
      </section>
    );
  }

  const dayName = new Date().toLocaleDateString(undefined, { weekday: 'long' });

  return (
    <section className="featured">
      <div className="featured-art" aria-hidden><ArtBand size={300} /></div>
      <div className="featured-head">
        <div>
          <span className="featured-eyebrow">Today's workout · {dayName}</span>
          <h2 className="featured-title">{routine.name}</h2>
          <div className="featured-meta">
            <span><IconClock size={14} stroke={1.7} /> ~{routine.estimatedMinutes} min</span>
            <span className="dot">·</span>
            <span>{routine.exercises.length} exercise{routine.exercises.length === 1 ? '' : 's'}</span>
            {routine.kind === 'rowing-intervals' && routine.rowingBlock && (
              <>
                <span className="dot">·</span>
                <span>{routine.rowingBlock.intervals}× rowing</span>
              </>
            )}
          </div>
        </div>
        <div className="featured-actions">
          <Link to="/workouts" className="ghost-btn">Swap routine</Link>
          <button className="cta-btn" onClick={onStart}>
            <IconPlay size={14} stroke={1.9} /> Start session
          </button>
        </div>
      </div>

      {routine.exercises.length > 0 && (
        <ol className="exercise-list">
          {routine.exercises.map((re, i) => {
            const name = exMap.get(re.exerciseId) ?? '(deleted)';
            return (
              <li key={`${re.exerciseId}-${i}`} className="exercise-row">
                <span className="ex-num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className="ex-name">{name}</div>
                </div>
                <span className="muscle-chip">workout</span>
                <a className="form-link" href="#" onClick={(e) => e.preventDefault()} aria-disabled>
                  <IconExternal size={12} stroke={1.7} /> form
                </a>
                <span className="ex-sets">
                  <strong>{re.sets}</strong>×<span className="ex-reps">{re.reps}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function TrainingCard({
  sessions,
  weekDays,
  weeklyGoal,
  today,
}: {
  sessions: { startedAt: string; durationSec?: number }[];
  weekDays: { date: string; key: WeekdayKey }[];
  weeklyGoal: number;
  today: string;
}) {
  const perDay = weekDays.map((d) => {
    const minutes = sessions
      .filter((s) => s.startedAt.slice(0, 10) === d.date)
      .reduce((sum, s) => sum + Math.round((s.durationSec ?? 0) / 60), 0);
    const isToday = d.date === today;
    const isFuture = d.date > today;
    let kind: 'workout' | 'rest' | 'today' | 'future' = 'workout';
    if (isFuture) kind = 'future';
    else if (isToday && minutes === 0) kind = 'today';
    else if (minutes === 0) kind = 'rest';
    return { ...d, minutes, kind };
  });
  const max = Math.max(60, ...perDay.map((d) => d.minutes));
  const totalMin = perDay.reduce((s, d) => s + d.minutes, 0);
  const avgMin = sessions.length > 0 ? Math.round(totalMin / sessions.length) : 0;

  return (
    <Link to="/workouts/history" className="card-link-wrap">
      <div className="card-head">
        <div>
          <span className="card-eyebrow">This week</span>
          <h3 className="card-title">Training</h3>
        </div>
        <span className="big-num">{sessions.length}<span className="big-num-of">/{weeklyGoal}</span></span>
      </div>
      <div className="train-bars">
        {perDay.map((d) => {
          const h = (d.minutes / max) * 100;
          const dayLabel = d.key.charAt(0).toUpperCase();
          return (
            <div key={d.date} className={`train-bar-col col-${d.kind}`}>
              <div className="train-bar-track">
                <div className="train-bar-fill" style={{ height: `${h}%` }} />
                {d.kind === 'today' && <span className="train-bar-today">today</span>}
              </div>
              <span className="train-bar-day">{dayLabel}</span>
            </div>
          );
        })}
      </div>
      <div className="card-foot">
        <span><strong>{totalMin} min</strong> total · avg <strong>{avgMin} min</strong></span>
        <span className="card-link">View history <IconChevronRight size={12} stroke={1.7} /></span>
      </div>
    </Link>
  );
}

function CheckupsCard({ items }: { items: ReturnType<typeof viewFor>[] }) {
  return (
    <Link to="/checkups" className="card-link-wrap">
      <div className="card-head">
        <div>
          <span className="card-eyebrow">Checkups</span>
          <h3 className="card-title">Preventive</h3>
        </div>
        <span className="dot-warn"><IconStethoscope size={16} stroke={1.6} /></span>
      </div>
      <ul className="checkup-list">
        {items.length === 0 && (
          <li style={{ padding: '10px 0', color: 'var(--ink-mute)', fontSize: 13 }}>No checkups configured.</li>
        )}
        {items.map((v) => (
          <li key={v.checkup.id} className="checkup-row">
            <span className={`status-dot s-${v.status}`} />
            <span className="checkup-name">{v.checkup.name}</span>
            <span className="checkup-due">
              {v.daysToDue === null
                ? 'never logged'
                : v.daysToDue < 0
                ? `${-v.daysToDue}d overdue`
                : v.daysToDue === 0
                ? 'due today'
                : `in ${v.daysToDue}d`}
            </span>
          </li>
        ))}
      </ul>
      <div className="card-foot">
        <span></span>
        <span className="card-link">All checkups <IconChevronRight size={12} stroke={1.7} /></span>
      </div>
    </Link>
  );
}
