import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ConflictOverview } from '@/pages/ConflictOverview';
import { RegionalAnalysis } from '@/pages/RegionalAnalysis';
import { TimeAnalysis } from '@/pages/TimeAnalysis';
import { IncidentTimeline } from '@/pages/IncidentTimeline';
import { OfficialAlerts } from '@/pages/OfficialAlerts';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<ConflictOverview />} />
          <Route path="/regional" element={<RegionalAnalysis />} />
          <Route path="/time" element={<TimeAnalysis />} />
          <Route path="/timeline" element={<IncidentTimeline />} />
          <Route path="/alerts" element={<OfficialAlerts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
