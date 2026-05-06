import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../../lib/db';
import { exerciseStartedCount } from '../../lib/session';
import { formatDuration } from '../../lib/timers';

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = useLiveQuery(() => (id ? db.sessions.get(id) : undefined), [id]);

  if (session === undefined) return <div className="empty">Loading…</div>;
  if (!session) {
    return (
      <div className="card empty">
        Session not found. <Link to="/workouts/history">Back to history.</Link>
      </div>
    );
  }

  const onDelete = async () => {
    if (!confirm('Delete this session? This cannot be undone.')) return;
    await db.sessions.delete(session.id);
    navigate('/workouts/history');
  };

  const date = new Date(session.startedAt);
  const started = exerciseStartedCount(session);
  const total = session.exercises.length;

  return (
    <>
      <div className="section">
        <Link to="/workouts/history" className="muted" style={{ textDecoration: 'none' }}>
          ← History
        </Link>
      </div>

      <div className="card section">
        <h2 style={{ marginBottom: 'var(--space-2)' }}>{session.routineNameSnapshot}</h2>
        <div className="muted">
          {date.toLocaleString()} · {formatDuration(session.durationSec ?? 0)}
          {total > 0 && ` · ${started}/${total} exercises`}
          {session.activityLabel && ` · ${session.activityLabel}`}
        </div>
        {session.routineKindSnapshot === 'rowing-intervals' && session.rowingBlockSnapshot && (
          <div className="muted" style={{ marginTop: 'var(--space-2)' }}>
            Rowing block: warmup {session.rowingBlockSnapshot.warmupMin} min · {session.rowingBlockSnapshot.intervals}×
            {session.rowingBlockSnapshot.hardMin}/{session.rowingBlockSnapshot.easyMin} min · cooldown{' '}
            {session.rowingBlockSnapshot.cooldownMin} min · {session.rowingComplete ? 'completed' : 'skipped'}
          </div>
        )}
      </div>

      {session.exercises.length > 0 && (
        <div className="card section" style={{ padding: 0 }}>
          {session.exercises.map((e, i) => {
            const setsDone = e.sets.filter((s) => s.completed).length;
            return (
              <div key={i} className="list-row">
                <div>
                  <div className="name">{e.exerciseNameSnapshot}</div>
                  <div className="meta muted">
                    {setsDone}/{e.plannedSets} sets · target {e.plannedReps}
                  </div>
                  {e.notes && <div className="muted" style={{ fontSize: '0.85rem', marginTop: 'var(--space-1)' }}>note: {e.notes}</div>}
                </div>
                <div className="actions">
                  {e.sets.map((s, j) => (
                    <span
                      key={j}
                      className={`set-dot${s.completed ? ' done' : ''}`}
                      title={`Set ${j + 1}${s.completed ? ' ✓' : ''}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="row" style={{ marginTop: 'var(--space-4)' }}>
        <button className="btn btn-danger" onClick={onDelete}>Delete session</button>
      </div>
    </>
  );
}
