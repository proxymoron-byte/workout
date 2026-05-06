import { useEffect, useMemo, useRef, useState } from 'react';
import type { WorkoutSession } from '../../lib/types';
import { patchSession } from '../../lib/session';
import { beep, formatDuration, useStopwatch } from '../../lib/timers';
import { useSettings } from '../../lib/settings';
import { StandardPlayer } from './StandardPlayer';

interface Phase {
  label: string;
  durationSec: number;
  kind: 'warmup' | 'hard' | 'easy' | 'cooldown';
}

function buildPhases(block: NonNullable<WorkoutSession['rowingBlockSnapshot']>): Phase[] {
  const phases: Phase[] = [];
  if (block.warmupMin > 0) phases.push({ label: 'Warm-up', durationSec: block.warmupMin * 60, kind: 'warmup' });
  for (let i = 0; i < block.intervals; i++) {
    phases.push({ label: `Interval ${i + 1} · hard`, durationSec: block.hardMin * 60, kind: 'hard' });
    phases.push({ label: `Interval ${i + 1} · easy`, durationSec: block.easyMin * 60, kind: 'easy' });
  }
  if (block.cooldownMin > 0) phases.push({ label: 'Cooldown', durationSec: block.cooldownMin * 60, kind: 'cooldown' });
  return phases;
}

export function RowingPlayer({ session }: { session: WorkoutSession }) {
  if (session.rowingComplete) {
    return <StandardPlayer session={session} />;
  }
  if (!session.rowingBlockSnapshot) {
    void patchSession(session.id, { rowingComplete: true });
    return <StandardPlayer session={session} />;
  }
  return <RowingBlockRunner session={session} />;
}

function RowingBlockRunner({ session }: { session: WorkoutSession }) {
  const block = session.rowingBlockSnapshot!;
  const [settings] = useSettings();
  const phases = useMemo(() => buildPhases(block), [block]);
  const totalSec = phases.reduce((s, p) => s + p.durationSec, 0);
  const elapsed = useStopwatch(session.startedAt);

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseStart, setPhaseStart] = useState<number>(() => Date.now());
  const [phaseRemaining, setPhaseRemaining] = useState<number>(() => phases[0]?.durationSec ?? 0);
  const [running, setRunning] = useState(false);
  const audioRef = useRef(settings.audioEnabled);
  audioRef.current = settings.audioEnabled;

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const cur = phases[phaseIdx];
      if (!cur) return;
      const remaining = Math.max(0, Math.ceil((phaseStart + cur.durationSec * 1000 - Date.now()) / 1000));
      setPhaseRemaining(remaining);
      if (remaining === 0) {
        const nextIdx = phaseIdx + 1;
        if (nextIdx >= phases.length) {
          beep(audioRef.current, 'strong');
          setRunning(false);
          void patchSession(session.id, { rowingComplete: true });
          return;
        }
        beep(audioRef.current, phases[nextIdx].kind === 'hard' ? 'strong' : 'soft');
        setPhaseIdx(nextIdx);
        setPhaseStart(Date.now());
        setPhaseRemaining(phases[nextIdx].durationSec);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running, phaseIdx, phaseStart, phases, session.id]);

  const cur = phases[phaseIdx];
  const completedPriorSec = phases.slice(0, phaseIdx).reduce((s, p) => s + p.durationSec, 0);
  const phaseElapsed = (cur?.durationSec ?? 0) - phaseRemaining;
  const blockElapsed = completedPriorSec + phaseElapsed;
  const blockProgress = totalSec === 0 ? 0 : Math.min(100, (blockElapsed / totalSec) * 100);

  const onSkipPhase = () => {
    const nextIdx = phaseIdx + 1;
    if (nextIdx >= phases.length) {
      void patchSession(session.id, { rowingComplete: true });
      return;
    }
    setPhaseIdx(nextIdx);
    setPhaseStart(Date.now());
    setPhaseRemaining(phases[nextIdx].durationSec);
  };

  const onSkipBlock = () => {
    if (!confirm('Skip the rowing block?')) return;
    void patchSession(session.id, { rowingComplete: true });
  };

  return (
    <main className="page session-page">
      <header className="session-header">
        <div>
          <strong>{session.routineNameSnapshot}</strong>
          <div className="muted" style={{ fontSize: '0.85rem' }}>
            Rowing block · {formatDuration(elapsed)} elapsed
          </div>
        </div>
        <button className="btn" onClick={onSkipBlock}>Skip rowing →</button>
      </header>

      <div className="card section" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <div className={`phase-pill phase-${cur?.kind ?? 'warmup'}`}>{cur?.label ?? 'Done'}</div>
        <div className="big-time" style={{ marginTop: 'var(--space-3)' }}>{formatDuration(phaseRemaining)}</div>
        <div className="muted" style={{ fontSize: '0.85rem', marginTop: 'var(--space-2)' }}>
          Phase {Math.min(phaseIdx + 1, phases.length)} of {phases.length}
        </div>

        <div className="rowing-bar" style={{ marginTop: 'var(--space-5)' }}>
          <div className="rowing-bar-fill" style={{ width: `${blockProgress}%` }} />
        </div>

        <div className="row" style={{ marginTop: 'var(--space-5)', justifyContent: 'center' }}>
          {!running ? (
            <button className="btn btn-primary" onClick={() => { setPhaseStart(Date.now() - (cur.durationSec - phaseRemaining) * 1000); setRunning(true); }}>
              {phaseIdx === 0 && phaseRemaining === phases[0].durationSec ? 'Start rowing' : 'Resume'}
            </button>
          ) : (
            <button className="btn" onClick={() => setRunning(false)}>Pause</button>
          )}
          <button className="btn" onClick={onSkipPhase}>Skip phase →</button>
        </div>
      </div>

      <p className="muted" style={{ textAlign: 'center', fontSize: '0.85rem' }}>
        After the rowing block, the rest of the routine continues automatically.
      </p>
    </main>
  );
}
