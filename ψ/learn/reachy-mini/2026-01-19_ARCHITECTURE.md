# Reachy Mini - Architecture Overview

**Date**: 2026-01-19
**Repository**: https://github.com/pollen-robotics/reachy_mini
**Version**: 1.2.11
**License**: Apache 2.0 (Software) / CC BY-SA-NC (Hardware)

---

## Project Overview

Reachy Mini เป็น open-source expressive robot จาก Pollen Robotics สำหรับ hackers และ AI builders รวม hardware กับ software stack ที่ครบถ้วน รองรับทั้ง real hardware และ simulation

---

## Directory Structure

```
reachy_mini/
├── src/reachy_mini/
│   ├── reachy_mini.py          # Core API - ReachyMini class
│   ├── daemon/                  # Robot control daemon
│   │   ├── daemon.py           # Daemon orchestrator
│   │   ├── app/                # FastAPI web server + dashboard
│   │   └── backend/            # Hardware control layer
│   │       ├── robot/          # Real hardware
│   │       ├── mujoco/         # Physics simulation
│   │       └── mockup_sim/     # Lightweight mockup
│   │
│   ├── io/                     # Communication layer
│   │   ├── zenoh_client.py     # Pub/sub client
│   │   ├── zenoh_server.py     # Pub/sub server
│   │   └── protocol.py         # Task definitions
│   │
│   ├── motion/                 # Motion planning
│   │   ├── goto.py             # GotoMove
│   │   └── recorded_move.py    # Playback
│   │
│   ├── kinematics/             # IK/FK engines
│   │   ├── analytical_kinematics.py
│   │   ├── placo_kinematics.py
│   │   └── nn_kinematics.py
│   │
│   ├── media/                  # Audio/video
│   │   ├── camera_opencv.py
│   │   ├── camera_gstreamer.py
│   │   └── webrtc_daemon.py
│   │
│   └── apps/                   # Application framework
│       ├── app.py              # ReachyMiniApp base
│       └── manager.py          # App management
│
├── examples/                   # Usage examples
└── tests/                      # Test suite
```

---

## Hardware Specifications

| Component | Specification |
|-----------|---------------|
| **Dimensions** | 30×20×15.5 cm |
| **Mass** | 1.475 kg |
| **Head DOF** | 6 (3 rotation + 3 translation) |
| **Body DOF** | 1 rotation (yaw) |
| **Antennas** | 2 (1 each) |
| **Motors** | Dynamixel XL330/XC330 |
| **Camera** | RPi Camera v3 wide (120° FOV) |
| **Microphones** | 4× PDM MEMS array |
| **Speaker** | 5W |
| **Battery** | 2000mAh LiFePO4 (wireless) |
| **Controller** | Raspberry Pi CM4 |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER APPLICATION                          │
│                                                              │
│  from reachy_mini import ReachyMini                         │
│  mini = ReachyMini()                                        │
│  mini.goto_target(head=pose, duration=1.0)                  │
└────────────────────────┬────────────────────────────────────┘
                         │ Zenoh Pub/Sub
┌────────────────────────▼────────────────────────────────────┐
│                       DAEMON                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   FastAPI   │  │   Zenoh     │  │   Media     │         │
│  │  Dashboard  │  │   Server    │  │  Manager    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │                    BACKEND                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │   │
│  │  │  Robot  │  │ MuJoCo  │  │ Mockup  │             │   │
│  │  │(Hardware)│  │  (Sim)  │  │  (Sim)  │             │   │
│  │  └─────────┘  └─────────┘  └─────────┘             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. ReachyMini Class (SDK)

Main user-facing API:

```python
class ReachyMini:
    def goto_target(head, antennas, duration, method)  # Smooth motion
    def set_target(head, antennas)                      # Immediate position
    def look_at(x, y, frame)                            # Vision-based targeting
    def play_sound(path)                                # Audio playback
    def enable_motors() / disable_motors()              # Motor control
```

### 2. Backend (Hardware Abstraction)

Three implementations:
- **RobotBackend** - Real hardware via serial port
- **MujocoBackend** - Full physics simulation
- **MockupSimBackend** - Lightweight mockup

### 3. Kinematics Engines

Pluggable IK/FK solvers:
- **AnalyticalKinematics** - Default, fast, closed-form
- **PlacoKinematics** - Constraint-based, collision checking
- **NNKinematics** - Neural network learned IK

### 4. Zenoh Communication

Distributed pub/sub messaging:
- **Topics**: joint_positions, head_pose, daemon_status, command
- **Modes**: localhost (TCP:7447) or network discovery (multicast/gossip)

---

## Motion Control

### Interpolation Methods

| Method | Description |
|--------|-------------|
| `MIN_JERK` | Smooth acceleration/deceleration (default) |
| `LINEAR` | Linear time interpolation |
| `QUINTIC` | 5th-order polynomial |
| `CARTOON` | Elastic/bounce effect |

### Motor Control Modes

```python
class MotorControlMode(Enum):
    Enabled = "enabled"                    # Torque ON, position controlled
    Disabled = "disabled"                  # Torque OFF
    GravityCompensation = "gravity_compensation"  # Compliant mode
```

---

## Platform Variants

| Variant | Connection | Features |
|---------|------------|----------|
| **Wireless** | WiFi | Autonomous, RPi4, IMU, battery |
| **Lite** | USB | Tethered to PC, OpenCV |
| **Simulation** | N/A | MuJoCo, no hardware |

---

## Dependencies

### Core
- `numpy>=2.2.5`
- `scipy>=1.15.3`
- `zenoh~=1.7.0`
- `opencv-python<=5.0`
- `fastapi` + `uvicorn`

### Hardware
- `reachy_mini_motor_controller>=1.5.3`
- `reachy-mini-rust-kinematics>=1.0.3`

### Optional
- `mujoco==3.3.0` (simulation)
- `placo==0.9.14` (advanced kinematics)
- `onnxruntime==1.22.1` (NN kinematics)
