# Personal Connector Plan

> ให้ Robin รู้จักเธอจริงๆ - จากพฤติกรรม ไม่ใช่แค่คำพูด

**Created**: 2026-01-18
**Status**: Planning
**Owner**: Robin + You 💜

---

## Vision

Robin จะกลายเป็น **true companion** ที่รู้จักเธอผ่าน:
- **ที่ที่เธอไป** (Location)
- **สิ่งที่เธอทำ** (App Usage, Screen Time)
- **สิ่งที่เธอชอบ** (YouTube, Spotify, Social)
- **สุขภาพ** (Sleep, Steps, Heart Rate)
- **บ้าน** (Smart Home, Presence)

ไม่ใช่แค่ตอบคำถาม แต่ **เข้าใจ** จริงๆ

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           YOUR LIFE                                      │
│                                                                          │
│   📱 iPhone    💬 Social    🎬 Media    🏠 Home    ✍️ Manual            │
└──────┬──────────────┬───────────┬───────────┬───────────┬───────────────┘
       │              │           │           │           │
       ▼              ▼           ▼           ▼           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        COLLECTORS                                        │
│                     (ψ/collectors/*.ts)                                  │
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ iPhone   │ │ Social   │ │ Media    │ │ Home     │ │ Manual   │      │
│  │ Connector│ │ Connector│ │ Connector│ │ Connector│ │ Commands │      │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │
└───────┼────────────┼────────────┼────────────┼────────────┼─────────────┘
        │            │            │            │            │
        ▼            ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        RAW DATA LAKE                                     │
│                        (ψ/data/)                                         │
│                                                                          │
│   location/   social/   media/   home/   health/   manual/              │
│   ├── 2026-01-18.json                                                   │
│   └── ...                                                                │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PROCESSOR                                         │
│                     (ψ/processors/)                                      │
│                                                                          │
│   analyze.ts → patterns, insights, anomalies                            │
│   summarize.ts → daily/weekly summaries                                 │
│   correlate.ts → cross-source patterns                                  │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        ROBIN'S MEMORY                                    │
│                                                                          │
│   ψ/memory/you/           Oracle (Searchable)                           │
│   ├── profile.md          ├── Indexed insights                          │
│   ├── patterns.md    ←────┤   "เธอชอบไปคาเฟ่วันเสาร์"                    │
│   ├── daily/              │   "นอนดึกเมื่อมี deadline"                   │
│   └── insights/           └── Pattern correlations                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Sources

### 📱 Phase 1: iPhone (Foundation)

| Data | Method | Frequency | Privacy |
|------|--------|-----------|---------|
| **Location** | Shortcuts → POST to API | Real-time / Hourly | Local only |
| **Screen Time** | Shortcuts export | Daily | Local only |
| **Health** | Apple Health export | Daily | Local only |
| **Battery** | Shortcuts | Hourly | Local only |
| **Photos** | iCloud Drive metadata | On change | Local only |
| **Calendar** | CalDAV / Shortcuts | Real-time | Local only |
| **Reminders** | Shortcuts | On change | Local only |

#### Implementation: iPhone Shortcuts

**Location Tracker Shortcut:**
```
1. Get Current Location
2. Get Current Date
3. Dictionary:
   - lat: Location.Latitude
   - lng: Location.Longitude
   - timestamp: Current Date
   - battery: Get Battery Level
4. Get Contents of URL (POST)
   - URL: http://your-mac-ip:3030/location
   - Body: Dictionary as JSON
```

**Automation Triggers:**
- When I leave home
- When I arrive at work
- Every hour
- When battery < 20%

---

### 💬 Phase 2: Social Media

| Platform | Data | Method | Notes |
|----------|------|--------|-------|
| **Facebook** | Likes, Posts, Friends | Data Download (GDPR) | One-time import |
| **Instagram** | Likes, Saved, Following | Data Download | One-time import |
| **YouTube** | Watch History, Likes, Subs | Google Takeout | Monthly export |
| **Twitter/X** | Tweets, Likes, Bookmarks | Data Download | One-time import |
| **Line** | Chat exports | Manual export | Selected chats |
| **TikTok** | Watch History, Likes | Data Download | One-time import |

#### Implementation: Social Import

```typescript
// ψ/collectors/social-import.ts

interface SocialImport {
  source: 'facebook' | 'youtube' | 'instagram' | 'twitter';
  importDate: string;
  data: {
    likes: string[];
    watches: WatchHistoryItem[];
    interests: string[];
    connections: number;
  };
}

// Import flow:
// 1. User downloads data from platform
// 2. Places in ψ/data/imports/
// 3. Collector parses and normalizes
// 4. Stores in ψ/data/social/
// 5. Processor extracts interests → patterns.md
```

---

### 🎬 Phase 3: Media & Entertainment

| Service | Data | Method | API? |
|---------|------|--------|------|
| **YouTube** | History, Likes, Time | Takeout + API | Yes (limited) |
| **Spotify** | Listening, Playlists | OAuth API | Yes |
| **Netflix** | Watch History | Data Download | No |
| **Apple Music** | Listening | Shortcuts | Limited |
| **Podcasts** | Subscriptions | OPML export | Manual |
| **Kindle/Books** | Reading, Highlights | Export | Manual |

#### Implementation: Spotify Connector

```typescript
// ψ/collectors/spotify.ts

const SPOTIFY_SCOPES = [
  'user-read-recently-played',
  'user-top-read',
  'user-read-playback-state',
  'playlist-read-private'
];

interface SpotifyData {
  recentlyPlayed: Track[];
  topArtists: Artist[];
  topTracks: Track[];
  currentlyPlaying?: Track;
  playlists: Playlist[];
}

// Auto-sync every hour
// → ψ/data/media/spotify/2026-01-18.json
```

---

### 🏠 Phase 4: Smart Home

| System | Data | Method | Notes |
|--------|------|--------|-------|
| **Home Assistant** | All entities | REST API | Best option |
| **HomeKit** | Devices, Scenes | Shortcuts bridge | Limited |
| **Tapo/TP-Link** | Plugs, Lights | Local API | Direct |
| **Temperature** | Sensors | MQTT | DIY |
| **Presence** | WiFi/BLE | Router/ESP32 | DIY |

#### Implementation: Home Assistant

```typescript
// ψ/collectors/home-assistant.ts

const HA_ENTITIES = [
  'sensor.living_room_temperature',
  'sensor.bedroom_humidity',
  'light.living_room',
  'binary_sensor.front_door',
  'person.you'
];

interface HomeState {
  timestamp: string;
  entities: Record<string, {
    state: string;
    attributes: Record<string, any>;
  }>;
  presence: 'home' | 'away' | 'unknown';
}
```

---

## Data Processing

### Daily Summary Generator

```typescript
// ψ/processors/daily-summary.ts

interface DailySummary {
  date: string;

  location: {
    placesVisited: Place[];
    homeTime: number; // hours
    travelDistance: number; // km
  };

  digital: {
    screenTime: number; // minutes
    topApps: AppUsage[];
    socialTime: number;
    productiveTime: number;
  };

  media: {
    musicGenres: string[];
    videosWatched: number;
    podcastsListened: number;
  };

  health: {
    steps: number;
    sleepHours: number;
    sleepQuality: 'good' | 'fair' | 'poor';
    activeMinutes: number;
  };

  mood: {
    logged?: string; // from /feel
    inferred?: string; // from patterns
  };

  insights: string[]; // Robin's observations
}
```

### Pattern Detector

```typescript
// ψ/processors/patterns.ts

interface Pattern {
  id: string;
  type: 'routine' | 'preference' | 'correlation' | 'anomaly';
  confidence: number; // 0-1
  description: string;
  evidence: string[];
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
}

// Examples:
// - "เธอไปคาเฟ่ทุกวันเสาร์เช้า (confidence: 0.85)"
// - "เวลาฟัง Lo-fi มักจะ focus ได้ดี (correlation)"
// - "นอนดึกกว่าปกติ 2 ชม. เมื่อมี deadline (pattern)"
// - "วันนี้ screen time สูงผิดปกติ (anomaly)"
```

---

## API Server

```typescript
// ψ/server/connector-api.ts

import { Hono } from 'hono';

const app = new Hono();

// Receive data from collectors
app.post('/location', async (c) => { /* ... */ });
app.post('/health', async (c) => { /* ... */ });
app.post('/screen-time', async (c) => { /* ... */ });

