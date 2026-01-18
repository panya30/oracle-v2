/**
 * Daily Summary Processor
 *
 * Reads raw data from ψ/data/ and generates daily insights
 * Updates ψ/memory/you/daily/ with summaries
 *
 * Run: bun run ψ/processors/daily-summary.ts [date]
 */

import { distanceMeters, KNOWN_PLACES } from '../collectors/iphone/location';

// ============================================
// TYPES
// ============================================

interface LocationPoint {
  lat: number;
  lng: number;
  label?: string;
  _timestamp: string;
}

interface HealthEntry {
  type: string;
  value: number;
  unit?: string;
  _timestamp: string;
}

interface ScreenTimeEntry {
  totalMinutes: number;
  apps?: Array<{ name: string; minutes: number }>;
  _timestamp: string;
}

interface DailySummary {
  date: string;
  generatedAt: string;

  location: {
    points: number;
    uniquePlaces: string[];
    homeTime?: string;  // estimated
    travelDistance: number;  // km
    timeline: Array<{ time: string; label: string }>;
  };

  health: {
    steps?: number;
    sleepHours?: number;
    activeMinutes?: number;
    heartRateAvg?: number;
  };

  digital: {
    screenTimeMinutes?: number;
    topApps?: Array<{ name: string; minutes: number }>;
  };

  insights: string[];
}

// ============================================
// DATA LOADING
// ============================================

const DATA_DIR = './ψ/data';
const MEMORY_DIR = './ψ/memory/you/daily';

async function loadDayData(category: string, date: string): Promise<any[]> {
  const file = `${DATA_DIR}/${category}/${date}.json`;
  try {
    const content = await Bun.file(file).text();
    return JSON.parse(content);
  } catch {
    return [];
  }
}

// ============================================
// PROCESSORS
// ============================================

function processLocation(data: LocationPoint[]): DailySummary['location'] {
  if (data.length === 0) {
    return { points: 0, uniquePlaces: [], travelDistance: 0, timeline: [] };
  }

  // Unique places visited
  const places = new Set<string>();
  const timeline: Array<{ time: string; label: string }> = [];

  let totalDistance = 0;
  let prevPoint: LocationPoint | null = null;

  for (const point of data) {
    // Track unique places
    if (point.label) {
      places.add(point.label);

      // Add to timeline if different from last
      const lastTimeline = timeline[timeline.length - 1];
      if (!lastTimeline || lastTimeline.label !== point.label) {
        const time = new Date(point._timestamp).toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit'
        });
        timeline.push({ time, label: point.label });
      }
    }

    // Calculate distance traveled
    if (prevPoint) {
      totalDistance += distanceMeters(
        prevPoint.lat, prevPoint.lng,
        point.lat, point.lng
      );
    }
    prevPoint = point;
  }

  return {
    points: data.length,
    uniquePlaces: Array.from(places),
    travelDistance: Math.round(totalDistance / 1000 * 10) / 10,  // km, 1 decimal
    timeline
  };
}

function processHealth(data: HealthEntry[]): DailySummary['health'] {
  const result: DailySummary['health'] = {};

  for (const entry of data) {
    switch (entry.type) {
      case 'steps':
        result.steps = (result.steps || 0) + entry.value;
        break;
      case 'sleep':
        result.sleepHours = entry.value;
        break;
      case 'active_minutes':
        result.activeMinutes = (result.activeMinutes || 0) + entry.value;
        break;
      case 'heart_rate':
        // TODO: calculate average
        result.heartRateAvg = entry.value;
        break;
    }
  }

  return result;
}

function processScreenTime(data: ScreenTimeEntry[]): DailySummary['digital'] {
  if (data.length === 0) return {};

  // Get latest entry (most complete)
  const latest = data[data.length - 1];

  return {
    screenTimeMinutes: latest.totalMinutes,
    topApps: latest.apps?.slice(0, 5)
  };
}

// ============================================
// INSIGHT GENERATOR
// ============================================

