import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Weight } from './Weight';
import { Cycle } from './Cycle';

export function Body() {
  const { pathname } = useLocation();
  const onCycle = pathname.endsWith('/cycle');
  return (
    <main className="page">
      <div className="section">
        <h1>Body</h1>
      </div>
      <div className="tabs">
        <NavLink to="/body" end className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
          Weight
        </NavLink>
        <NavLink to="/body/cycle" className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
          Cycle
        </NavLink>
      </div>
      {onCycle ? <Cycle /> : <Weight />}
      <Outlet />
    </main>
  );
}
