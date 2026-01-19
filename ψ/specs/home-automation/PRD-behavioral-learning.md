# PRD: Behavioral Learning Home Automation

**Project**: Mira (มีระ) - "บ้านที่รู้จักเธอ"
**Version**: 1.0
**Date**: 2026-01-19
**Status**: Draft

---

## Executive Summary

ระบบ Home Automation ที่เรียนรู้พฤติกรรมของผู้อยู่อาศัยโดยอัตโนมัติ ผ่านการสังเกต 2 สัปดาห์ จากนั้นสร้าง automation rules ที่ personalized สำหรับแต่ละคน โดยไม่ต้อง configure เอง

**Core Principle**: "Observe → Learn → Predict → Act → Adapt"

---

## Table of Contents

1. [Goals & Non-Goals](#1-goals--non-goals)
2. [User Stories](#2-user-stories)
3. [System Architecture](#3-system-architecture)
4. [Hardware Requirements](#4-hardware-requirements)
5. [Software Components](#5-software-components)
6. [Data Schema](#6-data-schema)
7. [Pattern Analysis Engine](#7-pattern-analysis-engine)
8. [Automation Rules Engine](#8-automation-rules-engine)
9. [Feedback & Adaptation System](#9-feedback--adaptation-system)
10. [Privacy & Security](#10-privacy--security)
11. [API Specification](#11-api-specification)
12. [UI/Dashboard](#12-uidashboard)
13. [Implementation Phases](#13-implementation-phases)
14. [Success Metrics](#14-success-metrics)

---

## 1. Goals & Non-Goals

### Goals ✅

1. **Automatic Behavior Learning**
   - เรียนรู้ routine ของแต่ละคนใน household
   - ระบุ patterns: เวลาตื่น, เวลากลับบ้าน, ลำดับการใช้อุปกรณ์

2. **Personalized Automation**
   - สร้าง rules ที่ specific สำหรับแต่ละคน
   - แยก weekday/weekend patterns
   - รองรับ seasonal variations

3. **Zero-Config Experience**
   - ติดตั้ง → รอ 2 สัปดาห์ → ระบบทำงานเอง
   - ไม่ต้อง manually configure rules

4. **Privacy-First**
   - Process ทุกอย่าง locally
   - ไม่ส่ง data ไป cloud
   - User control เต็มที่

5. **Adaptive & Learning**
   - ปรับ rules จาก user feedback
   - Handle exceptions gracefully
   - Improve over time

### Non-Goals ❌

1. ไม่ทำ real-time face recognition (privacy concern)
2. ไม่ทำ voice command system (scope แยก)
3. ไม่ทำ security/intrusion detection (different product)
4. ไม่ integrate กับ cloud AI services
5. ไม่ทำ multi-home management

---

## 2. User Stories

### Primary User: Homeowner

```
US-01: As a homeowner, I want the system to learn my morning routine
       so that lights and curtains are ready when I wake up.

US-02: As a homeowner, I want the system to prepare the house before I arrive
       so that AC is on and lights are ready when I get home.

US-03: As a homeowner, I want different automations for weekday vs weekend
       so that I'm not woken up early on Saturday.

US-04: As a homeowner, I want to override automations easily
       so that the system learns my preferences.

US-05: As a homeowner, I want to see what the system has learned about me
       so that I understand and trust the automations.
```

### Secondary User: Family Members

```
US-06: As a family member, I want my own personalized automations
       so that the house responds to MY preferences.

US-07: As a family member, I want privacy controls
       so that my patterns aren't shared with others.
```

### Admin User

```
US-08: As an admin, I want to see system health and analytics
       so that I can ensure the system is working correctly.

US-09: As an admin, I want to manually adjust learned patterns
       so that I can correct mistakes.
```

---

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MIRA SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  PERCEPTION │  │  LEARNING   │  │  EXECUTION  │              │
│  │    LAYER    │  │    LAYER    │  │    LAYER    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         ▼                ▼                ▼                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    DATA LAYER                            │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │    │
│  │  │ Events  │  │Patterns │  │  Rules  │  │Feedback │    │    │
│  │  │   DB    │  │   DB    │  │   DB    │  │   DB    │    │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                      PERCEPTION LAYER                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐            │
│  │  SenseCAP   │   │   Phone     │   │   Smart     │            │
│  │  Watcher    │   │  Presence   │   │  Devices    │            │
│  │  (Vision)   │   │  (BLE/WiFi) │   │  (States)   │            │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘            │
│         │                 │                 │                    │
│         └────────────┬────┴────────────────┘                    │
│                      ▼                                           │
│              ┌──────────────┐                                    │
│              │ Event Ingester│                                    │
│              │   (MQTT)      │                                    │
│              └──────────────┘                                    │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                      LEARNING LAYER                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐            │
│  │   Pattern   │   │    Rule     │   │  Confidence │            │
│  │  Analyzer   │──▶│  Generator  │──▶│  Evaluator  │            │
│  └─────────────┘   └─────────────┘   └─────────────┘            │
│         │                                    │                   │
│         ▼                                    ▼                   │
│  ┌─────────────┐                    ┌─────────────┐             │
│  │  Behavior   │                    │  Feedback   │             │
│  │   Models    │◀───────────────────│  Processor  │             │
│  └─────────────┘                    └─────────────┘             │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                      EXECUTION LAYER                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐            │
│  │   Context   │   │  Automation │   │   Device    │            │
│  │  Evaluator  │──▶│   Runner    │──▶│  Controller │            │
│  └─────────────┘   └─────────────┘   └──────┬──────┘            │
│                                             │                    │
│                                             ▼                    │
│                                    ┌─────────────────┐          │
│                                    │  Home Assistant │          │
│                                    │      API        │          │
│                                    └─────────────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HOME NETWORK                              │
│                                                              │
│  ┌──────────────┐     ┌──────────────┐                      │
│  │   SenseCAP   │     │   SenseCAP   │                      │
│  │   Watcher 1  │     │   Watcher 2  │                      │
│  │  (Living Rm) │     │  (Bedroom)   │                      │
│  └──────┬───────┘     └──────┬───────┘                      │
│         │                    │                               │
│         └────────┬───────────┘                               │
│                  │ MQTT                                      │
│                  ▼                                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              MIRA SERVER (Raspberry Pi 5)           │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │    │
│  │  │ MQTT    │ │ Mira    │ │ SQLite/ │ │ Home    │  │    │
│  │  │ Broker  │ │ Core    │ │InfluxDB│ │Assistant│  │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                  │                                           │
│                  ▼                                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SMART DEVICES                           │    │
│  │  💡 Lights  🌡️ AC  🪟 Curtains  📺 TV  ☕ Coffee    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Hardware Requirements

### Required Components

| Component | Model | Qty | Purpose | Est. Price |
|-----------|-------|-----|---------|------------|
| **Vision AI Camera** | SenseCAP Watcher | 1-3 | Person detection per zone | $50-100 ea |
| **Central Server** | Raspberry Pi 5 (8GB) | 1 | Run Mira + Home Assistant | $80 |
| **Storage** | SSD 256GB | 1 | Database, logs | $30 |
| **Network** | WiFi Router | 1 | Local network | existing |

### Optional Components

| Component | Model | Purpose | Est. Price |
|-----------|-------|---------|------------|
| **Door Sensors** | Aqara Door Sensor | Entry/exit detection | $15 ea |
| **Motion Sensors** | Aqara Motion | Room presence backup | $20 ea |
| **Smart Display** | ESP32 + E-Paper | Status dashboard | $40 |
| **UPS** | Mini UPS | Power backup | $30 |

### Smart Devices (Existing/To Add)

| Category | Examples | Protocol |
|----------|----------|----------|
| **Lighting** | Philips Hue, IKEA, Yeelight | Zigbee/WiFi |
| **Curtains** | Aqara Curtain, SwitchBot | Zigbee/BLE |
| **Climate** | Smart AC, Sensibo | WiFi/IR |
| **Appliances** | Smart Plugs | WiFi/Zigbee |

### Minimum Setup

```
1x SenseCAP Watcher (main area)
1x Raspberry Pi 5
1x Phone per person (presence detection)
Existing smart devices
```

### Recommended Setup

```
2-3x SenseCAP Watcher (per zone)
1x Raspberry Pi 5 with SSD
1x Phone per person
Door sensors on main entries
Smart lights in key areas
Smart curtains in bedroom
Smart AC
```

---

## 5. Software Components

### Core Services

```
┌─────────────────────────────────────────────────────────────┐
│                    MIRA SOFTWARE STACK                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   mira-core                           │   │
│  │  TypeScript/Bun application                          │   │
│  │  - Event processing                                   │   │
│  │  - Pattern analysis                                   │   │
│  │  - Rule generation                                    │   │
│  │  - API server                                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   mira-web                            │   │
│  │  React/Next.js dashboard                              │   │
│  │  - Pattern visualization                              │   │
│  │  - Rule management                                    │   │
│  │  - Settings & privacy                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                External Services                      │   │
│  │  - Home Assistant (device control)                    │   │
│  │  - Mosquitto (MQTT broker)                           │   │
│  │  - InfluxDB (time-series data)                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Service Definitions

#### mira-core

```yaml
name: mira-core
runtime: bun
port: 3100
dependencies:
  - mqtt.js          # MQTT client
  - better-sqlite3   # SQLite for rules/config
  - influx           # InfluxDB client
  - date-fns         # Date utilities
  - zod              # Schema validation
  - hono             # HTTP server

modules:
  - event-ingester   # Receive events from sensors
  - pattern-analyzer # Analyze behavior patterns
  - rule-generator   # Create automation rules
  - rule-executor    # Execute automations
  - feedback-handler # Process user feedback
  - ha-integration   # Home Assistant API
```

#### mira-web

```yaml
name: mira-web
runtime: bun
port: 3101
dependencies:
  - react
  - next.js
  - tailwindcss
  - recharts         # Charts for patterns
  - @tanstack/query  # Data fetching

pages:
  - /                # Dashboard overview
  - /patterns        # View learned patterns
  - /rules           # Manage automation rules
  - /devices         # Device status
  - /settings        # Privacy & config
  - /persons         # Person management
```

### Directory Structure

```
mira/
├── apps/
│   ├── core/                    # mira-core
│   │   ├── src/
│   │   │   ├── index.ts         # Entry point
│   │   │   ├── config.ts        # Configuration
│   │   │   ├── events/          # Event handling
│   │   │   │   ├── ingester.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── processor.ts
│   │   │   ├── patterns/        # Pattern analysis
│   │   │   │   ├── analyzer.ts
│   │   │   │   ├── models.ts
│   │   │   │   └── extractors/
│   │   │   │       ├── morning-routine.ts
│   │   │   │       ├── arrival.ts
│   │   │   │       └── device-usage.ts
│   │   │   ├── rules/           # Rule management
│   │   │   │   ├── generator.ts
│   │   │   │   ├── executor.ts
│   │   │   │   └── templates/
│   │   │   ├── feedback/        # Feedback processing
│   │   │   │   ├── handler.ts
│   │   │   │   └── adjuster.ts
│   │   │   ├── integrations/    # External services
│   │   │   │   ├── home-assistant.ts
│   │   │   │   ├── mqtt.ts
│   │   │   │   └── influxdb.ts
│   │   │   └── api/             # HTTP API
│   │   │       ├── routes.ts
│   │   │       └── handlers/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                     # mira-web
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   └── lib/
│       └── package.json
│
├── packages/
│   └── shared/                  # Shared types/utils
│       ├── src/
│       │   ├── types.ts
│       │   └── constants.ts
│       └── package.json
│
├── deploy/
│   ├── docker-compose.yml
│   ├── home-assistant/
│   └── mosquitto/
│
└── docs/
    └── ...
```

---

## 6. Data Schema

### Event Schema (InfluxDB)

```
Measurement: events

Tags:
  - person_id: string      # "person_a", "unknown"
  - event_type: string     # "presence", "device_change", "entry_exit"
  - location: string       # "living_room", "bedroom", "kitchen"
  - device_id: string      # "light_living", "curtain_bedroom"
  - source: string         # "sensecap", "phone_ble", "ha_state"

Fields:
  - confidence: float      # 0.0 - 1.0
  - action: string         # "detected", "on", "off", "open", "close"
  - value: float           # Optional numeric value
  - metadata: string       # JSON string for extra data

Timestamp: nanoseconds
```

### Example Events

```
# Person detected in living room
events,person_id=person_a,event_type=presence,location=living_room,source=sensecap confidence=0.92,action="detected" 1705640400000000000

# Light turned on manually
events,person_id=person_a,event_type=device_change,location=living_room,device_id=light_living,source=ha_state action="on",metadata="{\"trigger\":\"manual\"}" 1705640420000000000

# Person left home
events,person_id=person_a,event_type=entry_exit,location=front_door,source=door_sensor action="exit" 1705640500000000000
```

### Pattern Schema (SQLite)

```sql
-- Persons table
CREATE TABLE persons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone_mac TEXT,              -- For BLE detection
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    settings JSON                 -- Privacy settings, preferences
);

-- Learned patterns
CREATE TABLE patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id TEXT NOT NULL,
    pattern_type TEXT NOT NULL,   -- "morning_routine", "arrival", "device_usage"
    day_type TEXT NOT NULL,       -- "weekday", "weekend", "all"

    -- Pattern data
    avg_time TIME,                -- Average time for time-based patterns
    std_deviation_minutes INTEGER,
    sequence JSON,                -- Array of actions in order
    devices JSON,                 -- Devices involved

    -- Metadata
    confidence REAL DEFAULT 0.0,
    sample_count INTEGER DEFAULT 0,
    last_updated DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (person_id) REFERENCES persons(id)
);

-- Generated rules
CREATE TABLE rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_id INTEGER,
    person_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Trigger
    trigger_type TEXT NOT NULL,   -- "time", "presence", "device_state"
    trigger_config JSON NOT NULL,

    -- Conditions
    conditions JSON,              -- Array of conditions

    -- Actions
    actions JSON NOT NULL,        -- Array of actions

    -- Status
    enabled BOOLEAN DEFAULT TRUE,
    confidence REAL DEFAULT 0.0,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    override_count INTEGER DEFAULT 0,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_executed DATETIME,
    last_modified DATETIME,

    FOREIGN KEY (pattern_id) REFERENCES patterns(id),
    FOREIGN KEY (person_id) REFERENCES persons(id)
);

-- User feedback/overrides
CREATE TABLE feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id INTEGER,
    person_id TEXT,

    feedback_type TEXT NOT NULL,  -- "override", "approve", "reject", "adjust"
    context JSON,                 -- What was happening

    -- For overrides
    original_action JSON,
    user_action JSON,

    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (rule_id) REFERENCES rules(id)
);

-- Indexes
CREATE INDEX idx_patterns_person ON patterns(person_id);
CREATE INDEX idx_patterns_type ON patterns(pattern_type, day_type);
CREATE INDEX idx_rules_person ON rules(person_id);
CREATE INDEX idx_rules_enabled ON rules(enabled);
CREATE INDEX idx_feedback_rule ON feedback(rule_id);
```

### Rule Configuration JSON Examples

```json
// Trigger configs
{
  "time": {
    "type": "time",
    "at": "06:45:00",
    "tolerance_minutes": 15
  }
}

{
  "presence": {
    "type": "presence",
    "person_id": "person_a",
    "location": "living_room",
    "state": "detected"
  }
}

{
  "device_state": {
    "type": "device_state",
    "device_id": "door_front",
    "state": "open"
  }
}

// Conditions
[
  {
    "type": "person_home",
    "person_id": "person_a"
  },
  {
    "type": "day_of_week",
    "days": ["mon", "tue", "wed", "thu", "fri"]
  },
  {
    "type": "time_range",
    "start": "06:00:00",
    "end": "09:00:00"
  }
]

// Actions
[
  {
    "type": "device",
    "device_id": "curtain_bedroom",
    "action": "open",
    "delay_seconds": 0
  },
  {
    "type": "device",
    "device_id": "coffee_machine",
    "action": "on",
    "delay_seconds": 300
  },
  {
    "type": "scene",
    "scene_id": "morning_lights"
  }
]
```

---

## 7. Pattern Analysis Engine

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  PATTERN ANALYSIS ENGINE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Raw Events                                                  │
│      │                                                       │
│      ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              EVENT PREPROCESSOR                      │    │
│  │  - Filter noise                                      │    │
│  │  - Assign person_id                                  │    │
│  │  - Normalize timestamps                              │    │
│  └─────────────────────────────────────────────────────┘    │
│      │                                                       │
│      ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              PATTERN EXTRACTORS                      │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐         │    │
│  │  │  Morning  │ │  Arrival  │ │  Device   │         │    │
│  │  │  Routine  │ │  Pattern  │ │  Usage    │         │    │
│  │  └───────────┘ └───────────┘ └───────────┘         │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐         │    │
│  │  │  Bedtime  │ │  Weekend  │ │  Seasonal │         │    │
│  │  │  Routine  │ │  Pattern  │ │  Pattern  │         │    │
│  │  └───────────┘ └───────────┘ └───────────┘         │    │
│  └─────────────────────────────────────────────────────┘    │
│      │                                                       │
│      ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              CONFIDENCE CALCULATOR                   │    │
│  │  - Sample size scoring                               │    │
│  │  - Consistency scoring                               │    │
│  │  - Recency weighting                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│      │                                                       │
│      ▼                                                       │
│  Learned Patterns                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Pattern Types

#### 1. Morning Routine Pattern

```typescript
interface MorningRoutinePattern {
  person_id: string;
  day_type: 'weekday' | 'weekend';

  wake_time: {
    average: string;        // "06:45"
    std_dev_minutes: number; // 15
    earliest: string;       // "06:15"
    latest: string;         // "07:30"
  };

  sequence: Array<{
    action: string;         // "bedroom_presence"
    relative_time: number;  // minutes after wake
    device?: string;
    confidence: number;
  }>;

  // e.g., ["bedroom_presence", "curtain_open", "bathroom_presence",
  //        "kitchen_presence", "coffee_on"]
}
```

#### 2. Arrival Pattern

```typescript
interface ArrivalPattern {
  person_id: string;
  day_type: 'weekday' | 'weekend';

  arrival_time: {
    average: string;
    std_dev_minutes: number;
  };

  pre_arrival_actions: Array<{
    action: string;
    minutes_before: number;
    device?: string;
  }>;

  post_arrival_sequence: Array<{
    action: string;
    relative_time: number;
  }>;
}
```

#### 3. Device Usage Pattern

```typescript
interface DeviceUsagePattern {
  person_id: string;
  device_id: string;

  usage_windows: Array<{
    day_type: 'weekday' | 'weekend';
    start_time: string;
    end_time: string;
    probability: number;
  }>;

  correlations: Array<{
    trigger_device: string;
    trigger_action: string;
    delay_seconds: number;
    probability: number;
  }>;
}
```

### Extraction Algorithms

#### Morning Routine Extraction

```typescript
async function extractMorningRoutine(
  personId: string,
  events: Event[],
  dayType: 'weekday' | 'weekend'
): Promise<MorningRoutinePattern | null> {

  // 1. Filter to morning hours (5:00 - 10:00)
  const morningEvents = events.filter(e => {
    const hour = getHour(e.timestamp);
    return hour >= 5 && hour <= 10;
  });

  // 2. Group by date
  const byDate = groupBy(morningEvents, e => getDateString(e.timestamp));

  // 3. Find first presence event each day (wake time proxy)
  const wakeTimes: Date[] = [];
  for (const [date, dayEvents] of Object.entries(byDate)) {
    const firstPresence = dayEvents.find(e =>
      e.event_type === 'presence' &&
      e.location === 'bedroom'
    );
    if (firstPresence) {
      wakeTimes.push(firstPresence.timestamp);
    }
  }

  // 4. Calculate statistics
  if (wakeTimes.length < 5) return null; // Need minimum samples

  const avgWakeTime = calculateAverageTime(wakeTimes);
  const stdDev = calculateStdDev(wakeTimes);

  // 5. Extract action sequence
  const sequences: string[][] = [];
  for (const [date, dayEvents] of Object.entries(byDate)) {
    const wakeTime = wakeTimes.find(w => getDateString(w) === date);
    if (!wakeTime) continue;

    // Get events within 2 hours of wake
    const routineEvents = dayEvents.filter(e =>
      e.timestamp >= wakeTime &&
      e.timestamp <= addHours(wakeTime, 2)
    );

    const sequence = routineEvents.map(e =>
      `${e.location}_${e.action}`
    );
    sequences.push(sequence);
  }

  // 6. Find most common sequence
  const commonSequence = findMostCommonSubsequence(sequences);

  // 7. Calculate confidence
  const confidence = calculatePatternConfidence({
    sampleCount: wakeTimes.length,
    stdDev,
    sequenceConsistency: calculateSequenceConsistency(sequences)
  });

  return {
    person_id: personId,
    day_type: dayType,
    wake_time: {
      average: formatTime(avgWakeTime),
      std_dev_minutes: stdDev,
      earliest: formatTime(min(wakeTimes)),
      latest: formatTime(max(wakeTimes))
    },
    sequence: commonSequence.map((action, i) => ({
      action,
      relative_time: i * 5, // Estimate
      confidence: 0.8
    })),
    confidence
  };
}
```

#### Confidence Calculation

```typescript
function calculatePatternConfidence(params: {
  sampleCount: number;
  stdDev: number;
  sequenceConsistency: number;
  recencyWeight?: number;
}): number {

  const {
    sampleCount,
    stdDev,
    sequenceConsistency,
    recencyWeight = 1.0
  } = params;

  // Sample size factor (0-1)
  // 7 samples = 0.5, 14 samples = 0.75, 28 samples = 0.9
  const sampleFactor = 1 - Math.exp(-sampleCount / 10);

  // Consistency factor (0-1)
  // Lower std dev = higher confidence
  const consistencyFactor = Math.max(0, 1 - (stdDev / 60)); // 60 min = 0

  // Sequence consistency (0-1)
  const sequenceFactor = sequenceConsistency;

  // Weighted combination
  const confidence = (
    sampleFactor * 0.3 +
    consistencyFactor * 0.4 +
    sequenceFactor * 0.3
  ) * recencyWeight;

  return Math.min(1, Math.max(0, confidence));
}
```

### Analysis Schedule

```typescript
const ANALYSIS_SCHEDULE = {
  // Full analysis after 2 weeks of data
  initial: {
    trigger: 'data_age >= 14 days',
    extractors: ['all']
  },

  // Daily incremental updates
  daily: {
    trigger: 'cron: 0 3 * * *', // 3 AM daily
    extractors: ['morning_routine', 'arrival']
  },

  // Weekly full refresh
  weekly: {
    trigger: 'cron: 0 4 * * 0', // 4 AM Sunday
    extractors: ['all']
  },

  // On significant feedback
  on_feedback: {
    trigger: 'feedback_count >= 3 in 24h',
    extractors: ['affected_patterns']
  }
};
```

---

## 8. Automation Rules Engine

### Rule Generation

```typescript
async function generateRulesFromPatterns(
  patterns: Pattern[]
): Promise<Rule[]> {

  const rules: Rule[] = [];

  for (const pattern of patterns) {
    // Skip low confidence patterns
    if (pattern.confidence < 0.6) continue;

    switch (pattern.pattern_type) {
      case 'morning_routine':
        rules.push(...generateMorningRules(pattern));
        break;
      case 'arrival':
        rules.push(...generateArrivalRules(pattern));
        break;
      case 'device_usage':
        rules.push(...generateDeviceRules(pattern));
        break;
    }
  }

  // Deduplicate and merge similar rules
  return deduplicateRules(rules);
}

function generateMorningRules(pattern: MorningRoutinePattern): Rule[] {
  const rules: Rule[] = [];

  // Pre-wake preparation rule
  const preWakeTime = subtractMinutes(
    parseTime(pattern.wake_time.average),
    5
  );

  rules.push({
    name: `${pattern.person_id}_morning_prep`,
    description: `Prepare for ${pattern.person_id}'s morning routine`,

    trigger: {
      type: 'time',
      at: formatTime(preWakeTime),
      tolerance_minutes: pattern.wake_time.std_dev_minutes
    },

    conditions: [
      { type: 'person_home', person_id: pattern.person_id },
      { type: 'day_type', value: pattern.day_type }
    ],

    actions: pattern.sequence
      .filter(s => s.action.includes('curtain') || s.action.includes('light'))
      .map(s => ({
        type: 'device',
        device_id: extractDeviceId(s.action),
        action: extractAction(s.action),
        delay_seconds: s.relative_time * 60
      })),

    confidence: pattern.confidence * 0.9 // Slightly reduce for safety
  });

  return rules;
}
```

### Rule Execution

```typescript
class RuleExecutor {
  private activeRules: Map<string, Rule> = new Map();
  private scheduledJobs: Map<string, NodeJS.Timer> = new Map();

  async loadRules() {
    const rules = await db.rules.findAll({ where: { enabled: true } });

    for (const rule of rules) {
      this.scheduleRule(rule);
    }
  }

  scheduleRule(rule: Rule) {
    // Cancel existing schedule
    if (this.scheduledJobs.has(rule.id)) {
      clearTimeout(this.scheduledJobs.get(rule.id));
    }

    switch (rule.trigger.type) {
      case 'time':
        this.scheduleTimeRule(rule);
        break;
      case 'presence':
        this.subscribePresenceRule(rule);
        break;
      case 'device_state':
        this.subscribeDeviceRule(rule);
        break;
    }
  }

  private scheduleTimeRule(rule: Rule) {
    const now = new Date();
    const targetTime = parseTime(rule.trigger.at);

    // Set to today or tomorrow
    let nextRun = setTime(now, targetTime);
    if (nextRun <= now) {
      nextRun = addDays(nextRun, 1);
    }

    const delay = nextRun.getTime() - now.getTime();

    const job = setTimeout(async () => {
      await this.executeRule(rule);
      this.scheduleTimeRule(rule); // Reschedule for next day
    }, delay);

    this.scheduledJobs.set(rule.id, job);
  }

  async executeRule(rule: Rule) {
    // 1. Check conditions
    const conditionsMet = await this.checkConditions(rule.conditions);
    if (!conditionsMet) {
      await this.logExecution(rule, 'skipped', 'conditions_not_met');
      return;
    }

    // 2. Execute actions
    for (const action of rule.actions) {
      try {
        await this.executeAction(action);
        await sleep(action.delay_seconds * 1000);
      } catch (error) {
        await this.logExecution(rule, 'error', error.message);
        return;
      }
    }

    // 3. Log success
    await this.logExecution(rule, 'success');

    // 4. Update stats
    await db.rules.update(rule.id, {
      execution_count: rule.execution_count + 1,
      success_count: rule.success_count + 1,
      last_executed: new Date()
    });
  }

  private async executeAction(action: Action) {
    switch (action.type) {
      case 'device':
        await this.ha.callService(
          getDomain(action.device_id),
          action.action,
          { entity_id: action.device_id }
        );
        break;

      case 'scene':
        await this.ha.callService('scene', 'turn_on', {
          entity_id: action.scene_id
        });
        break;
    }
  }
}
```

### Rule Templates

```typescript
const RULE_TEMPLATES = {
  morning_curtains: {
    name_template: '{person}_morning_curtains',
    description_template: 'Open curtains when {person} wakes up',
    trigger: { type: 'time', source: 'pattern.wake_time.average' },
    conditions: [
      { type: 'person_home', source: 'pattern.person_id' },
      { type: 'day_type', source: 'pattern.day_type' },
      { type: 'sun_up', value: true }
    ],
    actions: [
      { type: 'device', device_pattern: 'curtain_*', action: 'open' }
    ]
  },

  arrival_prep: {
    name_template: '{person}_arrival_prep',
    description_template: 'Prepare house before {person} arrives',
    trigger: {
      type: 'time',
      source: 'pattern.arrival_time.average',
      offset_minutes: -15
    },
    conditions: [
      { type: 'person_away', source: 'pattern.person_id' },
      { type: 'day_type', source: 'pattern.day_type' }
    ],
    actions: [
      { type: 'device', device_pattern: 'climate_*', action: 'on' },
      { type: 'device', device_pattern: 'light_entrance', action: 'on' }
    ]
  },

  bedtime_routine: {
    name_template: '{person}_bedtime',
    description_template: 'Prepare for {person} bedtime',
    trigger: { type: 'time', source: 'pattern.bedtime.average' },
    conditions: [
      { type: 'person_home', source: 'pattern.person_id' }
    ],
    actions: [
      { type: 'scene', scene_id: 'night_mode' },
      { type: 'device', device_pattern: 'light_bedroom', action: 'dim', value: 20 }
    ]
  }
};
```

---

## 9. Feedback & Adaptation System

### Feedback Types

```typescript
enum FeedbackType {
  // User manually turned off something we turned on
  OVERRIDE_OFF = 'override_off',

  // User manually turned on something we didn't
  MANUAL_ON = 'manual_on',

  // User adjusted a value we set
  VALUE_ADJUST = 'value_adjust',

  // User explicitly approved via UI
  EXPLICIT_APPROVE = 'explicit_approve',

  // User explicitly rejected via UI
  EXPLICIT_REJECT = 'explicit_reject',

  // User adjusted timing via UI
  TIMING_ADJUST = 'timing_adjust'
}
```

### Feedback Detection

```typescript
class FeedbackDetector {
  private recentAutomations: Map<string, AutomationEvent> = new Map();

  constructor(private readonly haClient: HomeAssistantClient) {
    // Subscribe to all state changes
    haClient.subscribeEvents('state_changed', this.onStateChange.bind(this));
  }

  recordAutomation(ruleId: string, deviceId: string, action: string) {
    this.recentAutomations.set(deviceId, {
      ruleId,
      deviceId,
      action,
      timestamp: new Date()
    });

    // Clear after 10 minutes
    setTimeout(() => {
      this.recentAutomations.delete(deviceId);
    }, 10 * 60 * 1000);
  }

  private async onStateChange(event: StateChangeEvent) {
    const deviceId = event.entity_id;
    const newState = event.new_state.state;
    const context = event.context;

    // Check if this was triggered by user (not automation)
    const isUserAction = !context.parent_id || context.user_id;
    if (!isUserAction) return;

    // Check if we recently automated this device
    const recentAuto = this.recentAutomations.get(deviceId);
    if (!recentAuto) return;

    // Detect override
    const timeSinceAuto = Date.now() - recentAuto.timestamp.getTime();
    if (timeSinceAuto > 5 * 60 * 1000) return; // > 5 min ago, not related

    // User overrode our action
    if (this.isOppositeAction(recentAuto.action, newState)) {
      await this.recordFeedback({
        type: FeedbackType.OVERRIDE_OFF,
        ruleId: recentAuto.ruleId,
        deviceId,
        originalAction: recentAuto.action,
        userAction: newState,
        timeSinceAutomation: timeSinceAuto
      });
    }
  }

  private isOppositeAction(autoAction: string, userState: string): boolean {
    const opposites: Record<string, string[]> = {
      'on': ['off'],
      'off': ['on'],
      'open': ['closed', 'close'],
      'close': ['open'],
      'closed': ['open']
    };
    return opposites[autoAction]?.includes(userState) ?? false;
  }
}
```

### Confidence Adjustment

```typescript
class ConfidenceAdjuster {
  // Adjustment factors
  private readonly OVERRIDE_PENALTY = 0.15;
  private readonly APPROVE_BOOST = 0.05;
  private readonly MIN_CONFIDENCE = 0.3;
  private readonly MAX_CONFIDENCE = 0.95;

  async processFeedback(feedback: Feedback) {
    const rule = await db.rules.findById(feedback.ruleId);
    if (!rule) return;

    let adjustment = 0;

    switch (feedback.type) {
      case FeedbackType.OVERRIDE_OFF:
        adjustment = -this.OVERRIDE_PENALTY;
        // Also consider time of override
        if (feedback.timeSinceAutomation < 30000) {
          // Quick override = very wrong
          adjustment *= 2;
        }
        break;

      case FeedbackType.EXPLICIT_REJECT:
        adjustment = -0.3;
        break;

      case FeedbackType.EXPLICIT_APPROVE:
        adjustment = this.APPROVE_BOOST;
        break;

      case FeedbackType.TIMING_ADJUST:
        // Adjust the trigger time
        await this.adjustTiming(rule, feedback.adjustedTime);
        break;
    }

    if (adjustment !== 0) {
      const newConfidence = Math.max(
        this.MIN_CONFIDENCE,
        Math.min(this.MAX_CONFIDENCE, rule.confidence + adjustment)
      );

      await db.rules.update(rule.id, {
        confidence: newConfidence,
        override_count: rule.override_count + (adjustment < 0 ? 1 : 0)
      });

      // Disable rule if confidence drops too low
      if (newConfidence < 0.4) {
        await db.rules.update(rule.id, { enabled: false });
        await this.notifyUser(rule, 'rule_disabled_low_confidence');
      }
    }
  }

  private async adjustTiming(rule: Rule, newTime: string) {
    // Gradually shift toward user's preferred time
    const currentTime = parseTime(rule.trigger.at);
    const targetTime = parseTime(newTime);

    // Move 30% toward target
    const adjustedTime = interpolateTime(currentTime, targetTime, 0.3);

    await db.rules.update(rule.id, {
      trigger: {
        ...rule.trigger,
        at: formatTime(adjustedTime)
      }
    });
  }
}
```

### Feedback UI Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTOMATION NOTIFICATION                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🌅 Good morning! I opened the bedroom curtains.            │
│                                                              │
│  Was this helpful?                                           │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐         │
│  │  👍 Yes │  │  👎 No  │  │  ⚙️ Adjust timing  │         │
│  └─────────┘  └─────────┘  └─────────────────────┘         │
│                                                              │
│  ℹ️ I've been doing this for 12 days with 85% accuracy      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Privacy & Security

### Privacy Principles

1. **Local-First**: All data processing happens on local server
2. **No Cloud**: No data transmitted to external services
3. **User Control**: Users can delete all their data anytime
4. **Transparency**: Users can see exactly what's learned about them
5. **Minimal Data**: Only collect what's necessary

### Data Retention

```typescript
const DATA_RETENTION = {
  // Raw events: keep 30 days, then aggregate
  raw_events: {
    hot_storage: '7 days',    // Full detail
    warm_storage: '30 days',  // Hourly aggregates
    cold_storage: '1 year'    // Daily aggregates
  },

  // Patterns: keep until user deletes
  patterns: {
    retention: 'indefinite',
    user_deletable: true
  },

  // Feedback: keep for improvement
  feedback: {
    retention: '90 days'
  }
};
```

### Data Export & Deletion

```typescript
// API endpoints
POST /api/privacy/export
// Returns: ZIP file with all user data in JSON format

POST /api/privacy/delete
// Body: { confirm: true }
// Deletes all data for user

POST /api/privacy/delete-pattern/:patternId
// Deletes specific pattern and related rules
```

### Security Measures

```yaml
# Network security
- All communication over local network only
- No port forwarding required
- mDNS for local discovery

# Authentication
- Local admin password
- Optional: Home Assistant auth integration
- API tokens for integrations

# Data encryption
- SQLite encryption at rest (SQLCipher)
- HTTPS for web dashboard (self-signed or Let's Encrypt)

# Audit logging
- All data access logged
- Pattern/rule changes logged
- Retention: 90 days
```

---

## 11. API Specification

### REST API

```yaml
openapi: 3.0.0
info:
  title: Mira API
  version: 1.0.0

paths:
  # Persons
  /api/persons:
    get:
      summary: List all persons
      responses:
        200:
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Person'

    post:
      summary: Create a person
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
                phone_mac: { type: string }

  /api/persons/{id}:
    get:
      summary: Get person details
    put:
      summary: Update person
    delete:
      summary: Delete person and all their data

  # Patterns
  /api/patterns:
    get:
      summary: List learned patterns
      parameters:
        - name: person_id
          in: query
        - name: pattern_type
          in: query

  /api/patterns/{id}:
    get:
      summary: Get pattern details
    delete:
      summary: Delete pattern

  # Rules
  /api/rules:
    get:
      summary: List automation rules
      parameters:
        - name: person_id
          in: query
        - name: enabled
          in: query

    post:
      summary: Create manual rule

  /api/rules/{id}:
    get:
      summary: Get rule details
    put:
      summary: Update rule
    delete:
      summary: Delete rule

  /api/rules/{id}/toggle:
    post:
      summary: Enable/disable rule

  # Feedback
  /api/feedback:
    post:
      summary: Submit feedback
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                rule_id: { type: integer }
                type: { type: string, enum: [approve, reject, timing_adjust] }
                adjusted_time: { type: string, format: time }

  # Analytics
  /api/analytics/overview:
    get:
      summary: Get system overview stats

  /api/analytics/patterns/{person_id}:
    get:
      summary: Get pattern analytics for person

  /api/analytics/rules:
    get:
      summary: Get rule execution stats

  # System
  /api/system/status:
    get:
      summary: Get system health status

  /api/system/reanalyze:
    post:
      summary: Trigger pattern reanalysis

components:
  schemas:
    Person:
      type: object
      properties:
        id: { type: string }
        name: { type: string }
        phone_mac: { type: string }
        created_at: { type: string, format: date-time }

    Pattern:
      type: object
      properties:
        id: { type: integer }
        person_id: { type: string }
        pattern_type: { type: string }
        day_type: { type: string }
        confidence: { type: number }
        data: { type: object }

    Rule:
      type: object
      properties:
        id: { type: integer }
        name: { type: string }
        person_id: { type: string }
        trigger: { type: object }
        conditions: { type: array }
        actions: { type: array }
        enabled: { type: boolean }
        confidence: { type: number }
```

### WebSocket Events

```typescript
// Client subscribes to real-time updates
ws.connect('ws://mira.local:3100/ws');

// Events from server
interface WSEvent {
  type: 'rule_executed' | 'pattern_updated' | 'feedback_received' |
        'device_state' | 'person_presence';
  data: any;
  timestamp: string;
}

// Example: Rule executed
{
  "type": "rule_executed",
  "data": {
    "rule_id": 123,
    "rule_name": "person_a_morning_prep",
    "status": "success",
    "actions_executed": ["curtain_bedroom:open", "coffee_machine:on"]
  },
  "timestamp": "2026-01-19T06:45:00Z"
}

// Example: Person presence
{
  "type": "person_presence",
  "data": {
    "person_id": "person_a",
    "location": "living_room",
    "confidence": 0.92
  },
  "timestamp": "2026-01-19T18:30:00Z"
}
```

---

## 12. UI/Dashboard

### Pages

#### Dashboard (/)

```
┌─────────────────────────────────────────────────────────────┐
│  MIRA                                      👤 Admin  ⚙️    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  SYSTEM STATUS                                       │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │ Learning │  │  Rules   │  │ Success  │          │    │
│  │  │  Day 12  │  │    15    │  │   92%    │          │    │
│  │  │ ████████░│  │  Active  │  │ Today    │          │    │
│  │  └──────────┘  └──────────┘  └──────────┘          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  WHO'S HOME                                          │    │
│  │                                                       │    │
│  │  👤 Person A        🏠 Home (Living Room)            │    │
│  │  👤 Person B        🚗 Away (since 08:30)            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  RECENT ACTIVITY                                     │    │
│  │                                                       │    │
│  │  18:32  ✅ person_a_arrival_prep executed            │    │
│  │  18:30  👤 Person A arrived home                     │    │
│  │  07:02  ✅ person_a_morning_prep executed            │    │
│  │  06:58  👤 Person A detected in bedroom              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  UPCOMING AUTOMATIONS                                │    │
│  │                                                       │    │
│  │  06:45 tomorrow  person_a_morning_prep               │    │
│  │  18:15 tomorrow  person_a_arrival_prep (if away)     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Patterns (/patterns)

```
┌─────────────────────────────────────────────────────────────┐
│  LEARNED PATTERNS                          [Person A ▼]     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🌅 MORNING ROUTINE (Weekday)         Confidence: 87% │    │
│  │                                                       │    │
│  │  Wake time: 06:45 ± 15 min                           │    │
│  │                                                       │    │
│  │  Sequence:                                            │    │
│  │  ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐       │    │
│  │  │ 🛏️  │ → │ 🪟  │ → │ 🚿  │ → │ ☕  │       │    │
│  │  │Bedroom│   │Curtain│   │ Bath │   │Coffee│       │    │
│  │  │ 0min │    │ +2min │   │+10min│   │+20min│       │    │
│  │  └──────┘    └──────┘    └──────┘    └──────┘       │    │
│  │                                                       │    │
│  │  Based on 12 observations                [Edit] [❌] │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🏠 ARRIVAL (Weekday)                 Confidence: 78% │    │
│  │                                                       │    │
│  │  Arrival time: 18:30 ± 45 min                        │    │
│  │                                                       │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │          Arrival Time Distribution          │    │    │
│  │  │     ▁▂▄▆█████▆▄▂▁                          │    │    │
│  │  │   17:00      18:30      20:00               │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                       │    │
│  │  Based on 10 observations                [Edit] [❌] │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Rules (/rules)

```
┌─────────────────────────────────────────────────────────────┐
│  AUTOMATION RULES                    [+ Create Rule]        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Filter: [All ▼]  [All Persons ▼]  [Enabled ▼]             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ☀️ person_a_morning_prep                    [ON]   │    │
│  │  Opens curtains and starts coffee for Person A       │    │
│  │                                                       │    │
│  │  Trigger: 06:40 (weekdays)                           │    │
│  │  Conditions: Person A home                           │    │
│  │  Actions: curtain_bedroom:open, coffee:on            │    │
│  │                                                       │    │
│  │  Stats: 12 executions, 92% success, 1 override       │    │
│  │  Confidence: 87%                                      │    │
│  │                                                       │    │
│  │  [Edit] [Test] [Disable] [Delete]                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🏠 person_a_arrival_prep                    [ON]   │    │
│  │  Prepares house before Person A arrives              │    │
│  │                                                       │    │
│  │  Trigger: 18:15 (weekdays)                           │    │
│  │  Conditions: Person A away                           │    │
│  │  Actions: ac:on (25°C), light_entrance:on            │    │
│  │                                                       │    │
│  │  Stats: 8 executions, 88% success, 0 overrides       │    │
│  │  Confidence: 78%                                      │    │
│  │                                                       │    │
│  │  [Edit] [Test] [Disable] [Delete]                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Notifications

```
┌─────────────────────────┐
│  🏠 Mira               │
│                         │
│  ☀️ Good morning!       │
│  I opened the curtains  │
│  and started your       │
│  coffee.                │
│                         │
│  [👍] [👎] [Adjust]     │
└─────────────────────────┘
```

---

## 13. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Basic infrastructure and data collection

```
Tasks:
├── Setup Raspberry Pi with Home Assistant
├── Install and configure SenseCAP Watcher
├── Setup MQTT broker (Mosquitto)
├── Setup InfluxDB for event storage
├── Create mira-core skeleton
│   ├── Event ingester (MQTT → InfluxDB)
│   ├── Person detection via phone BLE/WiFi
│   └── Basic API endpoints
└── Create simple web dashboard
    └── Show real-time events
```

**Deliverables**:
- [ ] Working SenseCAP + Home Assistant integration
- [ ] Events being logged to InfluxDB
- [ ] Person presence detection working
- [ ] Basic dashboard showing events

### Phase 2: Learning (Week 3-4)

**Goal**: Pattern analysis and rule generation

```
Tasks:
├── Implement pattern extractors
│   ├── Morning routine extractor
│   ├── Arrival pattern extractor
│   └── Device usage extractor
├── Implement confidence calculation
├── Implement rule generator
│   ├── Rule templates
│   └── Template instantiation
├── Implement rule storage (SQLite)
└── Update dashboard
    ├── Pattern visualization
    └── Rule listing
```

**Deliverables**:
- [ ] Patterns being extracted from 2 weeks of data
- [ ] Rules generated with confidence scores
- [ ] Dashboard showing patterns and rules

### Phase 3: Execution (Week 5-6)

**Goal**: Automated rule execution

```
Tasks:
├── Implement rule executor
│   ├── Time-based triggers
│   ├── Presence-based triggers
│   └── Condition evaluation
├── Implement Home Assistant integration
│   ├── Device control
│   └── Scene activation
├── Implement execution logging
└── Add rule management UI
    ├── Enable/disable rules
    ├── Manual rule creation
    └── Test rule execution
```

**Deliverables**:
- [ ] Rules executing automatically
- [ ] Full rule management in dashboard
- [ ] Execution logs and statistics

### Phase 4: Adaptation (Week 7-8)

**Goal**: Feedback loop and continuous improvement

```
Tasks:
├── Implement feedback detection
│   ├── Override detection
│   └── Manual action detection
├── Implement confidence adjuster
├── Implement feedback UI
│   ├── Notification with feedback buttons
│   └── Timing adjustment UI
├── Implement pattern reanalysis
└── Add analytics dashboard
    ├── Success rate charts
    └── Pattern evolution
```

**Deliverables**:
- [ ] System learning from user feedback
- [ ] Confidence adjusting automatically
- [ ] Analytics showing improvement over time

### Phase 5: Polish (Week 9-10)

**Goal**: Production-ready system

```
Tasks:
├── Privacy & security
│   ├── Data encryption
│   ├── Export/delete functionality
│   └── Audit logging
├── Performance optimization
│   ├── Query optimization
│   └── Memory management
├── Documentation
│   ├── User guide
│   ├── API documentation
│   └── Troubleshooting guide
├── Testing
│   ├── Unit tests
│   ├── Integration tests
│   └── Load testing
└── Deployment automation
    ├── Docker compose
    └── Backup/restore scripts
```

**Deliverables**:
- [ ] Secure, production-ready system
- [ ] Complete documentation
- [ ] Automated deployment

---

## 14. Success Metrics

### Learning Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Pattern detection rate | >80% | % of days with detected patterns |
| Pattern accuracy | >75% | User feedback approval rate |
| Time to first pattern | <14 days | Days until first rule generated |

### Execution Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Rule success rate | >85% | Executions without override / total |
| Override rate | <15% | User overrides / total executions |
| System uptime | >99% | Uptime over 30 days |

### User Experience Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Setup time | <2 hours | Time from unbox to first event |
| User satisfaction | >4/5 | Survey score |
| Config time saved | >90% | vs manual automation setup |

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Event latency | <500ms | Event to database time |
| API response time | <100ms | p95 response time |
| Memory usage | <1GB | Steady state RAM |
| Storage growth | <100MB/month | Database size increase |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Pattern** | Learned behavioral regularity (e.g., wake time, arrival time) |
| **Rule** | Automation triggered by conditions based on patterns |
| **Confidence** | 0-1 score indicating reliability of pattern/rule |
| **Override** | User manually undoing an automated action |
| **Feedback** | User input indicating satisfaction with automation |
| **Day Type** | Classification: weekday, weekend, holiday |

---

## Appendix B: Related Documents

- [SenseCAP Watcher Learning](/learn/sensecap-watcher/)
- [Home Assistant Integration Guide](TBD)
- [Privacy Policy Template](TBD)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-19
**Author**: Robin + Human
