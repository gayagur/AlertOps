import type {
  Incident, RegionStat, OfficialUpdate, GuidanceItem,
  TimeSeriesPoint, HeatmapCell, DashboardOverview,
} from '@/types/conflict';

export const mockOverview: DashboardOverview = {
  totalAlerts: 1847,
  totalImpacts: 312,
  totalInterceptions: 1489,
  mostAffectedRegion: 'Gush Dan',
  peakActivityHour: 2,
  last24hAlerts: 23,
  last7dAlerts: 187,
  lastUpdated: '2026-04-06T08:42:00Z',
  sourceName: 'Home Front Command',
};

export const mockRegionStats: RegionStat[] = [
  { region: 'Gush Dan', alerts: 412, impacts: 68, interceptions: 331, peakHour: 2, last24hAlerts: 8, last7dAlerts: 52 },
  { region: 'Sharon', alerts: 287, impacts: 41, interceptions: 238, peakHour: 3, last24hAlerts: 5, last7dAlerts: 38 },
  { region: 'Haifa', alerts: 241, impacts: 38, interceptions: 196, peakHour: 1, last24hAlerts: 4, last7dAlerts: 31 },
  { region: 'Jerusalem', alerts: 198, impacts: 29, interceptions: 164, peakHour: 2, last24hAlerts: 2, last7dAlerts: 22 },
  { region: 'Northern Negev', alerts: 176, impacts: 34, interceptions: 137, peakHour: 22, last24hAlerts: 1, last7dAlerts: 18 },
  { region: 'Upper Galilee', alerts: 154, impacts: 28, interceptions: 121, peakHour: 0, last24hAlerts: 2, last7dAlerts: 14 },
  { region: 'Shfela', alerts: 138, impacts: 22, interceptions: 112, peakHour: 3, last24hAlerts: 1, last7dAlerts: 8 },
  { region: 'Coastal Plain', alerts: 121, impacts: 19, interceptions: 98, peakHour: 1, last24hAlerts: 0, last7dAlerts: 4 },
  { region: 'Arava', alerts: 72, impacts: 18, interceptions: 52, peakHour: 23, last24hAlerts: 0, last7dAlerts: 0 },
  { region: 'Eilat', alerts: 48, impacts: 15, interceptions: 40, peakHour: 22, last24hAlerts: 0, last7dAlerts: 0 },
];

export const mockTimeSeries: TimeSeriesPoint[] = (() => {
  const points: TimeSeriesPoint[] = [];
  const base = new Date('2026-03-20');
  for (let i = 0; i < 18; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const day = d.toISOString().split('T')[0];
    const spike = i === 5 || i === 12;
    points.push({
      date: day,
      alerts: spike ? 140 + Math.floor(Math.random() * 60) : 20 + Math.floor(Math.random() * 80),
      impacts: spike ? 25 + Math.floor(Math.random() * 15) : 3 + Math.floor(Math.random() * 15),
      interceptions: spike ? 110 + Math.floor(Math.random() * 40) : 15 + Math.floor(Math.random() * 60),
    });
  }
  return points;
})();

export const mockHeatmap: HeatmapCell[] = (() => {
  const regions = ['Gush Dan', 'Sharon', 'Haifa', 'Jerusalem', 'Northern Negev', 'Upper Galilee', 'Shfela', 'Coastal Plain'];
  const cells: HeatmapCell[] = [];
  for (const region of regions) {
    for (let h = 0; h < 24; h++) {
      const isNight = h >= 22 || h <= 4;
      const base = isNight ? 8 : 2;
      const regionWeight = region === 'Gush Dan' ? 1.5 : region === 'Sharon' ? 1.3 : region === 'Haifa' ? 1.2 : 1;
      cells.push({
        region,
        hour: h,
        value: Math.floor((base + Math.random() * 6) * regionWeight),
      });
    }
  }
  return cells;
})();

// Generate timestamps relative to NOW so mock data is always "recent"
function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

