# Unitree Go2 Learning Index

**Website**: https://shop.unitree.com/products/unitree-go2
**By**: Unitree Robotics
**SDK**: https://github.com/unitreerobotics/unitree_sdk2

---

## Summary

Quadruped robot (หุ่นยนต์ 4 ขา) ระดับ consumer/prosumer มี 3 รุ่น (Air/Pro/EDU) เดินได้ทุกภูมิประเทศ 5 m/s มี 4D LiDAR, 5× stereo cameras, Jetson Orin (EDU) รองรับ ROS2 และ SDK development ราคาเริ่ม $1,600

---

## Latest Exploration

**Date**: 2026-01-19

**Files**:
- [[2026-01-19_QUICK-REFERENCE|Quick Reference]] - Specs, models, SDK info

**Note**: This was a documentation study (not git clone) - used web search and official docs

---

## Key Insights

1. **EDU Model = Full Access** - Air/Pro มี SDK จำกัด, EDU เท่านั้นที่ได้ full SDK + Jetson + ROS2 official support
2. **4D LiDAR Built-in** - ไม่ต้องซื้อเพิ่ม, 360° × 90° FOV
3. **ROS2 Community SDK** - แม้ไม่ใช่ EDU ก็ใช้ ROS2 ได้ผ่าน community SDK (WebRTC/CycloneDDS)
4. **Jetson Orin Options** - 40-100 TOPS บน EDU, พอสำหรับ local AI
5. **D1 Arm Mount** - EDU Plus mount แขนกลได้

---

## Potential for Intelligence Home

### Pros
- Mobile platform - เดินลาดตระเวนได้ทั่วบ้าน
- Built-in sensors - LiDAR, cameras, IMU, mics
- Jetson Orin - local AI processing
- ROS2 - standard robotics ecosystem

### Cons
- Price - EDU ~$3,500+
- Noise - motors อาจจะเสียงดัง
- Battery - 2-4 hours ต้องชาร์จบ่อย
- Overkill? - สำหรับบ้านทั่วไปอาจจะ over

### Verdict
**Interesting but expensive** - ถ้าต้องการ mobile robot จริงๆ Go2 ดี แต่สำหรับ home automation ทั่วไป fixed sensors (SenseCAP, mmWave) + Reachy Mini น่าจะพอแล้ว

---

## Timeline

### 2026-01-19 (First exploration)
- Documentation study via web search
- Core: Quadruped robot with full sensor suite
- Notable: EDU model for development, ROS2 support
