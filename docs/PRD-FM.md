# PRD: Production-Grade FM AI HVAC Autopilot + Control Tower

Version: 0.9 (Draft for engineering kick-off)
Owner: Product/Engineering
Target users: Facility Management teams, Building Engineers, Portfolio Ops
Product concept: “Datadog for Building Operations” with an AI HVAC Autopilot wedge

---

## 1) Executive summary

This product ingests building operational telemetry (BMS/EMS), energy meters, and weather signals to provide:

1. **Control Tower (Observability + Decision Support)**
   Portfolio and building dashboards, baselines, anomaly detection, alerts, and a prioritized action feed.

2. **AI HVAC Autopilot (Recommendation-first)**
   Forecasting + constrained optimization that generates safe, explainable recommendations (setpoints/schedules/modes) to reduce energy and CO₂ while maintaining comfort constraints and operational guardrails.

The MVP is recommendation-only by default (human-in-the-loop). Closed-loop control is a later phase with explicit approvals, safety guardrails, and customer sign-off.

---

## 2) Problem statement

FM teams manage HVAC systems with:

* inconsistent telemetry naming/tagging across buildings,
* reactive workflows (alarms and complaints),
* limited ability to quantify “what action saves how much,”
* difficulty benchmarking across a portfolio.

Result: wasted energy, avoidable peak demand, comfort violations, and inefficient maintenance dispatch.

---

## 3) Goals and success metrics

### Product goals

* Reduce energy consumption and peak demand without increasing comfort violations.
* Convert raw building telemetry into **ranked, actionable interventions**.
* Standardize building data across sites (semantic layer) to scale analytics.

### MVP success metrics (per building, per month)

* **Energy**: 5–12% reduction vs weather-normalized baseline (target range depends on building type and current efficiency).
* **Comfort**: no increase in comfort violations; ideally reduce violations by 10–30%.
* **Actionability**: at least 3–10 “high confidence” actionable recommendations per week that engineers accept.
* **Trust**: recommendation acceptance rate >30% after 4 weeks; false alert rate <10% of alerts.
* **Time-to-value**: first usable dashboards within 7 days of onboarding; first recommendations within 21 days.

### Non-goals (MVP)

* Fully autonomous HVAC control without human approval.
* Replacing existing BMS front-end entirely.
* Deep retrofits or equipment replacement planning (optional later).

---

## 4) Target users and personas

1. **Chief Engineer / Building Engineer**

* Needs: reliable alerts, root-cause hints, safe recommendations, fast diagnosis.
* Pain: noisy alarms, unclear priorities, limited time.

2. **FM Manager / Property Operations**

* Needs: performance KPIs, savings proof, compliance reporting, vendor accountability.
* Pain: energy bills, occupant complaints, hard to prove ROI.

3. **Portfolio Energy Manager / ESG Manager**

* Needs: cross-building benchmarking, carbon reporting, intervention tracking.
* Pain: inconsistent data and reporting frameworks.

4. **Controls Contractor / Integrator (secondary)**

* Needs: point mapping, tagging, commissioning checks, diagnostic tools.

---

## 5) Key use cases and user journeys

### UC1: Onboard a building

* Connect to BMS + meters + weather
* Map points → semantic tags → system/equipment graph
* Validate data quality and start dashboards

**Acceptance criteria**

* A building is “onboarded” when >90% of critical HVAC points are mapped/tagged and data completeness is >95% over 7 days.

### UC2: Control Tower daily workflow

* Engineer opens dashboard: sees “Today’s top issues” ranked by impact (kWh, comfort risk, cost)
* Drills into an issue: sees evidence, trend lines, explanations, and recommended actions
* Marks action taken / defers / creates work order

### UC3: AI Autopilot recommendations

* System generates setpoint/schedule recommendations for the next day or next occupied period
* Engineer reviews and approves (or modifies)
* System tracks outcomes and updates confidence

### UC4: Savings verification (M&V-lite)

* System reports savings compared to baseline (weather-normalized), with confidence intervals and notes on confounders (events, holidays)

---

## 6) Product scope and roadmap

### MVP (P0) 12–16 weeks (pilot-ready)

* Data ingestion (read-only) + buffering
* Semantic tagging + asset graph (minimum viable)
* Dashboards + baseline + alerts
* Forecasting + recommendation engine (recommend-only)
* Explainability + audit trail
* Role-based access control + multi-tenant foundations

### P1 4–6 months (portfolio-ready)

* Advanced FDD patterns (simultaneous heating/cooling, stuck valves, sensor drift)
* CMMS integration (ServiceNow/Jira/Maximo/SAP optional)
* Portfolio benchmarking + normalized KPIs
* Reporting packs (monthly energy/carbon/performance)

### P2 6–12 months (autopilot expansion)

* Approval workflows → semi-automatic control (guardrails)
* Closed-loop pilots with rollback and safety layers
* Automated fault-to-ticket routing and fix verification

---

## 7) Functional requirements

### 7.1 Data ingestion and connectivity (Edge-first)

**Requirements**

