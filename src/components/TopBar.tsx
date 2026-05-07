import { useNavigate } from 'react-router-dom';
import { downloadExport } from '../lib/exportImport';
import { useSettings } from '../lib/settings';
import { IconBell, IconExport, IconSearch } from './Icons';

export function TopBar() {
  const navigate = useNavigate();
  const [settings] = useSettings();

  const onExport = async () => {
    try {
      await downloadExport();
    } catch (err) {
      console.error(err);
      alert('Export failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const initial = (settings.displayName || 'M').trim().charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-search">
        <IconSearch size={16} stroke={1.6} />
        <input placeholder="Search foods, exercises, routines…" />
        <span className="kbd">⌘K</span>
      </div>
      <div className="topbar-right">
        <button className="ghost-btn" onClick={onExport}>
          <IconExport size={16} stroke={1.6} /> Export
        </button>
        <button className="round-btn" aria-label="Notifications" onClick={() => navigate('/settings')}>
          <IconBell size={16} stroke={1.6} />
        </button>
        <button
          className="avatar avatar-btn"
          onClick={() => navigate('/settings')}
          title="Profile & settings"
          aria-label="Profile and settings"
        >
          <span>{initial}</span>
        </button>
      </div>
    </header>
  );
}
