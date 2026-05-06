import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate } from 'react-router-dom';
import { db, newId } from '../../lib/db';
import type { Routine } from '../../lib/types';

function lastPerformed(routineId: string, sessions: { routineId: string; startedAt: string }[] | undefined): string | null {
  if (!sessions) return null;
  const matching = sessions.filter((s) => s.routineId === routineId).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return matching[0]?.startedAt ?? null;
}

function formatLastPerformed(iso: string | null): string {
  if (!iso) return 'never performed';
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  return date.toLocaleDateString();
}

export function Routines() {
  const navigate = useNavigate();
  const routines = useLiveQuery(() => db.routines.orderBy('name').toArray(), []);
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);

  const onNew = async () => {
    const r: Routine = {
      id: newId(),
      name: 'New routine',
      kind: 'standard',
      exercises: [],
      defaultRestSec: 45,
      estimatedMinutes: 20,
    };
    await db.routines.add(r);
    navigate(`/workouts/routines/${r.id}`);
  };

  const onDuplicate = async (r: Routine) => {
    const copy: Routine = { ...r, id: newId(), name: `${r.name} (copy)` };
    await db.routines.add(copy);
    navigate(`/workouts/routines/${copy.id}`);
  };

  const onDelete = async (r: Routine) => {
    if (!confirm(`Delete "${r.name}"?`)) return;
    await db.routines.delete(r.id);
  };

  return (
    <>
      <div className="between" style={{ marginBottom: 'var(--space-4)' }}>
        <p className="muted" style={{ margin: 0 }}>{routines?.length ?? 0} routines.</p>
        <button className="btn btn-primary" onClick={onNew}>+ New routine</button>
      </div>
      {!routines && <div className="empty">Loading…</div>}
      {routines && routines.length === 0 && <div className="card empty">No routines yet.</div>}
      {routines && routines.length > 0 && (
        <div className="routine-grid">
          {routines.map((r) => {
            const last = lastPerformed(r.id, sessions);
            return (
              <Link key={r.id} to={`/workouts/routines/${r.id}`} className="routine-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div className="between" style={{ marginBottom: 'var(--space-2)' }}>
                  <strong>{r.name}</strong>
                  <span className="pill">{r.kind === 'standard' ? 'standard' : r.kind === 'rowing-intervals' ? 'rowing+' : 'recovery'}</span>
                </div>
                <div className="meta muted" style={{ marginBottom: 'var(--space-3)' }}>
                  ~{r.estimatedMinutes} min · {r.exercises.length} exercise{r.exercises.length === 1 ? '' : 's'}
                </div>
                <div className="meta muted" style={{ marginBottom: 'var(--space-3)' }}>Last: {formatLastPerformed(last)}</div>
                <div className="actions" onClick={(e) => e.preventDefault()}>
                  <button className="btn btn-sm" onClick={(e) => { e.preventDefault(); onDuplicate(r); }}>Duplicate</button>
                  <button className="btn btn-sm btn-danger" onClick={(e) => { e.preventDefault(); onDelete(r); }}>Delete</button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
