import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { db, newId } from '../../lib/db';
import type { WeightEntry } from '../../lib/types';
import { addDaysCET, daysBetweenCET, startOfWeekCET, todayCET } from '../../lib/date';
import { Modal } from '../../components/Modal';
import { useSettings } from '../../lib/settings';

export function Weight() {
  const [settings] = useSettings();
  const [editing, setEditing] = useState<WeightEntry | null>(null);
  const all = useLiveQuery(() => db.weights.toArray(), []);

  const sorted = useMemo(
    () => (all ?? []).slice().sort((a, b) => a.date.localeCompare(b.date)),
    [all],
  );

  const rolling3 = useMemo(() => {
    if (sorted.length === 0) return null;
    const last3 = sorted.slice(-3);
    return last3.reduce((s, e) => s + e.weightKg, 0) / last3.length;
  }, [sorted]);

  const today = todayCET();
  const weekStart = startOfWeekCET(today);
  const weighInsThisWeek = sorted.filter((e) => e.date >= weekStart && e.date <= today).length;

  const onLog = () => {
    setEditing({
      id: newId(),
      date: today,
      weightKg: rolling3 ? Math.round(rolling3 * 10) / 10 : 70,
      createdAt: new Date().toISOString(),
    });
  };

  const onSave = async (e: WeightEntry) => {
    await db.weights.put(e);
    setEditing(null);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this weight entry?')) return;
    await db.weights.delete(id);
  };

  return (
    <>
      <div className="card section">
        <div className="between" style={{ marginBottom: 'var(--space-4)' }}>
          <div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>3-entry rolling average</div>
            <div style={{ fontSize: '2rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {rolling3 !== null ? `${rolling3.toFixed(1)} kg` : '—'}
            </div>
            {settings.goals.weightGoalKg !== undefined && rolling3 !== null && (
              <div className="muted" style={{ fontSize: '0.85rem' }}>
                {(rolling3 - settings.goals.weightGoalKg).toFixed(1).replace(/^-/, '−')} kg from goal ({settings.goals.weightGoalKg} kg)
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={onLog}>Log weight</button>
        </div>
        <div className="muted" style={{ fontSize: '0.85rem' }}>
          You've logged {weighInsThisWeek} of {settings.goals.weighInsPerWeek} this week.
        </div>
      </div>

      <div className="card section">
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Trend</h2>
        {sorted.length < 5 ? (
          <div className="empty">
            {sorted.length === 0
              ? 'Log your first weight to begin.'
              : `Trend chart appears at 5 entries (you have ${sorted.length}).`}
          </div>
        ) : (
          <WeightChart entries={sorted} goal={settings.goals.weightGoalKg} />
        )}
      </div>

      <div className="card section" style={{ padding: 0 }}>
        {sorted.length === 0 && <div className="empty">No entries yet.</div>}
        {sorted
          .slice()
          .reverse()
          .map((e) => (
            <div key={e.id} className="list-row">
              <div>
                <div className="name">{e.weightKg.toFixed(1)} kg</div>
                <div className="meta muted">{e.date}</div>
              </div>
              <div className="actions">
                <button className="btn btn-sm" onClick={() => setEditing(e)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => onDelete(e.id)}>Delete</button>
              </div>
            </div>
          ))}
      </div>

      {editing && <WeightModal entry={editing} onSave={onSave} onClose={() => setEditing(null)} />}
    </>
  );
}

function rollingAverage(entries: WeightEntry[], window: number): { date: string; avg: number }[] {
  const out: { date: string; avg: number }[] = [];
  for (let i = 0; i < entries.length; i++) {
    const slice = entries.slice(Math.max(0, i - window + 1), i + 1);
    const avg = slice.reduce((s, e) => s + e.weightKg, 0) / slice.length;
    out.push({ date: entries[i].date, avg });
  }
  return out;
}

function WeightChart({ entries, goal }: { entries: WeightEntry[]; goal?: number }) {
  const today = todayCET();
  const earliest = addDaysCET(today, -89);
  const visible = entries.filter((e) => e.date >= earliest);
  const points = visible.length > 0 ? visible : entries.slice(-30);

  const xs = points.map((e) => daysBetweenCET(earliest, e.date));
  const minX = 0;
  const maxX = 89;
  const ys = points.map((e) => e.weightKg);
  const minY = Math.min(...ys, ...(goal !== undefined ? [goal] : []));
  const maxY = Math.max(...ys, ...(goal !== undefined ? [goal] : []));
  const yPad = Math.max(0.5, (maxY - minY) * 0.1);
  const yLo = minY - yPad;
  const yHi = maxY + yPad;

  const W = 600;
  const H = 200;
  const PAD = 24;
  const sx = (x: number) => PAD + ((x - minX) / Math.max(1, maxX - minX)) * (W - PAD * 2);
  const sy = (y: number) => H - PAD - ((y - yLo) / Math.max(0.001, yHi - yLo)) * (H - PAD * 2);

  const linePath = points.map((e, i) => `${i === 0 ? 'M' : 'L'} ${sx(xs[i])} ${sy(e.weightKg)}`).join(' ');
  const avgs = rollingAverage(points, 3);
  const avgPath = avgs.map((a, i) => `${i === 0 ? 'M' : 'L'} ${sx(xs[i])} ${sy(a.avg)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Weight trend chart" style={{ width: '100%', height: 'auto' }}>
      <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="var(--color-border)" />
      <line x1={PAD} x2={PAD} y1={PAD} y2={H - PAD} stroke="var(--color-border)" />
      {goal !== undefined && (
        <line
          x1={PAD}
          x2={W - PAD}
          y1={sy(goal)}
          y2={sy(goal)}
          stroke="var(--color-warn)"
          strokeDasharray="4 4"
          strokeWidth="1"
        />
      )}
      <path d={linePath} fill="none" stroke="var(--color-border)" strokeWidth="1.5" />
      <path d={avgPath} fill="none" stroke="var(--color-accent)" strokeWidth="2" />
      {points.map((e, i) => (
        <circle key={e.id} cx={sx(xs[i])} cy={sy(e.weightKg)} r="2.5" fill="var(--color-text)" />
      ))}
      <text x={PAD} y={PAD - 6} fontSize="11" fill="var(--color-text-muted)">{yHi.toFixed(1)} kg</text>
      <text x={PAD} y={H - PAD + 14} fontSize="11" fill="var(--color-text-muted)">{yLo.toFixed(1)} kg</text>
      <text x={W - PAD - 50} y={H - PAD + 14} fontSize="11" fill="var(--color-text-muted)" textAnchor="start">90-day window</text>
    </svg>
  );
}

function WeightModal({
  entry,
  onSave,
  onClose,
}: {
  entry: WeightEntry;
  onSave: (e: WeightEntry) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<WeightEntry>(entry);

  return (
    <Modal
      open
      title={entry.weightKg ? 'Edit weight' : 'Log weight'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!draft.weightKg || draft.weightKg <= 0}
            onClick={() => onSave(draft)}
          >
            Save
          </button>
        </>
      }
    >
      <div className="row">
        <div className="field">
          <label>Weight (kg)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={draft.weightKg}
            onChange={(e) => setDraft({ ...draft, weightKg: Number(e.target.value) })}
            autoFocus
          />
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
        </div>
      </div>
    </Modal>
  );
}
