import { NavLink, Outlet, useLocation } from 'react-router-dom';

export function Workouts() {
  const { pathname } = useLocation();
  const onDetail = /\/workouts\/routines\/[^/]+/.test(pathname);

  return (
    <main className="page">
      <div className="section">
        <h1>Workouts</h1>
      </div>
      {!onDetail && (
        <div className="tabs">
          <NavLink to="/workouts" end className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
            Routines
          </NavLink>
          <NavLink to="/workouts/exercises" className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
            Exercises
          </NavLink>
        </div>
      )}
      <Outlet />
    </main>
  );
}
