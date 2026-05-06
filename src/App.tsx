import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Body, Checkups, Nutrition, Workouts } from './pages/Placeholders';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter basename="/workout">
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="body" element={<Body />} />
          <Route path="checkups" element={<Checkups />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