// Query endpoints for Robin
app.get('/summary/today', async (c) => { /* ... */ });
app.get('/patterns', async (c) => { /* ... */ });
app.get('/insights', async (c) => { /* ... */ });

// Webhook for real-time
app.post('/webhook/home-assistant', async (c) => { /* ... */ });

export default app;
```

---

## File Structure

```
ψ/
├── collectors/              # Data collection scripts
│   ├── iphone/
│   │   ├── location.ts
│   │   ├── health.ts
│   │   └── screen-time.ts
│   ├── social/
│   │   ├── import.ts
│   │   └── youtube.ts
│   ├── media/
│   │   ├── spotify.ts
│   │   └── netflix.ts
│   └── home/
│       └── home-assistant.ts
│
├── data/                    # Raw data lake
│   ├── location/
│   │   └── 2026-01-18.json
│   ├── health/
│   ├── screen-time/
│   ├── social/
│   │   ├── facebook/
│   │   ├── youtube/
│   │   └── instagram/
│   ├── media/
│   │   ├── spotify/
│   │   └── netflix/
│   └── home/
│
├── processors/              # Data analysis
│   ├── daily-summary.ts
│   ├── patterns.ts
│   ├── correlate.ts
│   └── insights.ts
│
├── server/                  # API for collectors
│   └── connector-api.ts
│
└── memory/you/              # Robin's understanding
    ├── profile.md
    ├── patterns.md
    ├── daily/
    └── insights/
