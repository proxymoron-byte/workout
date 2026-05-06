import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Body, Checkups, Nutrition } from './pages/Placeholders';
import { Settings } from './pages/Settings';
import { Workouts } from './pages/workouts/Workouts';
import { Routines } from './pages/workouts/Routines';
import { Exercises } from './pages/workouts/Exercises';
import { RoutineDetail } from './pages/workouts/RoutineDetail';

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
          </Route>
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="body" element={<Body />} />
          <Route path="checkups" element={<Checkups />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
