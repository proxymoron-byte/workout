import { NavLink, Outlet } from 'react-router-dom';

export function Body() {
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
      <Outlet />
    </main>
  );
}
