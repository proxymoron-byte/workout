import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, newId } from '../lib/db';
import type { StepsEntry } from '../lib/types';
import { addDaysCET, lastNDaysCET, todayCET } from '../lib/date';
import { useSettings } from '../lib/settings';
import { Modal } from '../components/Modal';

export function Steps() {
  const [settings] = useSettings();
  const [editing, setEditing] = useState<StepsEntry | null>(null);
  const all = useLiveQuery(() => db.steps.toArray(), []);

  const today = todayCET();
  const todayEntry = useMemo(() => (all ?? []).find((e) => e.date === today), [all, today]);

  const week = useMemo(() => {
    const days = lastNDaysCET(7, today);
    return days.map((d) => ({
      date: d,
      steps: (all ?? []).find((e) => e.date === d)?.steps ?? 0,
    }));
  }, [all, today]);

  const avg30 = useMemo(() => {
    const days = lastNDaysCET(30, today);
    const totals = days.map((d) => (all ?? []).find((e) => e.date === d)?.steps ?? 0);
    return Math.round(totals.reduce((s, n) => s + n, 0) / totals.length);
  }, [all, today]);

  const onLogToday = () => {
    setEditing(
      todayEntry ?? {
        id: newId(),
        date: today,
        steps: 0,
        createdAt: new Date().toISOString(),
      },
    );
  };

  const onSave = async (e: StepsEntry) => {
    await db.steps.put(e);
    setEditing(null);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    await db.steps.delete(id);
  };

  const goal = settings.goals.stepsDaily;
  const todayCount = todayEntry?.steps ?? null;
  const pct = goal > 0 && todayCount !== null ? Math.round((todayCount / goal) * 100) : null;

  return (
    <div className="page">
      <section className="head-row">
        <div>
          <span className="page-eyebrow eyebrow-steps">Steps</span>
          <h1 className="page-title">{todayCount === null ? '—' : todayCount.toLocaleString()}</h1>
          <p className="page-sub">
            {goal > 0 && todayCount !== null ? `${pct}% of ${goal.toLocaleString()} step goal · 30-day avg ${avg30.toLocaleString()}` : 'Log your steps at the end of the day.'}
          </p>
        </div>
        <div className="head-actions">
          <Link to="/" className="ghost-btn">← Dashboard</Link>
          <button className="cta-btn" onClick={onLogToday}>{todayEntry ? 'Edit today' : 'Log steps'}</button>
        </div>
      </section>

      <div className="card section">
        <div className="between" style={{ marginBottom: 'var(--space-3)' }}>
          <div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>Today</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {todayCount === null ? '—' : todayCount.toLocaleString()}
            </div>
            {goal > 0 && (
              <div className="muted" style={{ fontSize: '0.85rem' }}>
                {pct === null ? `Goal: ${goal.toLocaleString()}` : `${pct}% of ${goal.toLocaleString()} goal`}
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={onLogToday}>
            {todayEntry ? 'Edit today' : 'Log steps'}
          </button>
        </div>
        <div className="muted" style={{ fontSize: '0.85rem' }}>30-day average: {avg30.toLocaleString()} steps</div>
      </div>

      <div className="card section">
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Last 7 days</h2>
        <WeekStrip data={week} goal={goal} today={today} />
      </div>

      <div className="card section" style={{ padding: 0 }}>
        {(all ?? [])
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 30)
          .map((e) => (
            <div key={e.id} className="list-row">
              <div>
                <div className="name">{e.steps.toLocaleString()} steps</div>
                <div className="meta muted">{e.date}</div>
              </div>
              <div className="actions">
                <button className="btn btn-sm" onClick={() => setEditing(e)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => onDelete(e.id)}>Delete</button>
              </div>
            </div>
          ))}
        {(all ?? []).length === 0 && <div className="empty">No entries yet.</div>}
      </div>

      {editing && <StepsModal entry={editing} onSave={onSave} onClose={() => setEditing(null)} />}
    </div>
  );
}

function WeekStrip({
  data,
  goal,
  today,
}: {
  data: { date: string; steps: number }[];
  goal: number;
  today: string;
}) {
  const max = Math.max(goal * 1.2, ...data.map((d) => d.steps));
  const goalPct = max > 0 ? (goal / max) * 100 : 0;
  return (
    <div>
      <div className="strip">
        {goal > 0 && <div className="strip-goal-line" style={{ bottom: `${goalPct}%` }} title={`Goal: ${goal.toLocaleString()}`} />}
        {data.map((d) => {
          const h = max > 0 ? Math.min(100, (d.steps / max) * 100) : 0;
          const dayLabel = new Date(`${d.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
          return (
            <div key={d.date} className={`strip-bar-wrap${d.date === today ? ' selected' : ''}`}>
              <div className="strip-bar" style={{ height: `${h}%` }} title={`${d.date}: ${d.steps.toLocaleString()} steps`} />
              <div className="strip-day-label muted">{dayLabel.slice(0, 1)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepsModal({
  entry,
  onSave,
  onClose,
}: {
  entry: StepsEntry;
  onSave: (e: StepsEntry) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<StepsEntry>(entry);
  const today = todayCET();

  return (
    <Modal
      open
      title={entry.steps > 0 ? 'Edit steps' : 'Log steps'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(draft)} disabled={draft.steps < 0}>
            Save
          </button>
        </>
      }
    >
      <div className="row">
        <div className="field">
          <label>Steps</label>
          <input
            type="number"
            min={0}
            value={draft.steps}
            onChange={(e) => setDraft({ ...draft, steps: Number(e.target.value) })}
            autoFocus
          />
        </div>
        <div className="field">
          <label>Date</label>
          <input
            type="date"
            value={draft.date}
            max={today}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          />
        </div>
      </div>
      <p className="muted" style={{ fontSize: '0.85rem', marginTop: 'var(--space-2)' }}>
        Read the count from your phone at end of day, then enter it here.
      </p>
      <div className="row" style={{ marginTop: 'var(--space-2)' }}>
        <button className="btn btn-sm" onClick={() => setDraft({ ...draft, date: today })}>
          Set to today ({today})
        </button>
        <button className="btn btn-sm" onClick={() => setDraft({ ...draft, date: addDaysCET(today, -1) })}>
          Set to yesterday
        </button>
      </div>
    </Modal>
  );
}
