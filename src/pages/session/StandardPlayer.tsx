import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import type { WorkoutSession } from '../../lib/types';
import { db } from '../../lib/db';
import { completeSession, discardSession, exerciseStartedCount, patchSession } from '../../lib/session';
import { beep, formatDuration, useCountdown, useStopwatch } from '../../lib/timers';
import { useSettings } from '../../lib/settings';
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconExternal,
  IconPause,
  IconPlay,
} from '../../components/Icons';

export function StandardPlayer({ session }: { session: WorkoutSession }) {
  const navigate = useNavigate();
  const [settings] = useSettings();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const elapsed = useStopwatch(session.startedAt);
  const rest = useCountdown(() => beep(settings.audioEnabled, 'soft'));
  const exerciseLib = useLiveQuery(() => db.exercises.toArray(), []);
  const exMap = new Map((exerciseLib ?? []).map((e) => [e.id, e]));

  const exercises = session.exercises;
  if (exercises.length === 0) {
    return (
      <main className="page-session" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card empty">
          This routine has no exercises.{' '}
          <button className="btn" onClick={() => discardThenLeave()}>Cancel</button>
        </div>
      </main>
    );
  }

  const current = exercises[currentIdx];
  const next = exercises[currentIdx + 1];
  const upNextEx = next ? exMap.get(next.exerciseId) : undefined;
  const firstUndoneIdx = current.sets.findIndex((s) => !s.completed);

  async function discardThenLeave() {
    await discardSession(session.id);
    navigate('/');
  }

  async function toggleSet(setIdx: number) {
    const wasCompleted = current.sets[setIdx].completed;
    const updated = exercises.map((e, i) => {
      if (i !== currentIdx) return e;
      const sets = e.sets.map((s, j) => (j === setIdx ? { completed: !s.completed } : s));
      return { ...e, sets };
    });
    await patchSession(session.id, { exercises: updated });
    if (!wasCompleted) {
      rest.start(current.restSec);
    }
  }

  async function setNote(note: string) {
    const updated = exercises.map((e, i) => (i === currentIdx ? { ...e, notes: note || undefined } : e));
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
        if (confirm('Discard this session entirely?')) await discardThenLeave();
        return;
      }
    }
    await completeSession(session.id);
    navigate(`/workouts/history/${session.id}`);
  }

  return (
    <main className="page-session">
      <header className="session-header">
        <button className="session-back" onClick={onEnd}>
          <IconChevronLeft size={18} stroke={1.8} /> End session
        </button>
        <div className="session-routine">
          <span className="session-eyebrow">in progress · {session.routineNameSnapshot}</span>
        </div>
        <div className="session-elapsed">
          <span className="session-elapsed-num">{formatDuration(elapsed)}</span>
          <button
            className="session-pause"
            onClick={() => setPaused(!paused)}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg)', color: 'var(--ink)', border: 0, display: 'grid', placeItems: 'center', cursor: 'pointer' }}
          >
            {paused ? <IconPlay size={14} stroke={2} /> : <IconPause size={14} stroke={2} />}
          </button>
        </div>
      </header>

      <div className="progress-strip">
        {exercises.map((e, i) => {
          const allDone = e.sets.every((s) => s.completed);
          const anyDone = e.sets.some((s) => s.completed);
          const isCurrent = i === currentIdx;
          const fillPct = isCurrent
            ? (e.sets.filter((s) => s.completed).length / e.sets.length) * 100
            : allDone
            ? 100
            : 0;
          return (
            <button
              key={i}
              className={`prog-seg${allDone ? ' done' : ''}${isCurrent ? ' current' : ''}${!allDone && anyDone ? ' partial' : ''}`}
              onClick={() => setCurrentIdx(i)}
              aria-label={`Go to exercise ${i + 1}`}
            >
              <div className="prog-seg-fill" style={{ width: `${fillPct}%` }} />
            </button>
          );
        })}
      </div>

      <div className="session-main">
        <div className="exercise-hero">
          <div className="exercise-hero-head">
            <span className="ex-position">Exercise {currentIdx + 1} of {exercises.length}</span>
            <h1 className="ex-hero-name">{current.exerciseNameSnapshot}</h1>
            <p className="ex-hero-instruction">
              {current.plannedSets} sets × {current.plannedReps} · {current.restSec}s rest
            </p>
            <div className="ex-hero-meta">
              <span className="muscle-chip">{exMap.get(current.exerciseId)?.muscleGroup ?? 'workout'}</span>
              {exMap.get(current.exerciseId)?.referenceUrl && (
                <a className="form-link" href={exMap.get(current.exerciseId)!.referenceUrl} target="_blank" rel="noreferrer">
                  <IconExternal size={12} stroke={1.7} /> View form
                </a>
              )}
            </div>
          </div>

          <div className="sets-block">
            {current.sets.map((s, j) => {
              const isUp = !s.completed && j === firstUndoneIdx;
              return (
                <button
                  key={j}
                  className={`set-row-button${s.completed ? ' set-done' : ''}${isUp ? ' set-up' : ''}`}
                  onClick={() => toggleSet(j)}
                >
                  <span className="set-check">
                    {s.completed ? <IconCheck size={20} stroke={2.4} /> : <span className="set-check-empty" />}
                  </span>
                  <span className="set-label">Set {j + 1}</span>
                  <span className="set-target">
                    <strong>{current.plannedReps}</strong> reps
                  </span>
                  <span className="set-cta">
                    {s.completed ? 'logged' : isUp ? 'tap when done' : ''}
                  </span>
                </button>
              );
            })}
          </div>

          {rest.running ? (
            <div className="rest-card">
              <div className="rest-ring">
                <svg viewBox="0 0 100 100" width="120" height="120">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="var(--protein)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 44}
                    strokeDashoffset={2 * Math.PI * 44 * (1 - rest.remaining / Math.max(1, rest.total))}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="rest-num" style={{ textAlign: 'center' }}>{rest.remaining}<span>s</span></div>
              </div>
              <div className="rest-body">
                <span className="rest-eyebrow">Resting</span>
                <h3 className="rest-title">Catch your breath</h3>
                <p className="rest-sub">Auto-advances when timer hits 0.</p>
                <div className="rest-actions">
                  <button className="rest-btn" onClick={() => rest.add(15)}>+15s</button>
                  <button className="rest-btn rest-btn-primary" onClick={rest.skip}>
                    Skip rest →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rest-idle">
              <span className="rest-idle-dot" />
              <span>Rest timer will start when you check a set · {current.restSec}s</span>
            </div>
          )}

          <label className="notes-row">
            <span className="notes-label">Note</span>
            <input
              className="notes-input"
              value={current.notes ?? ''}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How did it feel?"
            />
          </label>
        </div>
      </div>

      <aside className="up-next">
        <span className="up-next-eyebrow">Up next</span>
        {next && upNextEx ? (
          <div className="up-next-card">
            <div className="up-next-num">{String(currentIdx + 2).padStart(2, '0')}</div>
            <div>
              <div className="up-next-name">{next.exerciseNameSnapshot}</div>
              <div className="up-next-meta">{next.plannedSets} sets × {next.plannedReps} · {next.restSec}s rest</div>
            </div>
            <a
              href={upNextEx.referenceUrl ?? 'https://www.fitbod.me/'}
              target="_blank"
              rel="noreferrer"
              className="form-link"
              style={{ margin: '6px 20px 0' }}
            >
              <IconExternal size={12} stroke={1.7} /> Watch demo on Fitbod
            </a>
            <button
              className="rest-btn"
              style={{ margin: '8px 20px 0', alignSelf: 'flex-start' }}
              onClick={() => setCurrentIdx(Math.min(exercises.length - 1, currentIdx + 1))}
            >
              Skip <IconChevronRight size={12} stroke={1.8} />
            </button>
          </div>
        ) : (
          <div className="up-next-card" style={{ padding: 18 }}>
            <div className="muted" style={{ color: 'rgba(246,243,236,0.6)', fontSize: 13 }}>
              Last exercise — finish strong.
            </div>
            <Link to="#" onClick={(e) => { e.preventDefault(); onEnd(); }} className="form-link" style={{ marginTop: 8 }}>
              End session →
            </Link>
          </div>
        )}
      </aside>
    </main>
  );
}