* Support at least 2 connectivity paths:

  1. **Edge Agent/Gateway** installed on-site (recommended)
  2. **Cloud ingestion** via existing historian/API exports (optional)
* Protocol support (prioritized):

  * P0: BACnet/IP (read), Modbus TCP (read), REST/CSV export
  * P1: OPC UA, MQTT, oBIX (if needed), vendor-specific APIs
* Store-and-forward buffering (handle internet outages):

  * Buffer at least 7 days of data locally
  * Replay with correct timestamps when connectivity returns
* Time sync:

  * Edge agent must use NTP; drift detection and correction
* Device health monitoring:

  * Heartbeat, ingestion lag, point freshness, agent CPU/RAM

**Acceptance criteria**

* Data latency: 95% of points available in cloud within 5 minutes (or configured interval).
* Resilience: no data loss for up to 24h network outage (buffer + replay).

---

### 7.2 Semantic layer and asset graph

**Requirements**

* Normalize point identities into a canonical schema:

  * building → system (HVAC) → equipment (chiller/AHU/FCU/zone) → points (sensors/commands)
* Tagging and mapping UI:

  * bulk mapping, suggestions, search, and validation rules
  * support import/export of mapping configuration
* Minimum semantics for MVP:

  * point type (temp, humidity, valve position, fan speed, kW/kWh, setpoint)
  * equipment association
  * units + scaling
  * zone association (where applicable)
* Versioned configuration:

  * mapping changes are audited and reversible

**Acceptance criteria**

* 90% of critical HVAC points successfully tagged for the first building archetype.
* A model can run without manual code changes when onboarded to a second similar building.

---

### 7.3 Data quality and pre-processing

**Requirements**

* Automated QA checks:

  * missing rate, stuck sensor detection, out-of-range detection, unit mismatch heuristics
* Data cleaning policy:

  * documented interpolation rules (limited), gap handling, and exclusions
* “Quality score” per point and per equipment
* Alert when QA drops below thresholds

**Acceptance criteria**

* QA report produced daily per building and visible in Control Tower.
* Models must ignore points below a quality threshold automatically.

---

### 7.4 Control Tower dashboards (Observability)

**P0 dashboards**

* Building overview:

  * energy (kWh), demand (kW) if available, comfort compliance, HVAC runtime indicators
* HVAC system overview:

  * key temperatures, setpoints, valve/fan behavior, equipment status
* Action Feed:

  * ranked list of issues/recommendations with impact estimate and confidence
* Drill-down detail page:

  * time-series trends, explanation, recommended actions, audit log

**P0 alerts**

* Comfort violations (zone or representative spaces)
* Energy anomalies vs baseline
* Equipment behavior anomalies (e.g., stuck commands, extreme values, unexpected runtime)

**Acceptance criteria**

* Dashboard load time: P95 < 2 seconds for standard views.
* Alerts have “reason + suggested next step,” not just a threshold breach.

---

### 7.5 AI HVAC Autopilot (Recommendation-first)

**Core functions**

1. **Forecasting**

* Forecast HVAC energy (and optionally cooling load proxy) for a defined horizon:

  * 15–60 minutes ahead, plus day-ahead predictions for scheduling
* Inputs:

  * weather, time features, schedules/occupancy proxy, system states, recent history

2. **Recommendation engine**

* Generate recommended changes:

  * setpoint adjustments within allowed ranges
  * schedule shifts (start/stop times)
  * mode selection suggestions (where available)
* Optimization objective:

  * minimize energy and CO₂
  * penalize comfort risk and excessive control changes

3. **Guardrails (hard constraints)**

* Comfort bands:

  * temperature range and max duration out-of-band
* Setpoint bounds:

  * min/max setpoint per zone/system
* Rate limits:

  * no rapid oscillation; minimum hold times
* “No-go conditions”:

  * if sensor QA low, if extreme weather events, if system in maintenance mode

4. **Human approval workflow (P0)**

* Recommendations are staged:

  * Draft → Reviewed → Approved → Applied (manual) → Verified
* Record whether recommendation was accepted and outcome (feedback loop)

**Explainability (P0)**

* For each recommendation:

  * top drivers (e.g., outdoor temp spike, occupancy proxy, current overcooling pattern)
  * expected impact (kWh, cost, CO₂) and confidence band
  * risk flags (comfort risk, data uncertainty)

**Acceptance criteria**

* Forecast accuracy meets minimum threshold (to be set per building type; e.g., MAPE < 15–25% for short horizon).
* Recommendations never violate hard constraints in simulation/replay testing.
* Each recommendation includes: action, reason, expected impact, risk, and rollback guidance.

---

### 7.6 CO₂ and sustainability reporting (P0-lite)

**Requirements**

* Convert energy savings to CO₂ using a configurable grid emissions factor:

  * building-level factor; optionally time-of-use factor later
* Reporting:

  * monthly savings summary: kWh, cost (tariff), CO₂
  * intervention tracking: what actions drove savings

**Acceptance criteria**

* CO₂ reporting is reproducible and auditable (factor versioned, source documented).

---

