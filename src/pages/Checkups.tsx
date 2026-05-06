import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { db, newId } from '../lib/db';
import type { Checkup } from '../lib/types';
import { todayCET } from '../lib/date';
import { markDoneToday, sortViews, viewFor, type CheckupStatus } from '../lib/checkups';
import { Modal } from '../components/Modal';
import { useSettings } from '../lib/settings';

const STATUS_LABEL: Record<CheckupStatus, string> = {
  overdue: 'Overdue',
  'due-soon': 'Due soon',
  'up-to-date': 'Up to date',
  schedule: 'Schedule',
};

const EMPTY: Checkup = {
  id: '',
  name: '',
  intervalMonths: 12,
};

export function Checkups() {
  const [settings, setSettings] = useSettings();
  const all = useLiveQuery(() => db.checkups.toArray(), []);
  const [editing, setEditing] = useState<Checkup | null>(null);

  const views = useMemo(() => sortViews((all ?? []).map((c) => viewFor(c))), [all]);

  const onAdd = () => setEditing({ ...EMPTY, id: newId() });

  const onMarkDone = async (c: Checkup) => {
    await db.checkups.put(markDoneToday(c));
  };

  const onSave = async (c: Checkup) => {
    await db.checkups.put({ ...c, name: c.name.trim() });
    setEditing(null);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this checkup?')) return;
    await db.checkups.delete(id);
  };

  const dismissDisclaimer = () => setSettings({ ...settings, checkupsDisclaimerSeen: true });

  return (
    <main className="page">
      <div className="section">
        <h1>Checkups</h1>
      </div>

      {!settings.checkupsDisclaimerSeen && (
        <div className="card section" style={{ background: 'var(--color-warn-soft)', borderColor: 'var(--color-warn)' }}>
          <div className="between">
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Default intervals are starting points only. Verify with your healthcare provider — this dashboard isn't medical advice.
            </p>
            <button className="btn btn-sm" onClick={dismissDisclaimer}>Got it</button>
          </div>
        </div>
      )}

      <div className="between" style={{ marginBottom: 'var(--space-4)' }}>
        <p className="muted" style={{ margin: 0 }}>{views.length} checkups tracked.</p>
        <button className="btn btn-primary" onClick={onAdd}>+ Add checkup</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {!all && <div className="empty">Loading…</div>}
        {all && views.length === 0 && <div className="empty">No checkups yet.</div>}
        {views.map((v) => (
          <div key={v.checkup.id} className="list-row">
            <div>
              <div className="name">{v.checkup.name}</div>
              <div className="meta muted">
                Every {v.checkup.intervalMonths} mo
                {v.checkup.lastCompletedDate && ` · last ${v.checkup.lastCompletedDate}`}
                {v.nextDue && ` · next ${v.nextDue}`}
                {v.daysToDue !== null && (
                  <>
                    {' · '}
                    {v.daysToDue < 0
                      ? `${-v.daysToDue} day${v.daysToDue === -1 ? '' : 's'} overdue`
                      : v.daysToDue === 0
                      ? 'due today'
                      : `${v.daysToDue} day${v.daysToDue === 1 ? '' : 's'} until due`}
                  </>
                )}
              </div>
              {v.checkup.notes && (
                <div className="muted" style={{ fontSize: '0.85rem', marginTop: 'var(--space-1)' }}>
                  {v.checkup.notes}
                </div>
              )}
            </div>
            <div className="actions" style={{ alignItems: 'center' }}>
              <span className={`pill checkup-${v.status}`}>{STATUS_LABEL[v.status]}</span>
              <button className="btn btn-sm" onClick={() => onMarkDone(v.checkup)}>Mark done today</button>
              <button className="btn btn-sm" onClick={() => setEditing(v.checkup)}>Edit</button>
              <button className="btn btn-sm btn-danger" onClick={() => onDelete(v.checkup.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editing && <CheckupModal checkup={editing} onSave={onSave} onClose={() => setEditing(null)} />}
    </main>
  );
}

function CheckupModal({
  checkup,
  onSave,
  onClose,
}: {
  checkup: Checkup;
  onSave: (c: Checkup) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Checkup>(checkup);
  const today = todayCET();
  const set = <K extends keyof Checkup>(k: K, v: Checkup[K]) => setDraft({ ...draft, [k]: v });

  return (
    <Modal
      open
      title={checkup.name ? `Edit · ${checkup.name}` : 'Add checkup'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!draft.name.trim() || draft.intervalMonths <= 0}
            onClick={() => onSave(draft)}
          >
            Save
          </button>
        </>
      }
    >
      <div className="field">
        <label>Name</label>
        <input value={draft.name} onChange={(e) => set('name', e.target.value)} autoFocus placeholder="Annual bloodwork" />
      </div>
      <div className="row">
        <div className="field">
          <label>Interval (months)</label>
          <input
            type="number"
            min={1}
            value={draft.intervalMonths}
            onChange={(e) => set('intervalMonths', Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Last completed (optional)</label>
          <input
            type="date"
            max={today}
            value={draft.lastCompletedDate ?? ''}
            onChange={(e) => set('lastCompletedDate', e.target.value || undefined)}
          />
        </div>
      </div>
      <div className="field">
        <label>Notes (optional)</label>
        <textarea
          rows={2}
          value={draft.notes ?? ''}
          onChange={(e) => set('notes', e.target.value || undefined)}
          placeholder="GP referral required, covered by insurance until June…"
        />
      </div>
    </Modal>
  );
}