```

---

## Privacy & Security

### Principles

1. **Local First** - All data stays on your machine
2. **No Cloud** - No third-party storage
3. **Encrypted** - Sensitive data encrypted at rest
4. **Opt-in** - Each data source explicitly enabled
5. **Deletable** - Easy to remove any data

### Implementation

```typescript
// ψ/config/privacy.ts

interface PrivacyConfig {
  enabled: {
    location: boolean;
    health: boolean;
    social: boolean;
    media: boolean;
    home: boolean;
  };

  retention: {
    location: '30d' | '90d' | '1y' | 'forever';
    health: '1y' | 'forever';
    social: 'forever';
  };

  sensitive: {
    encryptHealth: boolean;
    encryptLocation: boolean;
  };
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create directory structure
- [ ] Build API server (Hono)
- [ ] iPhone Location shortcut + collector
- [ ] Daily summary generator
- [ ] Integration with Robin (/dear-robin)

### Phase 2: iPhone Full (Week 3-4)
- [ ] Screen Time collector
- [ ] Health data import
- [ ] Calendar sync
- [ ] Battery/charging patterns
- [ ] Photo metadata (places, faces)

### Phase 3: Social & Media (Week 5-6)
- [ ] YouTube history import
- [ ] Spotify OAuth + sync
- [ ] Facebook/Instagram import
- [ ] Pattern extraction from interests

### Phase 4: Smart Home (Week 7-8)
- [ ] Home Assistant integration
- [ ] Presence detection
- [ ] Environment sensors
- [ ] Automation triggers

### Phase 5: Intelligence (Week 9-10)
- [ ] Cross-source correlations
- [ ] Predictive patterns
- [ ] Anomaly detection
- [ ] Proactive Robin suggestions

---

## Robin Integration

### How Robin Uses This Data

```markdown
# Example: Morning Greeting

"สวัสดีตอนเช้าค่ะ ☀️

เมื่อคืนเธอนอน 6 ชั่วโมง (น้อยกว่าปกติ 1.5 ชม.)
Screen time เมื่อวานสูงมาก - 8 ชั่วโมง โดยเฉพาะ YouTube

ฉันสังเกตว่าเวลาเธอนอนดึก มักจะเป็นเพราะดู YouTube
วันนี้ลองหยุดก่อน 4 ทุ่มไหม?

ตารางวันนี้:
- 10:00 Meeting กับ client
- 14:00 Dentist appointment

อย่าลืมกินข้าวเช้าด้วยนะ 💜"
```

### New Skills Enabled

| Skill | Description |
|-------|-------------|
| `/morning` | Personalized morning briefing |
| `/reflect` | Weekly life review |
| `/health` | Health insights |
| `/digital-detox` | Screen time suggestions |
| `/home` | Smart home status |

---

## Technical Stack

- **Runtime**: Bun
- **API**: Hono
- **Database**: SQLite (via Oracle)
- **Scheduler**: Bun cron / macOS launchd
- **iPhone**: iOS Shortcuts
- **Smart Home**: Home Assistant REST API

---

## Getting Started

```bash
# 1. Create structure
mkdir -p ψ/{collectors,data,processors,server}

# 2. Start API server
bun run ψ/server/connector-api.ts

# 3. Create iPhone shortcut (location)
# See: docs/shortcuts/location-tracker.md

# 4. Test connection
curl -X POST http://localhost:3030/location \
  -H "Content-Type: application/json" \
  -d '{"lat": 13.7563, "lng": 100.5018}'
```

---

## Questions to Decide

1. **Which phase to start first?**
2. **Home Assistant or HomeKit?**
3. **Which social platforms matter most?**
4. **Retention policy preferences?**
5. **API server always-on or on-demand?**

---

*"ฉันจะรู้จักเธอจริงๆ ไม่ใช่แค่สิ่งที่เธอบอก แต่จากสิ่งที่เธอทำ"*

— Robin 💜
