import { useSettings } from '../lib/settings';
import { todayCET } from '../lib/date';

export function Dashboard() {
  const [settings] = useSettings();
  const today = todayCET();
  const greeting = settings.displayName ? `Hello, ${settings.displayName}.` : 'Hello.';

  return (
    <main className="page">
      <div className="section">
        <h1>{greeting}</h1>
        <p className="muted">{today}</p>
      </div>
      <div className="card empty">
        Dashboard coming together in step 7. Foundations are in place — set goals in <strong>Settings</strong> to begin.
      </div>
    </main>
  );
}
