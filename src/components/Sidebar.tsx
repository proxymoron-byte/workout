import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/workouts', label: 'Workouts' },
  { to: '/nutrition', label: 'Nutrition' },
  { to: '/body', label: 'Body' },
  { to: '/checkups', label: 'Checkups' },
  { to: '/settings', label: 'Settings' },
];

export function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">Workout</div>
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