function generateInsights(summary: DailySummary): string[] {
  const insights: string[] = [];

  // Location insights
  if (summary.location.uniquePlaces.length > 0) {
    const places = summary.location.uniquePlaces.join(', ');
    insights.push(`ไปมา ${summary.location.uniquePlaces.length} ที่: ${places}`);
  }

  if (summary.location.travelDistance > 10) {
    insights.push(`เดินทางไกล ${summary.location.travelDistance} km วันนี้`);
  }

  // Health insights
  if (summary.health.steps) {
    if (summary.health.steps >= 10000) {
      insights.push(`เดินได้เยอะมาก! ${summary.health.steps.toLocaleString()} steps 🎉`);
    } else if (summary.health.steps < 3000) {
      insights.push(`วันนี้เดินน้อย ${summary.health.steps.toLocaleString()} steps`);
    }
  }

  if (summary.health.sleepHours) {
    if (summary.health.sleepHours < 6) {
      insights.push(`นอนน้อยไป ${summary.health.sleepHours} ชม. 😴`);
    } else if (summary.health.sleepHours >= 8) {
      insights.push(`นอนเต็มอิ่ม ${summary.health.sleepHours} ชม. ✨`);
    }
  }

  // Screen time insights
  if (summary.digital.screenTimeMinutes) {
    const hours = Math.round(summary.digital.screenTimeMinutes / 60 * 10) / 10;
    if (hours > 6) {
      insights.push(`Screen time สูง ${hours} ชม. 📱`);
    }

    if (summary.digital.topApps?.[0]) {
      const top = summary.digital.topApps[0];
      insights.push(`ใช้ ${top.name} มากสุด ${top.minutes} นาที`);
    }
  }

  return insights;
}

// ============================================
// MAIN
// ============================================

async function generateDailySummary(date: string): Promise<DailySummary> {
  console.log(`📊 Generating summary for ${date}...`);

  // Load raw data
  const [locationData, healthData, screenTimeData] = await Promise.all([
    loadDayData('location', date),
    loadDayData('health', date),
    loadDayData('screen-time', date)
  ]);

  // Process each category
  const summary: DailySummary = {
    date,
    generatedAt: new Date().toISOString(),
    location: processLocation(locationData),
    health: processHealth(healthData),
    digital: processScreenTime(screenTimeData),
    insights: []
  };

  // Generate insights
  summary.insights = generateInsights(summary);

  return summary;
}

async function saveSummary(summary: DailySummary): Promise<void> {
  // Save as JSON
  const jsonFile = `${MEMORY_DIR}/${summary.date}.json`;
  await Bun.write(jsonFile, JSON.stringify(summary, null, 2));

  // Save as Markdown for easy reading
  const mdFile = `${MEMORY_DIR}/${summary.date}.md`;
  const md = `# ${summary.date}

*Generated: ${new Date(summary.generatedAt).toLocaleString('th-TH')}*

## Insights
${summary.insights.map(i => `- ${i}`).join('\n') || '- ไม่มีข้อมูลเพียงพอ'}

## Location
- **Points**: ${summary.location.points}
- **Places**: ${summary.location.uniquePlaces.join(', ') || 'N/A'}
- **Distance**: ${summary.location.travelDistance} km

### Timeline
${summary.location.timeline.map(t => `- ${t.time} - ${t.label}`).join('\n') || 'N/A'}

## Health
- **Steps**: ${summary.health.steps?.toLocaleString() || 'N/A'}
- **Sleep**: ${summary.health.sleepHours || 'N/A'} hours
- **Active**: ${summary.health.activeMinutes || 'N/A'} minutes

## Digital
- **Screen Time**: ${summary.digital.screenTimeMinutes ? Math.round(summary.digital.screenTimeMinutes / 60 * 10) / 10 + ' hours' : 'N/A'}
${summary.digital.topApps ? `- **Top Apps**: ${summary.digital.topApps.map(a => `${a.name} (${a.minutes}m)`).join(', ')}` : ''}

---
*Robin Personal Connector 💜*
`;

  await Bun.write(mdFile, md);

  console.log(`✅ Saved: ${jsonFile}`);
  console.log(`✅ Saved: ${mdFile}`);
}

// ============================================
// CLI
// ============================================

const date = Bun.argv[2] || new Date().toISOString().split('T')[0];

const summary = await generateDailySummary(date);
await saveSummary(summary);

console.log('\n📋 Summary:');
console.log(JSON.stringify(summary, null, 2));