### 7.7 Integrations (P1 but design now)

* CMMS/ticketing integration via:

  * webhooks + REST API
  * connectors (ServiceNow/Jira/Maximo) depending on market
* Notification channels:

  * email + Microsoft Teams; optional LINE for Thailand market
* Data export:

  * CSV/Parquet export; API endpoints for BI tools

---

### 7.8 User management and auditability

**Requirements**

* Multi-tenant architecture (portfolio, building, team)
* RBAC roles:

  * Admin, FM Manager, Building Engineer, Viewer
* SSO:

  * OIDC (P0), SAML (P1)
* Audit logs:

  * login, config changes, recommendations, acknowledgements

**Acceptance criteria**

* Every recommendation and mapping change has an immutable audit record.

---

## 8) Non-functional requirements (production-grade)

### Availability and reliability

* SaaS uptime target: 99.9% monthly for Control Tower
* Edge agent must continue buffering during outages and recover automatically

### Performance

* Ingestion pipeline: handle 50k–500k points per building portfolio (scalable)
* Alerting: end-to-end detection within 5 minutes (configurable)
* Dashboard: P95 <2 seconds; P99 <5 seconds for common queries

### Security

* Encryption in transit: TLS 1.2+; mTLS for agent-to-cloud preferred
* Encryption at rest: AES-256 or cloud-managed equivalent
* Secrets management: vault or cloud KMS
* Principle of least privilege; network segmentation for edge deployment
* Vulnerability management: signed agent builds, update mechanism, SBOM

### Privacy

* Avoid PII by design; occupancy should be aggregated or anonymized
* Access controls by role and building

### Data governance

* Retention:

  * raw telemetry: 13 months (configurable)
  * aggregated metrics: 3–5 years
* Data lineage: versioned mappings, model versions, emission factors

### Compliance readiness (not necessarily certified at MVP)

* SOC2/ISO27001-aligned controls plan (roadmap)
* Incident response process and logging

---

## 9) Architecture overview (recommended)

### Deployment model

* **Edge Agent** (customer site): protocol connectors, buffering, local health checks
* **Cloud platform**:

  * ingestion API + stream processing
  * time-series store + event store
  * model inference service
  * web app + API gateway

### Key services

* Ingestion Service
* Data QA Service
* Semantic/Asset Graph Service
* Analytics/Alerting Service
* Forecasting & Recommendation Service
* Reporting Service (energy/cost/CO₂)
* Auth/RBAC Service
* Audit Log Service

---

## 10) MLOps requirements

* Training pipeline: reproducible runs, dataset snapshots, feature store optional
* Model registry: versioning, approvals, rollback
* Monitoring:

  * prediction drift, data drift, model performance decay
  * alert for “model not reliable today” conditions
* Evaluation:

  * offline replay with baselines
  * canary release on a subset of zones/systems
* Feedback loop:

  * engineer accepts/rejects recommendation + reason tags

---

## 11) Measurement and verification plan (M&V-lite)

Minimum credible savings proof:

* Weather normalization (degree-day regression or comparable method)
* Baselines:

  * historical baseline (same season)
  * schedule-based baseline
* Report confidence bands:

  * identify abnormal periods (holidays, events, outages)

---

## 12) Rollout plan

### Phase 0: Internal alpha (2–4 weeks)

* One building, limited points, dashboards and ingestion stability

### Phase 1: Pilot (4–8 weeks)

* Full HVAC points, QA gates, recommendations in review mode
* Weekly review with engineers to validate safety and practicality

### Phase 2: Portfolio expansion

* Add 3–10 buildings, validate onboarding speed, benchmarking

---

## 13) Risks and mitigations

1. **Data inconsistency across buildings**

* Mitigation: semantic tagging tooling + templates by building archetype

2. **Recommendation causes comfort complaints**

* Mitigation: strict comfort constraints, recommendation-only mode, safety guardrails, rollback

3. **Integration friction with BMS vendors**

* Mitigation: read-only connectors + edge agent; avoid control writes in MVP

4. **Alert fatigue**

* Mitigation: rank by impact, tune thresholds, suppress duplicates, require “next action” guidance

5. **Security concerns in OT environments**

* Mitigation: mTLS, minimal network exposure, signed agent, clear security documentation

---

## 14) Open assumptions to validate in week 1–2 (no blockers to drafting now)

* Building HVAC topology: chiller/AHU vs VRF vs split
* Point sampling frequency and completeness
* Availability of submetering vs whole-building only
* Comfort bands and operational constraints approved by stakeholders
* Whether any control writes are allowed (recommend-only vs approved control later)

---

## 15) MVP “Definition of Done” checklist

* ✅ Edge ingestion stable with buffering and health monitoring
* ✅ 90% critical HVAC points mapped and tagged
* ✅ Control Tower dashboards live with baselines + alerts
* ✅ Forecasting + recommendation engine produces daily recommendations
* ✅ Each recommendation includes reason + expected impact + risk + audit record
* ✅ Role-based access + multi-tenant ready
* ✅ Pilot report: energy impact + comfort impact + engineer feedback
