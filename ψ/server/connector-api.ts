/**
 * Personal Connector API Server
 *
 * Receives data from iPhone Shortcuts, collectors, and external sources
 * Stores in ψ/data/ for Robin to analyze
 *
 * Run: bun run ψ/server/connector-api.ts
 * Port: 3030
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Config
const DATA_DIR = './ψ/data';
const PORT = 3030;

// Helper: Get today's date string
const today = () => new Date().toISOString().split('T')[0];
const now = () => new Date().toISOString();

// Helper: Append to daily JSON file
async function appendToDaily(category: string, data: any) {
  const dir = `${DATA_DIR}/${category}`;
  const file = `${dir}/${today()}.json`;

  let existing: any[] = [];
  try {
    const content = await Bun.file(file).text();
    existing = JSON.parse(content);
  } catch {
    // File doesn't exist yet
  }

  existing.push({
    ...data,
    _timestamp: now()
  });

  await Bun.write(file, JSON.stringify(existing, null, 2));

  return { success: true, count: existing.length };
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'Robin Personal Connector',
    timestamp: now(),
    endpoints: [
      'POST /location',
      'POST /health',
      'POST /screen-time',
      'POST /battery',
      'POST /event',
      'GET /summary/today',
      'GET /summary/:date'
    ]
  });
});

// ============================================
// LOCATION
// ============================================

interface LocationData {
  lat: number;
  lng: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  label?: string;  // "home", "work", "gym", etc.
}

app.post('/location', async (c) => {
  const body = await c.req.json<LocationData>();

  if (!body.lat || !body.lng) {
    return c.json({ error: 'lat and lng required' }, 400);
  }

  const result = await appendToDaily('location', {
    lat: body.lat,
    lng: body.lng,
    altitude: body.altitude,
    accuracy: body.accuracy,
    speed: body.speed,
    label: body.label
  });

  console.log(`📍 Location: ${body.lat}, ${body.lng} ${body.label ? `(${body.label})` : ''}`);

  return c.json(result);
});

// ============================================
// HEALTH
// ============================================

interface HealthData {
  type: 'steps' | 'sleep' | 'heart_rate' | 'weight' | 'workout' | 'other';
  value: number;
  unit?: string;
  startTime?: string;
  endTime?: string;
  source?: string;
  metadata?: Record<string, any>;
}

app.post('/health', async (c) => {
  const body = await c.req.json<HealthData>();

  if (!body.type || body.value === undefined) {
    return c.json({ error: 'type and value required' }, 400);
  }

  const result = await appendToDaily('health', body);

  console.log(`💚 Health: ${body.type} = ${body.value}${body.unit || ''}`);

  return c.json(result);
});

// ============================================
// SCREEN TIME
// ============================================

interface ScreenTimeData {
  totalMinutes: number;
  apps?: Array<{
    name: string;
    minutes: number;
    category?: string;
  }>;
  pickups?: number;
  notifications?: number;
}

app.post('/screen-time', async (c) => {
  const body = await c.req.json<ScreenTimeData>();

  if (!body.totalMinutes) {
    return c.json({ error: 'totalMinutes required' }, 400);
  }

  const result = await appendToDaily('screen-time', body);

  console.log(`📱 Screen Time: ${body.totalMinutes} minutes`);

  return c.json(result);
});

// ============================================
// BATTERY
// ============================================

interface BatteryData {
  level: number;  // 0-100
  isCharging: boolean;
  lowPowerMode?: boolean;
}

app.post('/battery', async (c) => {
  const body = await c.req.json<BatteryData>();

  if (body.level === undefined) {
    return c.json({ error: 'level required' }, 400);
  }

  const result = await appendToDaily('battery', body);

  console.log(`🔋 Battery: ${body.level}%${body.isCharging ? ' ⚡' : ''}`);

  return c.json(result);
});

// ============================================
// GENERIC EVENT
// ============================================

interface EventData {
  type: string;
  data: any;
}

app.post('/event', async (c) => {
  const body = await c.req.json<EventData>();

  if (!body.type) {
    return c.json({ error: 'type required' }, 400);
  }

  const result = await appendToDaily('events', body);

  console.log(`📌 Event: ${body.type}`);

  return c.json(result);
});

// ============================================
// SUMMARIES
// ============================================

app.get('/summary/today', async (c) => {
  return c.redirect(`/summary/${today()}`);
});

app.get('/summary/:date', async (c) => {
  const date = c.req.param('date');

  const summary: Record<string, any> = { date };

  const categories = ['location', 'health', 'screen-time', 'battery', 'events'];

  for (const cat of categories) {
    try {
      const file = `${DATA_DIR}/${cat}/${date}.json`;
      const content = await Bun.file(file).text();
      summary[cat] = JSON.parse(content);
    } catch {
      summary[cat] = [];
    }
  }

  // Calculate some stats
  if (summary.location?.length > 0) {
    summary.stats = summary.stats || {};
    summary.stats.locationPoints = summary.location.length;
  }

  if (summary.health?.length > 0) {
    const steps = summary.health.find((h: any) => h.type === 'steps');
    if (steps) {
      summary.stats = summary.stats || {};
      summary.stats.steps = steps.value;
    }
  }

  if (summary['screen-time']?.length > 0) {
    const latest = summary['screen-time'][summary['screen-time'].length - 1];
    summary.stats = summary.stats || {};
    summary.stats.screenTimeMinutes = latest.totalMinutes;
  }

  return c.json(summary);
});

// ============================================
// START SERVER
// ============================================

console.log(`
╔═══════════════════════════════════════════╗
║     Robin Personal Connector API 💜        ║
╠═══════════════════════════════════════════╣
║  Port: ${PORT}                               ║
║  Data: ${DATA_DIR}                       ║
╚═══════════════════════════════════════════╝
`);

export default {
  port: PORT,
  fetch: app.fetch,
};
