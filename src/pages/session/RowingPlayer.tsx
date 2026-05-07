import { useEffect, useMemo, useRef, useState } from 'react';
import type { WorkoutSession } from '../../lib/types';
import { patchSession } from '../../lib/session';
import { beep, formatDuration, useStopwatch } from '../../lib/timers';
import { useSettings } from '../../lib/settings';
import { StandardPlayer } from './StandardPlayer';
import { IconChevronLeft } from '../../components/Icons';

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
    <main className="page-session" style={{ gridTemplateColumns: '1fr', gridTemplateRows: 'auto auto 1fr' }}>
      <header className="session-header">
        <button className="session-back" onClick={onSkipBlock}>
          <IconChevronLeft size={18} stroke={1.8} /> Skip rowing
        </button>
        <div className="session-routine">
          <span className="session-eyebrow">rowing block · {session.routineNameSnapshot}</span>
        </div>
        <div className="session-elapsed">
          <span className="session-elapsed-num">{formatDuration(elapsed)}</span>
        </div>
      </header>

      <div className="session-main" style={{ gridColumn: '1 / -1' }}>
        <div className="exercise-hero" style={{ textAlign: 'center', padding: '60px 32px' }}>
          <span className={`phase-pill phase-${cur?.kind ?? 'warmup'}`} style={{ display: 'inline-block' }}>
            {cur?.label ?? 'Done'}
          </span>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 96, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 16, fontVariantNumeric: 'tabular-nums' }}>
            {formatDuration(phaseRemaining)}
          </div>
          <div style={{ color: 'rgba(246,243,236,0.6)', fontSize: 13, marginTop: 8 }}>
            Phase {Math.min(phaseIdx + 1, phases.length)} of {phases.length}
          </div>

          <div className="rowing-bar" style={{ marginTop: 24, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            <div className="rowing-bar-fill" style={{ width: `${blockProgress}%` }} />
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
            {!running ? (
              <button
                className="rest-btn rest-btn-primary"
                onClick={() => {
                  setPhaseStart(Date.now() - (cur.durationSec - phaseRemaining) * 1000);
                  setRunning(true);
                }}
              >
                {phaseIdx === 0 && phaseRemaining === phases[0].durationSec ? 'Start rowing' : 'Resume'}
              </button>
            ) : (
              <button className="rest-btn" onClick={() => setRunning(false)}>Pause</button>
            )}
            <button className="rest-btn" onClick={onSkipPhase}>Skip phase →</button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(246,243,236,0.45)', marginTop: 16 }}>
          After the rowing block, the rest of the routine continues automatically.
        </p>
      </div>
    </main>
  );
}
