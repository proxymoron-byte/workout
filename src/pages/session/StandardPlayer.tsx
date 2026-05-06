import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkoutSession } from '../../lib/types';
import { completeSession, discardSession, exerciseStartedCount, patchSession } from '../../lib/session';
import { beep, formatDuration, useCountdown, useStopwatch } from '../../lib/timers';
import { useSettings } from '../../lib/settings';

export function StandardPlayer({ session }: { session: WorkoutSession }) {
  const navigate = useNavigate();
  const [settings] = useSettings();
  const [currentIdx, setCurrentIdx] = useState(0);
  const elapsed = useStopwatch(session.startedAt);
  const rest = useCountdown(() => beep(settings.audioEnabled, 'soft'));

  const exercises = session.exercises;

  if (exercises.length === 0) {
    return (
      <main className="page">
        <div className="card empty">
          This routine has no exercises. <button className="btn" onClick={() => discardThenLeave()}>Cancel</button>
        </div>
      </main>
    );
  }

  const current = exercises[currentIdx];
  const next = exercises[currentIdx + 1];
  const completedExercises = exercises.filter((e) => e.sets.every((s) => s.completed)).length;

  async function discardThenLeave() {
    await discardSession(session.id);
    navigate('/workouts');
  }

  async function toggleSet(exIdx: number, setIdx: number) {
    const updated = exercises.map((e, i) => {
      if (i !== exIdx) return e;
      const sets = e.sets.map((s, j) => (j === setIdx ? { completed: !s.completed } : s));
      return { ...e, sets };
    });
    await patchSession(session.id, { exercises: updated });
    if (!exercises[exIdx].sets[setIdx].completed) {
      rest.start(exercises[exIdx].restSec);
    }
  }

  async function setNote(exIdx: number, note: string) {
    const updated = exercises.map((e, i) => (i === exIdx ? { ...e, notes: note || undefined } : e));
    await patchSession(session.id, { exercises: updated });
  }

  async function onEnd() {
    const started = exerciseStartedCount(session);
    if (started === 0) {
      if (!confirm('No sets marked. Discard this session?')) return;
      await discardThenLeave();
      return;
    }
    if (started < exercises.length) {
      const proceed = confirm(`Save partial session? You started ${started} of ${exercises.length} exercises.`);
      if (!proceed) {
        if (confirm('Discard this session entirely?')) {
          await discardThenLeave();
        }
        return;
      }
    }
    await completeSession(session.id);
    navigate(`/workouts/history/${session.id}`);
  }

  const goPrev = () => setCurrentIdx((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIdx((i) => Math.min(exercises.length - 1, i + 1));

  return (
    <main className="page session-page">
      <header className="session-header">
        <div>
          <strong>{session.routineNameSnapshot}</strong>
          <div className="muted" style={{ fontSize: '0.85rem' }}>
            {formatDuration(elapsed)} elapsed · {completedExercises}/{exercises.length} complete
          </div>
        </div>
        <button className="btn btn-danger" onClick={onEnd}>End session</button>
      </header>

      <div className="progress-bar" aria-label="Progress">
        {exercises.map((e, i) => {
          const allDone = e.sets.every((s) => s.completed);
          const anyDone = e.sets.some((s) => s.completed);
          return (
            <div
              key={i}
              className={`progress-seg${allDone ? ' full' : anyDone ? ' partial' : ''}${i === currentIdx ? ' current' : ''}`}
              onClick={() => setCurrentIdx(i)}
              role="button"
              aria-label={`Go to exercise ${i + 1}`}
            />
          );
        })}
      </div>

      <div className="card section">
        <div className="muted" style={{ fontSize: '0.85rem', marginBottom: 'var(--space-1)' }}>
          Exercise {currentIdx + 1} of {exercises.length}
        </div>
        <h2 style={{ marginBottom: 'var(--space-2)' }}>{current.exerciseNameSnapshot}</h2>
        <div className="muted" style={{ marginBottom: 'var(--space-4)' }}>
          {current.plannedSets} sets × {current.plannedReps} · rest {current.restSec}s
        </div>

        <div className="set-rows">
          {current.sets.map((s, j) => (
            <label key={j} className={`set-row${s.completed ? ' done' : ''}`}>
              <input type="checkbox" checked={s.completed} onChange={() => toggleSet(currentIdx, j)} />
              <span className="set-label">Set {j + 1}</span>
              <span className="set-target muted">{current.plannedReps}</span>
            </label>
          ))}
        </div>

        {rest.running && (
          <div className="rest-timer">
            <div>
              <div className="muted" style={{ fontSize: '0.85rem' }}>Rest</div>
              <div className="rest-time">{formatDuration(rest.remaining)}</div>
            </div>
            <div className="actions">
              <button className="btn btn-sm" onClick={() => rest.add(15)}>+15s</button>
              <button className="btn btn-sm" onClick={rest.skip}>Skip rest →</button>
            </div>
          </div>
        )}

        <div className="field" style={{ marginTop: 'var(--space-4)', marginBottom: 0 }}>
          <label>Notes</label>
          <input
            value={current.notes ?? ''}
            onChange={(e) => setNote(currentIdx, e.target.value)}
            placeholder="felt heavy, switched bands…"
          />
        </div>

        <div className="row" style={{ marginTop: 'var(--space-4)' }}>
          <button className="btn" onClick={goPrev} disabled={currentIdx === 0}>← Previous</button>
          <button className="btn btn-primary" onClick={goNext} disabled={currentIdx === exercises.length - 1}>Next →</button>
        </div>
      </div>

      {next && (
        <div className="card up-next">
          <div className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Up next
          </div>
          <div style={{ fontWeight: 500, marginTop: 'var(--space-1)' }}>{next.exerciseNameSnapshot}</div>
          <div className="muted" style={{ fontSize: '0.85rem' }}>
            {next.plannedSets} × {next.plannedReps}
          </div>
        </div>
      )}
    </main>
  );
}
