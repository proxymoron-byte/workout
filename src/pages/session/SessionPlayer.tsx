import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../lib/db';
import { StandardPlayer } from './StandardPlayer';
import { RecoveryPlayer } from './RecoveryPlayer';
import { RowingPlayer } from './RowingPlayer';

export function SessionPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = useLiveQuery(() => (id ? db.sessions.get(id) : undefined), [id]);

  useEffect(() => {
    if (session?.completedAt) {
      navigate(`/workouts/history/${session.id}`, { replace: true });
    }
  }, [session?.id, session?.completedAt, navigate]);

  if (!id) return <NotFound />;
  if (session === undefined) return <Loading />;
  if (!session) return <NotFound />;
  if (session.completedAt) return <Loading />;

  if (session.routineKindSnapshot === 'active-recovery') return <RecoveryPlayer session={session} />;
  if (session.routineKindSnapshot === 'rowing-intervals') return <RowingPlayer session={session} />;
  return <StandardPlayer session={session} />;
}

function NotFound() {
  return (
    <main className="page">
      <div className="card empty">Session not found.</div>
    </main>
  );
}

function Loading() {
  return (
    <main className="page">
      <div className="card empty">Loading session…</div>
    </main>
  );
}
