import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { db, newId } from '../../lib/db';
import type { WeightEntry } from '../../lib/types';
import { addDaysCET, daysBetweenCET, startOfWeekCET, todayCET } from '../../lib/date';
import { useSettings } from '../../lib/settings';
import { Modal } from '../../components/Modal';

export function Weight() {
  const [settings] = useSettings();
  const all = useLiveQuery(() => db.weights.toArray(), []);
  const [editing, setEditing] = useState<WeightEntry | null>(null);

  const sorted = useMemo(() => (all ?? []).slice().sort((a, b) => a.date.localeCompare(b.date)), [all]);
  const today = todayCET();
  const weekStart = startOfWeekCET(today);
  const thisWeekCount = sorted.filter((e) => e.date >= weekStart && e.date <= today).length;
  const target = settings.goals.weighInsPerWeek;
  const last3 = sorted.slice(-3);
  const rollingAvg = last3.length > 0 ? last3.reduce((s, e) => s + e.weightKg, 0) / last3.length : null;

  const onLog = () => {
    setEditing({
      id: newId(),
      date: today,
      weightKg: rollingAvg ?? 70,
      createdAt: new Date().toISOString(),
    });
  };

  const onSave = async (e: WeightEntry) => {
    await db.weights.put(e);
    setEditing(null);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    await db.weights.delete(id);
  };

  const goalKg = settings.goals.weightGoalKg;

  return (
    <>
      <div className="card section">
        <div className="between" style={{ marginBottom: 'var(--space-3)' }}>
          <div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>3-entry rolling average</div>
            <div className="big-time" style={{ fontSize: '2.6rem' }}>
              {rollingAvg !== null ? rollingAvg.toFixed(1) : '—'}
              <span className="muted" style={{ fontSize: '1rem', fontWeight: 400 }}> kg</span>
            </div>
            {goalKg !== undefined && rollingAvg !== null && (
              <div className="muted" style={{ fontSize: '0.85rem' }}>
                {(rollingAvg - goalKg).toFixed(1)} kg from {goalKg} kg goal
              </div>
            )}
            <div className="muted" style={{ fontSize: '0.85rem', marginTop: 'var(--space-2)' }}>
              You've logged {thisWeekCount} of {target} this week
            </div>
          </div>
          <button className="btn btn-primary" onClick={onLog}>Log weight</button>
        </div>
      </div>

      {sorted.length < 5 ? (
        <div className="card empty section">
          {sorted.length === 0 && 'Log your first weight to get started.'}
          {sorted.length === 1 && '1 entry logged. Log 2 more to see a rolling average.'}
          {sorted.length === 2 && '2 entries logged. Log 1 more to see a rolling average.'}
          {sorted.length === 3 && 'Rolling average ready. Log 2 more to see the 90-day trend chart.'}
          {sorted.length === 4 && 'Rolling average ready. Log 1 more to see the 90-day trend chart.'}
        </div>
      ) : (
        <div className="card section">
          <h2 style={{ marginBottom: 'var(--space-4)' }}>90-day trend</h2>
          <WeightChart entries={sorted} goalKg={goalKg} today={today} />
        </div>
      )}

      <div className="card section" style={{ padding: 0 }}>
        {sorted.length === 0 && <div className="empty">No entries yet.</div>}
        {sorted
          .slice()
          .reverse()
          .slice(0, 30)
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

function rollingAverages(entries: WeightEntry[]): { date: string; avg: number }[] {
  const out: { date: string; avg: number }[] = [];
  for (let i = 0; i < entries.length; i++) {
    const window = entries.slice(Math.max(0, i - 2), i + 1);
    const avg = window.reduce((s, e) => s + e.weightKg, 0) / window.length;
    out.push({ date: entries[i].date, avg });
  }
  return out;
}

function WeightChart({
  entries,
  goalKg,
  today,
}: {
  entries: WeightEntry[];
  goalKg: number | undefined;
  today: string;
}) {
  const fromDate = addDaysCET(today, -89);
  const visible = entries.filter((e) => e.date >= fromDate);
  if (visible.length < 2) {
    return <div className="empty">Not enough recent entries (need 2+ in the last 90 days).</div>;
  }
  const rolls = rollingAverages(visible);
  const all = [...visible.map((e) => e.weightKg), ...rolls.map((r) => r.avg), ...(goalKg !== undefined ? [goalKg] : [])];
  const min = Math.min(...all) - 0.5;
  const max = Math.max(...all) + 0.5;
  const W = 100;
  const H = 40;
  const xFor = (date: string) => {
    const offset = daysBetweenCET(fromDate, date);
    return (offset / 89) * W;
  };
  const yFor = (kg: number) => H - ((kg - min) / (max - min)) * H;

  const rawPath = visible.map((e, i) => `${i === 0 ? 'M' : 'L'}${xFor(e.date).toFixed(2)},${yFor(e.weightKg).toFixed(2)}`).join(' ');
  const rollPath = rolls.map((r, i) => `${i === 0 ? 'M' : 'L'}${xFor(r.date).toFixed(2)},${yFor(r.avg).toFixed(2)}`).join(' ');
  const goalY = goalKg !== undefined ? yFor(goalKg) : null;

  return (
    <svg viewBox={`-2 -2 ${W + 4} ${H + 4}`} className="weight-chart" preserveAspectRatio="none" role="img" aria-label="Weight trend">
      {goalY !== null && (
        <line x1={0} x2={W} y1={goalY} y2={goalY} stroke="var(--color-warn)" strokeDasharray="2,2" strokeWidth="0.4" />
      )}
      <path d={rawPath} fill="none" stroke="var(--color-text-faint)" strokeWidth="0.4" />
      <path d={rollPath} fill="none" stroke="var(--color-accent)" strokeWidth="0.8" strokeLinejoin="round" />
      {visible.map((e) => (
        <circle key={e.id} cx={xFor(e.date)} cy={yFor(e.weightKg)} r="0.6" fill="var(--color-text-faint)" />
      ))}
      <text x={0} y={H + 3} fontSize="2.5" fill="var(--color-text-muted)">{fromDate}</text>
      <text x={W} y={H + 3} fontSize="2.5" fill="var(--color-text-muted)" textAnchor="end">{today}</text>
    </svg>
  );
}

function WeightModal({ entry, onSave, onClose }: { entry: WeightEntry; onSave: (e: WeightEntry) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<WeightEntry>(entry);
  return (
    <Modal
      open
      title={entry.weightKg > 0 ? 'Edit weight' : 'Log weight'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={draft.weightKg <= 0} onClick={() => onSave(draft)}>
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
            min={20}
            max={250}
            step={0.1}
            value={draft.weightKg}
            onChange={(e) => setDraft({ ...draft, weightKg: Number(e.target.value) })}
            autoFocus
          />
        </div>
        <div className="field">
          <label>Date</label>
          <input
            type="date"
            value={draft.date}
            max={todayCET()}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  );
}
