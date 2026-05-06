import { downloadExport } from '../lib/exportImport';

export function TopBar() {
  const onExport = async () => {
    try {
      await downloadExport();
    } catch (err) {
      console.error(err);
      alert('Export failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const onQuickLog = () => {
    alert('Quick log — coming in a later step.');
  };

  return (
    <div className="top-bar">
      <button className="btn" onClick={onExport}>
        Export
      </button>
      <button className="btn btn-primary" onClick={onQuickLog}>
        Quick log
      </button>
    </div>
  );
}
