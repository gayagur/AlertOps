import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Dashboard } from '@/pages/Dashboard';
import { Opportunities } from '@/pages/Opportunities';
import { MacroDrivers } from '@/pages/MacroDrivers';
import { RiskMonitor } from '@/pages/RiskMonitor';
import { AnalysisDetail } from '@/pages/AnalysisDetail';
import { Recommendations } from '@/pages/Recommendations';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/macro" element={<MacroDrivers />} />
          <Route path="/risks" element={<RiskMonitor />} />
          <Route path="/analysis" element={<AnalysisDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
