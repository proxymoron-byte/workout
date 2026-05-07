import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkoutSession } from '../../lib/types';
import { completeSession, discardSession, patchSession } from '../../lib/session';
import { formatDuration, useStopwatch } from '../../lib/timers';
import { IconChevronLeft } from '../../components/Icons';

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
    navigate('/');
  }

  return (
    <main className="page-session" style={{ gridTemplateColumns: '1fr', gridTemplateRows: 'auto 1fr' }}>
      <header className="session-header">
        <button className="session-back" onClick={onCancel}>
          <IconChevronLeft size={18} stroke={1.8} /> End session
        </button>
        <div className="session-routine">
          <span className="session-eyebrow">active recovery · {session.routineNameSnapshot}</span>
        </div>
        <div className="session-elapsed">
          <span className="session-elapsed-num">{formatDuration(elapsed)}</span>
        </div>
      </header>

      <div className="session-main">
        <div className="exercise-hero" style={{ textAlign: 'center', padding: '60px 32px' }}>
          <div className="ex-position">Active recovery</div>
          <div className="ex-hero-name" style={{ textTransform: 'capitalize' }}>{activity}</div>
          <div className="rest-num" style={{ position: 'static', marginTop: 24, fontSize: 80 }}>
            {formatDuration(elapsed)}
          </div>
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 12 }}>
            {ACTIVITIES.map((a) => (
              <button
                key={a}
                className={`rest-btn${activity === a ? ' rest-btn-primary' : ''}`}
                onClick={() => onActivityChange(a)}
                style={{ textTransform: 'capitalize' }}
              >
                {a}
              </button>
            ))}
          </div>
          <button className="cta-btn" onClick={onDone} style={{ marginTop: 32, padding: '12px 28px', fontSize: 15 }}>
            Done
          </button>
        </div>
      </div>
    </main>
  );
}
