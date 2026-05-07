import { NavLink } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { addDaysCET, todayCET } from '../lib/date';
import { BrandMark } from './Illustrations';
import {
  IconBowl,
  IconDumbbell,
  IconHeart,
  IconHome,
  IconSettings,
  IconStethoscope,
} from './Icons';

interface ItemProps {
  to: string;
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  label: string;
  end?: boolean;
  badge?: string | number;
}

function SidebarItem({ to, icon: Icon, label, end, badge }: ItemProps) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `side-item${isActive ? ' active' : ''}`}>
      <span className="side-icon"><Icon size={18} stroke={1.7} /></span>
      <span className="side-label">{label}</span>
      {badge ? <span className="side-badge">{badge}</span> : null}
    </NavLink>
  );
}

function StreakCard() {
  const today = todayCET();
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);
  const completedDates = new Set(
    (sessions ?? []).filter((s) => s.completedAt).map((s) => s.startedAt.slice(0, 10)),
  );
  // Streak = consecutive trailing days with at least one session OR step entry, scanning back from today.
  const stepsAll = useLiveQuery(() => db.steps.toArray(), []);
  const stepDates = new Set((stepsAll ?? []).map((s) => s.date));
  const nutAll = useLiveQuery(() => db.nutrition.toArray(), []);
  const nutDates = new Set((nutAll ?? []).map((n) => n.date));
  const active = (d: string) => completedDates.has(d) || stepDates.has(d) || nutDates.has(d);

  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = addDaysCET(today, -i);
    if (active(d)) streak++;
    else if (i === 0) {
      // today not yet logged; don't break the streak yet
      continue;
    } else break;
  }

  // last 7 days fill markers
  const pips: boolean[] = [];
  for (let i = 6; i >= 0; i--) pips.push(active(addDaysCET(today, -i)));

  return (
    <div className="streak-card">
      <div className="streak-row">
        <span className="streak-num">{streak}</span>
        <span className="streak-label">day streak</span>
      </div>
      <div className="streak-bar">
        {pips.map((on, i) => (
          <span key={i} className={`streak-pip${on ? ' on' : ''}`} />
        ))}
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="sidebar">
      <NavLink to="/" className="brand">
        <span className="brand-mark">
          <BrandMark size={22} />
        </span>
        <span className="brand-name">vitals</span>
      </NavLink>

      <div className="side-section">
        <span className="side-section-label">Today</span>
        <SidebarItem to="/" end icon={IconHome} label="Dashboard" />
        <SidebarItem to="/workouts" icon={IconDumbbell} label="Workouts" />
        <SidebarItem to="/nutrition" icon={IconBowl} label="Nutrition" />
      </div>
      <div className="side-section">
        <span className="side-section-label">Tracking</span>
        <SidebarItem to="/body" icon={IconHeart} label="Body" />
        <SidebarItem to="/checkups" icon={IconStethoscope} label="Checkups" />
      </div>
      <div className="side-section side-section-bottom">
        <SidebarItem to="/settings" icon={IconSettings} label="Settings" />
      </div>

      <div className="side-foot">
        <StreakCard />
      </div>
    </aside>
  );
}
