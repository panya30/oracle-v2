# Reachy Mini Learning Index

**Repository**: https://github.com/pollen-robotics/reachy_mini
**By**: Pollen Robotics
**License**: Apache 2.0 (Software) / CC BY-SA-NC (Hardware)

---

## Summary

Open-source expressive robot ขนาด 30cm ที่มีหัวเคลื่อนไหวได้ 6 DOF (Stewart platform) + body 1 DOF + antenna 2 อัน ใช้ Dynamixel motors, RPi CM4 controller รองรับทั้ง real hardware และ MuJoCo simulation สื่อสารผ่าน Zenoh pub/sub มี SDK ที่ใช้งานง่ายมาก

---

## Latest Exploration

**Date**: 2026-01-19

**Files**:
- [[2026-01-19_ARCHITECTURE|Architecture]] - System design, daemon, backend abstraction
- [[2026-01-19_CODE-SNIPPETS|Code Snippets]] - SDK usage, kinematics, motion control
- [[2026-01-19_QUICK-REFERENCE|Quick Reference]] - Install, usage, examples

---

## Key Insights

1. **Stewart Platform Kinematics** - หัวหุ่นยนต์ใช้ parallel manipulator 6 DOF ทำให้เคลื่อนไหวได้ทุกทิศทาง เหมือนคอจริงๆ
2. **Backend Abstraction** - เขียนโค้ดครั้งเดียว รันได้ทั้ง hardware, MuJoCo sim, mockup
3. **Zenoh Pub/Sub** - ใช้ distributed messaging แยก SDK ออกจาก daemon ได้สะอาด
4. **Interpolation Library** - มี motion profile หลายแบบ (min-jerk, quintic, cartoon) ทำให้การเคลื่อนไหวดูเป็นธรรมชาติ
5. **App Framework** - มี base class สำหรับสร้าง robot application พร้อม lifecycle management

---

## Potential Applications

- **Companion Robot** - แสดงอารมณ์ โต้ตอบกับคน
- **AI Demo Platform** - ต่อ LLM/VLM ได้ง่าย มี camera + mic
- **Education** - สอน robotics, kinematics, motion planning
- **Research** - Human-robot interaction, embodied AI

---

## Timeline

### 2026-01-19 (First exploration)
- Initial discovery via /learn
- Core: Stewart platform kinematics + Zenoh architecture
- Notable: Clean backend abstraction, great for prototyping
