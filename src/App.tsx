import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Body } from './pages/Placeholders';
import { Nutrition } from './pages/Nutrition';
import { Checkups } from './pages/Checkups';
import { Steps } from './pages/Steps';
import { Settings } from './pages/Settings';
import { Workouts } from './pages/workouts/Workouts';
import { Routines } from './pages/workouts/Routines';
import { Exercises } from './pages/workouts/Exercises';
import { RoutineDetail } from './pages/workouts/RoutineDetail';
import { History } from './pages/workouts/History';
import { SessionDetail } from './pages/workouts/SessionDetail';
import { SessionPlayer } from './pages/session/SessionPlayer';

export default function App() {
  return (
    <BrowserRouter basename="/workout">
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="workouts" element={<Workouts />}>
            <Route index element={<Routines />} />
            <Route path="exercises" element={<Exercises />} />
            <Route path="routines/:id" element={<RoutineDetail />} />
            <Route path="history" element={<History />} />
            <Route path="history/:id" element={<SessionDetail />} />
          </Route>
          <Route path="session/:id" element={<SessionPlayer />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="body" element={<Body />} />
          <Route path="steps" element={<Steps />} />
          <Route path="checkups" element={<Checkups />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
