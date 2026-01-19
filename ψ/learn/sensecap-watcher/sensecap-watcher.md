# SenseCAP Watcher Learning Index

**Repository**: https://github.com/Seeed-Studio/OSHW-SenseCAP-Watcher
**By**: Seeed Studio
**License**: Apache 2.0

---

## Summary

Open-source AI camera/assistant ที่รวม ESP32-S3 + Himax HX6538 NPU สามารถทำ vision AI ได้ทั้ง local และ cloud สั่งงานด้วยภาษาธรรมชาติ รองรับ Home Assistant, Node-RED, MQTT

---

## Latest Exploration

**Date**: 2026-01-19

**Files**:
- [[2026-01-19_ARCHITECTURE|Architecture]] - Dual-chip design, Task Flow Engine
- [[2026-01-19_CODE-SNIPPETS|Code Snippets]] - Emotion sensor, E-paper examples
- [[2026-01-19_QUICK-REFERENCE|Quick Reference]] - Specs, flash instructions, use cases

---

## Key Insights

1. **Dual-Chip Architecture** - ESP32-S3 (control) + Himax HX6538 (AI NPU) แยก workload ได้ดี
2. **Task Flow Engine** - Node-RED style JSON orchestration, composable modules
3. **Privacy-First Design** - รัน 100% offline ได้, ไม่ต้องพึ่ง cloud
4. **Grove Ecosystem** - Plug-and-play sensors/actuators

---

## Timeline

### 2026-01-19 (First exploration)
- Initial discovery via /learn
- Core: Task Flow Engine + Dual-chip architecture
- Notable: Can run completely offline, 2s response time
