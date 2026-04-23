import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import DPSDesk from './pages/DPSDesk.jsx';
import Remote from './pages/Remote.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Navigate to="/dpsdesk" replace />} />
        <Route path="/dpsdesk" element={<DPSDesk />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="/remote/:posId" element={<Remote />} />
      <Route path="*" element={<Navigate to="/dpsdesk" replace />} />
    </Routes>
  );
}
