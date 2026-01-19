# Unitree Go2 - Quick Reference

**Date**: 2026-01-19
**Website**: https://shop.unitree.com/products/unitree-go2
**SDK**: https://github.com/unitreerobotics/unitree_sdk2

---

## What It Does

Unitree Go2 เป็น quadruped robot (หุ่นยนต์ 4 ขา) ที่เดินได้ทุกภูมิประเทศ มี 4D LiDAR, กล้อง, และ AI computing ในตัว รองรับ ROS2 และ SDK development เหมาะสำหรับ research, education, และ patrol/inspection

---

## Model Comparison

| Feature | Air | Pro | EDU |
|---------|-----|-----|-----|
| **Price** | ~$1,600 | ~$2,800 | ~$3,500+ |
| **Speed** | 3.5 m/s | 3.5 m/s | 5 m/s |
| **Payload** | 3 kg | 8 kg | 12 kg |
| **Computing** | 8-core CPU | 8-core CPU | Jetson Orin Nano/NX |
| **AI TOPS** | - | - | 40-100 TOPS |
| **Battery** | 8000mAh | 8000mAh | 8000/15000mAh |
| **Runtime** | 1-2 hrs | 1-2 hrs | 2-4 hrs |
| **4G/eSIM** | ❌ | ✅ | ✅ |
| **Voice** | ❌ | ✅ | ✅ |
| **SDK Access** | Limited | Limited | Full |
| **ROS2** | Community | Community | Official |
| **Force Sensors** | ❌ | ❌ | ✅ |

---

## Hardware Specs

| Component | Specification |
|-----------|---------------|
| **Dimensions** | 70 × 31 × 40 cm (standing) |
| **Weight** | ~15 kg |
| **DOF** | 12 (3 per leg) |
| **Max Speed** | 5 m/s (EDU) |
| **Payload** | Up to 12 kg (EDU) |
| **Slope** | Up to 40° |
| **Obstacle** | Up to 16 cm |
| **Materials** | Aluminum alloy + engineering plastics |

---

## Sensors

| Sensor | Description |
|--------|-------------|
| **4D LiDAR L1** | 360° × 90° FOV, self-developed |
| **Stereo Depth** | 5× fish-eye cameras, full surround |
| **HD Camera** | Front-facing, real-time video |
| **IMU** | Balance and orientation |
| **Foot Force** | EDU only, contact detection |
| **Microphone** | Voice recognition (Pro/EDU) |

### Optional LiDAR Upgrades
- **MID-360** - 3D LiDAR for SLAM
- **Hesai XT16** - High-precision 3D LiDAR

---

## Computing Power

### Base (Air/Pro)
- 16-core CPU
- 384-core GPU (1.5 TFLOPS)
- Better than Nvidia TX2

### EDU Upgrade Options
- **Jetson Orin Nano** - 40 TOPS
- **Jetson Orin NX** - 100 TOPS
- Extra I/O ports
- RealSense Depth Camera

---

## Connectivity

| Protocol | Details |
|----------|---------|
| **WiFi** | WiFi 6 |
| **Bluetooth** | 5.2 |
| **4G/LTE** | eSIM (Pro/EDU) |
| **Ethernet** | Direct connection (EDU) |

---

## SDK & Development

### Official SDK (unitree_sdk2)
- **Language**: C++ (primary), Python bindings
- **Build**: CMake 3.10+
- **Platforms**: aarch64, x86_64
- **Robots**: Go2, B2, H1, G1

### ROS2 SDK (Community)
- **Repo**: https://github.com/abizovnuralem/go2_ros2_sdk
- **Models**: Air, Pro, EDU
- **Protocols**: WebRTC (WiFi), CycloneDDS (Ethernet)

### ROS2 Features
```
- Joint states @ 1 Hz
- IMU real-time
- LiDAR pointcloud @ 7 Hz
- Color camera feed
- Foot force sensors (Pro/EDU)
- Joystick teleoperation
- SLAM (slam_toolbox)
- Nav2 navigation
- COCO object detection
- Multi-robot support
```

---

## Key Capabilities

### Locomotion
- Walk, trot, run, bound
- Stair climbing
- Slope traversal (40°)
- Obstacle avoidance
- Fall recovery

### AI Features
- Person following/tracking
- Voice commands
- Object detection
- Autonomous navigation
- SLAM mapping

### Development
- Full SDK access (EDU)
- ROS2 integration
- Jetson compute
- Custom payloads
- D1 Arm mount (EDU Plus)

---

## Use Cases

1. **Research** - Locomotion, SLAM, HRI
2. **Education** - Robotics curriculum
3. **Inspection** - Patrol, monitoring
4. **Security** - Perimeter surveillance
5. **Entertainment** - Demos, exhibitions

---

## Resources

- **Shop**: https://shop.unitree.com/products/unitree-go2
- **Documentation**: https://support.unitree.com/home/en/developer
- **GitHub**: https://github.com/unitreerobotics
- **ROS2 SDK**: https://github.com/abizovnuralem/go2_ros2_sdk