export const mockIncidents: Incident[] = [
  { id: '1', timestamp: hoursAgo(0.5), region: 'Gush Dan', city: 'Tel Aviv', eventType: 'alert', count: 3, sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Rocket alert activated', description: 'Multiple alerts sounded in the Gush Dan area. Residents instructed to enter shelters.' },
  { id: '2', timestamp: hoursAgo(0.52), region: 'Gush Dan', eventType: 'interception', count: 2, sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Interceptions reported', description: 'Air defense systems engaged incoming projectiles over the Gush Dan area.' },
  { id: '3', timestamp: hoursAgo(0.55), region: 'Sharon', eventType: 'alert', count: 1, sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Alert extended to Sharon area', description: 'Alert zone expanded to include Sharon region.' },
  { id: '4', timestamp: hoursAgo(2), region: 'Gush Dan', city: 'Ramat Gan', eventType: 'alert', count: 1, sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Alert in central Gush Dan', description: 'Alert sounded in Ramat Gan and surrounding area.' },
  { id: '5', timestamp: hoursAgo(3), region: 'Haifa', eventType: 'alert', count: 2, sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Alert in Haifa area', description: 'Rocket alerts sounded in the Haifa metropolitan area.' },
  { id: '6', timestamp: hoursAgo(3.1), region: 'Haifa', eventType: 'interception', count: 2, sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Interceptions over Haifa', description: 'Multiple interceptions reported. No impact damage reported.' },
  { id: '7', timestamp: hoursAgo(5), region: 'Jerusalem', eventType: 'official_update', sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Shelter guidelines updated', description: 'Updated shelter entry time guidelines issued for central regions.' },
  { id: '8', timestamp: hoursAgo(7), region: 'Gush Dan', city: 'Holon', eventType: 'alert', count: 2, sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Alert in southern Gush Dan', description: 'Alerts sounded in Holon and Bat Yam areas.' },
  { id: '9', timestamp: hoursAgo(7.1), region: 'Gush Dan', eventType: 'interception', count: 2, sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Interceptions over Gush Dan', description: 'Air defense engaged incoming projectiles.' },
  { id: '10', timestamp: hoursAgo(9), region: 'Northern Negev', city: 'Beer Sheva', eventType: 'alert', count: 1, sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Alert in Northern Negev', description: 'Single alert sounded in the Beer Sheva area.' },
  { id: '11', timestamp: hoursAgo(9.1), region: 'Northern Negev', eventType: 'impact', count: 1, sourceName: 'Media reports', sourceType: 'reported', confidence: 'verified', title: 'Impact reported in open area', description: 'Impact reported in an open area. No injuries reported.' },
  { id: '12', timestamp: hoursAgo(12), region: 'Upper Galilee', eventType: 'alert', count: 4, sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Multiple alerts in Upper Galilee', description: 'Four separate alerts sounded across the Upper Galilee region.' },
  { id: '13', timestamp: hoursAgo(12.1), region: 'Upper Galilee', eventType: 'interception', count: 3, sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Interceptions in northern airspace', description: 'Air defense systems engaged multiple targets in northern airspace.' },
  { id: '14', timestamp: hoursAgo(16), region: 'Gush Dan', city: 'Rishon LeZion', eventType: 'alert', count: 2, sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Late evening alert in Gush Dan', description: 'Alerts activated in southern Gush Dan area.' },
  { id: '15', timestamp: hoursAgo(18), region: 'Shfela', eventType: 'launch_report', count: 5, sourceName: 'Media reports', sourceType: 'reported', confidence: 'verified', title: 'Launch reports from eastern theater', description: 'Multiple launch reports observed. Alerts followed in Shfela region.' },
  { id: '16', timestamp: hoursAgo(20), region: 'Jerusalem', eventType: 'official_update', sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Daily situation assessment published', description: 'Home Front Command published daily assessment. Elevated alert status remains in effect for all regions.' },
  { id: '17', timestamp: hoursAgo(22), region: 'Gush Dan', city: 'Petah Tikva', eventType: 'alert', count: 1, sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Alert in eastern Gush Dan', description: 'Alert activated in Petah Tikva area.' },
  { id: '18', timestamp: hoursAgo(28), region: 'Eilat', eventType: 'alert', count: 1, sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Alert in Eilat', description: 'Single alert activated in Eilat area. Residents instructed to shelter.' },
  { id: '19', timestamp: hoursAgo(36), region: 'Coastal Plain', eventType: 'alert', count: 2, sourceName: 'Home Front Command', sourceType: 'official', confidence: 'official', title: 'Alerts along Coastal Plain', description: 'Two alerts sounded in the Coastal Plain area.' },
  { id: '20', timestamp: hoursAgo(42), region: 'Gush Dan', city: 'Tel Aviv', eventType: 'launch_report', count: 3, sourceName: 'Media reports', sourceType: 'reported', confidence: 'verified', title: 'Launch reports toward Gush Dan', description: 'Multiple launch reports detected toward Gush Dan region.' },
];

export const mockOfficialUpdates: OfficialUpdate[] = [
  { id: 'u1', timestamp: '2026-04-06T07:00:00Z', title: 'Morning situation assessment', body: 'Home Front Command reports continued elevated alert status across all regions. Residents are advised to remain aware of shelter locations and follow alert instructions promptly. No change in shelter entry time guidelines.', sourceName: 'Home Front Command', sourceType: 'official', category: 'update' },
  { id: 'u2', timestamp: '2026-04-05T18:30:00Z', title: 'Updated shelter entry guidelines', body: 'Shelter entry time for central regions has been updated. Gush Dan: 90 seconds. Sharon: 90 seconds. Jerusalem: 90 seconds. Haifa: 60 seconds. Northern communities: 30 seconds. Please review the official Home Front Command guidelines for your specific area.', sourceName: 'Home Front Command', sourceType: 'official', category: 'guidance' },
  { id: 'u3', timestamp: '2026-04-05T12:00:00Z', title: 'Daily operational summary', body: 'In the past 24 hours, 23 alerts were activated across multiple regions. The majority of incoming projectiles were intercepted. One impact was reported in an open area with no injuries. Home Front Command remains at full operational readiness.', sourceName: 'Home Front Command', sourceType: 'official', category: 'update' },
  { id: 'u4', timestamp: '2026-04-04T08:00:00Z', title: 'Public guidance reminder', body: 'All residents are reminded to: 1) Know your shelter location. 2) Enter shelter immediately upon hearing an alert. 3) Remain in shelter for 10 minutes unless otherwise instructed. 4) Follow only official Home Front Command updates.', sourceName: 'Home Front Command', sourceType: 'official', category: 'guidance' },
];

export const mockGuidance: GuidanceItem[] = [
  { id: 'g1', title: 'Shelter entry times by region', body: 'Gush Dan: 90 sec | Sharon: 90 sec | Jerusalem: 90 sec | Haifa: 60 sec | Upper Galilee: 30 sec | Northern Negev: 60 sec | Eilat: 90 sec. Enter the nearest protected space immediately upon hearing an alert.', issuedAt: '2026-04-05T18:30:00Z', sourceName: 'Home Front Command' },
  { id: 'g2', title: 'What to do during an alert', body: '1. Stop all activity immediately. 2. Enter the nearest shelter or protected space. 3. If outdoors, lie flat on the ground and protect your head. 4. Stay in shelter for 10 minutes unless otherwise instructed by Home Front Command. 5. Do not go to the roof or balcony to observe.', issuedAt: '2026-04-04T08:00:00Z', sourceName: 'Home Front Command' },
  { id: 'g3', title: 'Preparing your protected space', body: 'Ensure your shelter has water, flashlight, phone charger, first aid kit, and medications. Keep the shelter door functional and accessible at all times. Remove any items blocking the entrance.', issuedAt: '2026-04-03T10:00:00Z', sourceName: 'Home Front Command' },
  { id: 'g4', title: 'Information sources', body: 'Follow only official sources: Home Front Command app, Home Front Command website, official emergency broadcasts. Do not rely on social media rumors or unverified WhatsApp messages for safety decisions.', issuedAt: '2026-04-02T12:00:00Z', sourceName: 'Home Front Command' },
];
