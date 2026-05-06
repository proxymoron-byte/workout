import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/db';
import { exerciseStartedCount } from '../../lib/session';
import { formatDuration } from '../../lib/timers';
import { dateStringInCET } from '../../lib/date';

export function History() {
  const [routineFilter, setRoutineFilter] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const sessions = useLiveQuery(async () => {
    const all = await db.sessions.toArray();
    return all
      .filter((s) => !!s.completedAt)
      .filter((s) => (routineFilter ? s.routineId === routineFilter : true))
      .filter((s) => {
        const d = dateStringInCET(new Date(s.startedAt));
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      })
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }, [routineFilter, from, to]);

  const routines = useLiveQuery(() => db.routines.orderBy('name').toArray(), []);

  return (
    <>
      <div className="row" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Routine</label>
          <select value={routineFilter} onChange={(e) => setRoutineFilter(e.target.value)}>
            <option value="">All routines</option>
            {routines?.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {!sessions && <div className="empty">Loading…</div>}
        {sessions && sessions.length === 0 && <div className="empty">No completed sessions yet.</div>}
        {sessions?.map((s) => {
          const date = dateStringInCET(new Date(s.startedAt));
          const started = exerciseStartedCount(s);
          const total = s.exercises.length;
          return (
            <Link
              key={s.id}
              to={`/workouts/history/${s.id}`}
              className="list-row"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div>
                <div className="name">{s.routineNameSnapshot}</div>
                <div className="meta muted">
                  {date} · {formatDuration(s.durationSec ?? 0)}
                  {total > 0 && ` · ${started}/${total} exercises`}
                  {s.activityLabel && ` · ${s.activityLabel}`}
                </div>
              </div>
              <span className="muted">→</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
