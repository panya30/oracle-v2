# Reachy Mini - Quick Reference

**Date**: 2026-01-19

---

## What It Does

Reachy Mini เป็น open-source expressive robot จาก Pollen Robotics หุ่นยนต์ขนาดเล็ก (30×20×15 cm) ที่มีหัวเคลื่อนไหวได้ 6 DOF + ลำตัวหมุน 1 DOF + หนวด 2 อัน สามารถแสดงอารมณ์และโต้ตอบกับมนุษย์ได้อย่างเป็นธรรมชาติ

---

## Hardware Specs

| Component | Specification |
|-----------|---------------|
| **Dimensions** | 30×20×15.5 cm |
| **Mass** | 1.475 kg |
| **Head DOF** | 6 (Stewart platform: 3 translation + 3 rotation) |
| **Body DOF** | 1 (yaw rotation) |
| **Antennas** | 2 (1 DOF each) |
| **Total Motors** | 9 (Dynamixel XL330/XC330) |
| **Camera** | RPi Camera v3 wide, 120° FOV |
| **Microphones** | 4× PDM MEMS array |
| **Speaker** | 5W |
| **Battery** | 2000mAh LiFePO4 (wireless version) |
| **Controller** | Raspberry Pi CM4 |

---

## Installation

### Prerequisites
```bash
# Python 3.10+
pip install numpy scipy zenoh opencv-python fastapi uvicorn
```

### Install SDK
```bash
pip install reachy-mini

# With simulation support
pip install reachy-mini[mujoco]
```

### From Source
```bash
git clone https://github.com/pollen-robotics/reachy_mini.git
cd reachy_mini
pip install -e .
```

---

## Quick Start

### Basic Control
```python
from reachy_mini import ReachyMini
import numpy as np

# Connect (starts daemon if needed)
mini = ReachyMini()

# Enable motors
mini.enable_motors()

# Move head: [x, y, z, roll, pitch, yaw]
pose = np.array([0, 0, 0.1, 0, 0.3, 0])
mini.goto_target(head=pose, duration=1.0)

# Move antennas: (left, right) in radians
mini.goto_target(antennas=(0.5, -0.5), duration=0.5)

# Look at camera coordinate (normalized 0-1)
mini.look_at(0.5, 0.3, frame="camera")

# Play sound
mini.play_sound("sounds/hello.wav")

# Disable when done
mini.disable_motors()
```

### Run Daemon Manually
```bash
# Real hardware
reachy-mini-daemon --backend robot --port /dev/ttyUSB0

# MuJoCo simulation
reachy-mini-daemon --backend mujoco

# Lightweight mockup
reachy-mini-daemon --backend mockup
```

---

## Motion Methods

| Method | Description | Example |
|--------|-------------|---------|
| `goto_target()` | Smooth interpolated motion | `goto_target(head=pose, duration=1.0)` |
| `set_target()` | Immediate position (no interpolation) | `set_target(head=pose)` |
| `look_at()` | Point toward target | `look_at(0.5, 0.5, frame="camera")` |
| `play_move()` | Play recorded motion | `play_move("wave.json")` |

### Interpolation Methods
```python
from reachy_mini import InterpolationMethod

mini.goto_target(
    head=pose,
    duration=1.0,
    method=InterpolationMethod.MIN_JERK  # default, smooth
)

# Options:
# - LINEAR: Constant velocity
# - MIN_JERK: Smooth acceleration (default)
# - QUINTIC: 5th-order polynomial
# - CARTOON: Elastic/bounce effect
```

---

## Motor Control Modes

```python
from reachy_mini import MotorControlMode

# Torque ON - position controlled
mini.set_motor_mode(MotorControlMode.Enabled)

# Torque OFF - free movement
mini.set_motor_mode(MotorControlMode.Disabled)

# Compliant - gravity compensation
mini.set_motor_mode(MotorControlMode.GravityCompensation)
```

---

## Platform Variants

| Variant | Features | Use Case |
|---------|----------|----------|
| **Wireless** | WiFi, battery, RPi4, IMU | Autonomous robot |
| **Lite** | USB tethered, no battery | Development/testing |
| **Simulation** | MuJoCo physics | No hardware needed |

---

## Kinematics Engines

| Engine | Description | Install |
|--------|-------------|---------|
| **Analytical** | Fast closed-form IK (default) | Built-in |
| **Placo** | Constraint-based, collision check | `pip install placo` |
| **NN** | Neural network learned IK | `pip install onnxruntime` |

```python
# Switch kinematics engine
mini = ReachyMini(kinematics="placo")
```

---

## Zenoh Communication

### Default Ports
- **TCP**: 7447 (localhost mode)
- **Multicast**: UDP for network discovery

### Topics
| Topic | Type | Description |
|-------|------|-------------|
| `reachy/joints/positions` | float32[] | Motor angles |
| `reachy/head/pose` | float32[6] | 6D head pose |
| `reachy/command` | bytes | Control commands |
| `reachy/daemon/status` | JSON | Health/state |
| `reachy/camera/frame` | bytes | Video frames |

---

## Web Dashboard

```bash
# Start daemon with dashboard
reachy-mini-daemon --dashboard

# Access at
open http://localhost:8000
```

Features:
- Real-time joint visualization
- Manual control sliders
- Camera preview
- Status monitoring

---

## Building Apps

```python
from reachy_mini.apps import ReachyMiniApp

class MyApp(ReachyMiniApp):
    async def setup(self):
        print("App starting...")

    async def loop(self):
        # Your logic here
        frame = self.mini.get_camera_frame()
        # Process frame...
        await asyncio.sleep(0.033)  # 30 FPS

    async def teardown(self):
        print("App stopping...")

# Run
app = MyApp(mini)
asyncio.run(app.run())
```

---

## Examples

### Emotion Expression
```python
# Happy: head up, antennas up
mini.goto_target(
    head=[0, 0, 0.05, 0, -0.2, 0],  # Tilt back
    antennas=(0.5, 0.5),            # Antennas up
    duration=0.5
)

# Sad: head down, antennas down
mini.goto_target(
    head=[0, 0, -0.02, 0, 0.3, 0],  # Tilt forward
    antennas=(-0.3, -0.3),          # Antennas down
    duration=1.0
)

# Curious: head tilt
mini.goto_target(
    head=[0, 0, 0, 0.3, 0, 0],      # Roll to side
    antennas=(0.3, -0.1),           # Asymmetric
    duration=0.3
)
```

### Face Tracking
```python
import cv2

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

while True:
    frame = mini.get_camera_frame()
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray)

    if len(faces) > 0:
        x, y, w, h = faces[0]
        cx = (x + w/2) / frame.shape[1]
        cy = (y + h/2) / frame.shape[0]
        mini.look_at(cx, cy, frame="camera")
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Motors not responding | Check USB/serial connection, run `dmesg` |
| Zenoh connection failed | Verify daemon running, check port 7447 |
| Jerky motion | Increase duration, use MIN_JERK interpolation |
| Camera not working | Check `/dev/video0`, run `v4l2-ctl --list-devices` |

---

## Resources

- **Documentation**: https://docs.pollen-robotics.com/reachy-mini
- **GitHub**: https://github.com/pollen-robotics/reachy_mini
- **Discord**: https://discord.gg/pollen-robotics
- **Hardware Files**: Apache 2.0 (software), CC BY-SA-NC (hardware)
