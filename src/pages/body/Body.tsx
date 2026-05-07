import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Weight } from './Weight';
import { Cycle } from './Cycle';

export function Body() {
  const { pathname } = useLocation();
  const onCycle = pathname.endsWith('/cycle');
  return (
    <div className="page">
      <section className="head-row">
        <div>
          <span className="page-eyebrow eyebrow-cycle">Body</span>
          <h1 className="page-title">{onCycle ? 'Cycle' : 'Weight'}</h1>
          <p className="page-sub">{onCycle ? 'Phase, average length, predicted next start.' : 'Trend over the last 90 days, with a 3-entry rolling average.'}</p>
        </div>
      </section>
      <div className="tabs">
        <NavLink to="/body" end className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
          Weight
        </NavLink>
        <NavLink to="/body/cycle" className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
          Cycle
        </NavLink>
      </div>
      <div style={{ margin: '0 32px' }}>
        {onCycle ? <Cycle /> : <Weight />}
      </div>
      <Outlet />
    </div>
  );
}
