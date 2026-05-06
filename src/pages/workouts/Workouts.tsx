import { NavLink, Outlet, useLocation } from 'react-router-dom';

export function Workouts() {
  const { pathname } = useLocation();
  const hideTabs = /\/workouts\/(routines|history)\/[^/]+|\/workouts\/generate$/.test(pathname);

  return (
    <div className="page">
      <section className="head-row">
        <div>
          <span className="page-eyebrow eyebrow-kcal">Workouts</span>
          <h1 className="page-title">Routines & sessions</h1>
          <p className="page-sub">Pick today's routine, dig into past sessions, or generate a new one.</p>
        </div>
      </section>
      {!hideTabs && (
        <div className="tabs">
          <NavLink to="/workouts" end className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
            Routines
          </NavLink>
          <NavLink to="/workouts/exercises" className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
            Exercises
          </NavLink>
          <NavLink to="/workouts/history" className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
            History
          </NavLink>
        </div>
      )}
      <div style={{ margin: '0 32px' }}>
        <Outlet />
      </div>
    </div>
  );
}
