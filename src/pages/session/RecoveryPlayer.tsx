import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkoutSession } from '../../lib/types';
import { completeSession, discardSession, patchSession } from '../../lib/session';
import { formatDuration, useStopwatch } from '../../lib/timers';

const ACTIVITIES = ['walking', 'skating', 'cycling', 'mobility', 'stretching', 'yoga'];

export function RecoveryPlayer({ session }: { session: WorkoutSession }) {
  const navigate = useNavigate();
  const elapsed = useStopwatch(session.startedAt);
  const [activity, setActivity] = useState(session.activityLabel ?? 'walking');

  async function onActivityChange(v: string) {
    setActivity(v);
    await patchSession(session.id, { activityLabel: v });
  }

  async function onDone() {
    await patchSession(session.id, { activityLabel: activity });
    await completeSession(session.id);
    navigate(`/workouts/history/${session.id}`);
  }

  async function onCancel() {
    if (!confirm('Discard this active recovery session?')) return;
    await discardSession(session.id);
    navigate('/workouts');
  }

  return (
    <main className="page session-page">
      <header className="session-header">
        <div>
          <strong>{session.routineNameSnapshot}</strong>
          <div className="muted" style={{ fontSize: '0.85rem' }}>active recovery</div>
        </div>
        <button className="btn" onClick={onCancel}>Cancel</button>
      </header>

      <div className="card section" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <div className="muted" style={{ fontSize: '0.9rem' }}>Elapsed</div>
        <div className="big-time">{formatDuration(elapsed)}</div>
      </div>

      <div className="card section">
        <div className="field">
          <label>Activity</label>
          <select value={activity} onChange={(e) => onActivityChange(e.target.value)}>
            {ACTIVITIES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        <button className="btn btn-primary" onClick={onDone}>Done</button>
      </div>
    </main>
  );
}
