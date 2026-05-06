import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../lib/db';
import { dismissRule, evaluateDrift, type DriftSignal } from '../lib/drift';

export function DriftBar() {
  const [signal, setSignal] = useState<DriftSignal | null>(null);
  // Re-evaluate when any of the inputs the engine reads change.
  const triggers = useLiveQuery(async () => {
    const [n, s, ck, w, st, c, d] = await Promise.all([
      db.nutrition.count(),
      db.sessions.count(),
      db.checkups.count(),
      db.weights.count(),
      db.steps.count(),
      db.cycleStarts.count(),
      db.driftDismissals.count(),
    ]);
    return `${n}|${s}|${ck}|${w}|${st}|${c}|${d}`;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const next = await evaluateDrift();
      if (!cancelled) setSignal(next);
    };
    void run();
    const onSettings = () => void run();
    window.addEventListener('workout:settings-changed', onSettings);
    return () => {
      cancelled = true;
      window.removeEventListener('workout:settings-changed', onSettings);
    };
  }, [triggers]);

  if (!signal) return null;

  const onDismiss = async () => {
    await dismissRule(signal.ruleId);
    setSignal(null);
  };

  return (
    <div className="drift-bar" role="status">
      <span className="drift-message">{signal.message}</span>
      <span className="drift-actions">
        <Link to={signal.actionPath} className="btn btn-sm btn-primary">{signal.actionLabel}</Link>
        <button className="drift-dismiss" onClick={onDismiss} aria-label="Dismiss for 24 hours">×</button>
      </span>
    </div>
  );
}
