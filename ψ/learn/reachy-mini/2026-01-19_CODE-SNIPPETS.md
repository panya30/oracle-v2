# Reachy Mini - Code Snippets

**Date**: 2026-01-19

---

## 1. Basic Robot Control

**File:** `src/reachy_mini/reachy_mini.py`

### Initialize and Move
```python
from reachy_mini import ReachyMini
import numpy as np

# Connect to daemon
mini = ReachyMini()

# Enable motors
mini.enable_motors()

# Move head to target pose (6D: x, y, z, roll, pitch, yaw)
target_pose = np.array([0.0, 0.0, 0.1, 0.0, 0.2, 0.0])
mini.goto_target(head=target_pose, duration=1.5)

# Move antennas
mini.goto_target(antennas=(0.3, -0.3), duration=0.5)

# Disable when done
mini.disable_motors()
```

---

## 2. Look At Target

**File:** `src/reachy_mini/reachy_mini.py`

### Camera Frame Targeting
```python
# Look at point in camera frame (normalized 0-1)
mini.look_at(x=0.5, y=0.5, frame="camera")  # Center

# Look at point in robot frame (meters)
mini.look_at(x=0.3, y=0.0, frame="robot")
```

### Implementation
```python
def look_at(self, x: float, y: float, frame: str = "camera") -> None:
    """Point head toward a target position."""
    if frame == "camera":
        # Convert normalized camera coords to 3D direction
        direction = self._camera_to_direction(x, y)
    else:
        direction = np.array([x, y, 0])

    # Compute required head pose
    target_pose = self._kinematics.look_at(direction)
    self.goto_target(head=target_pose, duration=0.3)
```

---

## 3. Zenoh Communication

**File:** `src/reachy_mini/io/zenoh_client.py`

### Publish-Subscribe Pattern
```python
import zenoh
from dataclasses import dataclass

@dataclass
class ZenohConfig:
    mode: str = "client"
    endpoints: list = None  # ["tcp/localhost:7447"]

class ZenohClient:
    def __init__(self, config: ZenohConfig):
        zenoh_config = zenoh.Config()
        if config.endpoints:
            zenoh_config.insert_json5("connect/endpoints",
                                       json.dumps(config.endpoints))
        self.session = zenoh.open(zenoh_config)

    def publish(self, topic: str, data: bytes):
        self.session.put(topic, data)

    def subscribe(self, topic: str, callback):
        return self.session.declare_subscriber(topic, callback)
```

### Topic Structure
```python
# Topics used by daemon
TOPICS = {
    "joint_positions": "reachy/joints/positions",      # Motor angles
    "head_pose": "reachy/head/pose",                   # 6D pose
    "command": "reachy/command",                       # Control commands
    "daemon_status": "reachy/daemon/status",           # Health/state
    "camera_frame": "reachy/camera/frame",             # Video stream
}
```

---

## 4. Kinematics - Analytical IK

**File:** `src/reachy_mini/kinematics/analytical_kinematics.py`

### Stewart Platform Kinematics
```python
class AnalyticalKinematics:
    """Closed-form IK for parallel manipulator."""

    def __init__(self, config: KinematicsConfig):
        # Base and platform attachment points
        self.base_points = self._hexagon_points(config.base_radius)
        self.platform_points = self._hexagon_points(config.platform_radius)
        self.leg_lengths = config.leg_lengths

    def inverse(self, pose: np.ndarray) -> np.ndarray:
        """Compute joint angles from 6D pose.

        Args:
            pose: [x, y, z, roll, pitch, yaw]
        Returns:
            Joint angles for 6 legs
        """
        position = pose[:3]
        rotation = Rotation.from_euler('xyz', pose[3:]).as_matrix()

        joint_angles = []
        for base_pt, platform_pt in zip(self.base_points,
                                         self.platform_points):
            # Transform platform point to world frame
            world_pt = position + rotation @ platform_pt

            # Compute leg vector
            leg = world_pt - base_pt
            length = np.linalg.norm(leg)

            # Solve for motor angle (geometry-specific)
            angle = self._leg_ik(leg, length)
            joint_angles.append(angle)

        return np.array(joint_angles)
```

---

## 5. Motion Interpolation

**File:** `src/reachy_mini/motion/goto.py`

### GotoMove with Interpolation
```python
from enum import Enum
import numpy as np

class InterpolationMethod(Enum):
    LINEAR = "linear"
    MIN_JERK = "min_jerk"
    QUINTIC = "quintic"
    CARTOON = "cartoon"  # Elastic/bounce

class GotoMove:
    def __init__(self, start, end, duration, method=InterpolationMethod.MIN_JERK):
        self.start = np.array(start)
        self.end = np.array(end)
        self.duration = duration
        self.method = method
        self._start_time = None

    def interpolate(self, t: float) -> np.ndarray:
        """Get position at time t (0 to duration)."""
        s = t / self.duration  # Normalized time
        s = np.clip(s, 0, 1)

        if self.method == InterpolationMethod.LINEAR:
            alpha = s
        elif self.method == InterpolationMethod.MIN_JERK:
            # Smooth acceleration/deceleration
            alpha = 10*s**3 - 15*s**4 + 6*s**5
        elif self.method == InterpolationMethod.QUINTIC:
            alpha = 6*s**5 - 15*s**4 + 10*s**3
        elif self.method == InterpolationMethod.CARTOON:
            # Elastic overshoot
            alpha = 1 - np.cos(s * np.pi * 2.5) * (1 - s)

        return self.start + alpha * (self.end - self.start)
```

---

## 6. Backend Abstraction

**File:** `src/reachy_mini/daemon/backend/base.py`

### Abstract Backend Interface
```python
from abc import ABC, abstractmethod
from typing import Optional
import numpy as np

class Backend(ABC):
    """Hardware abstraction layer."""

    @abstractmethod
    def connect(self) -> bool:
        """Initialize connection to hardware/sim."""
        pass

    @abstractmethod
    def set_joint_positions(self, positions: np.ndarray) -> None:
        """Set target joint positions."""
        pass

    @abstractmethod
    def get_joint_positions(self) -> np.ndarray:
        """Read current joint positions."""
        pass

    @abstractmethod
    def set_motor_mode(self, mode: MotorControlMode) -> None:
        """Enable/disable/compliant mode."""
        pass

    @abstractmethod
    def get_camera_frame(self) -> Optional[np.ndarray]:
        """Capture camera image."""
        pass
```

### Robot Backend (Real Hardware)
```python
class RobotBackend(Backend):
    def __init__(self, port: str = "/dev/ttyUSB0"):
        from reachy_mini_motor_controller import MotorController
        self.controller = MotorController(port)

    def set_joint_positions(self, positions: np.ndarray):
        # Convert to motor commands
        for motor_id, angle in enumerate(positions):
            self.controller.set_position(motor_id, angle)
```

### MuJoCo Backend (Simulation)
```python
class MujocoBackend(Backend):
    def __init__(self, model_path: str):
        import mujoco
        self.model = mujoco.MjModel.from_xml_path(model_path)
        self.data = mujoco.MjData(self.model)

    def set_joint_positions(self, positions: np.ndarray):
        self.data.ctrl[:] = positions
        mujoco.mj_step(self.model, self.data)
```

---

## 7. App Framework

**File:** `src/reachy_mini/apps/app.py`

### ReachyMiniApp Base Class
```python
from abc import ABC, abstractmethod
from reachy_mini import ReachyMini

class ReachyMiniApp(ABC):
    """Base class for robot applications."""

    def __init__(self, mini: ReachyMini):
        self.mini = mini
        self._running = False

    @abstractmethod
    async def setup(self) -> None:
        """Initialize app resources."""
        pass

    @abstractmethod
    async def loop(self) -> None:
        """Main app loop iteration."""
        pass

    @abstractmethod
    async def teardown(self) -> None:
        """Cleanup resources."""
        pass

    async def run(self):
        """Execute app lifecycle."""
        await self.setup()
        self._running = True
        try:
            while self._running:
                await self.loop()
        finally:
            await self.teardown()

    def stop(self):
        self._running = False
```

### Example: Head Tracker App
```python
class HeadTrackerApp(ReachyMiniApp):
    """Track faces and look at them."""

    async def setup(self):
        import cv2
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )

    async def loop(self):
        frame = self.mini.get_camera_frame()
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)

        if len(faces) > 0:
            # Track largest face
            x, y, w, h = max(faces, key=lambda f: f[2]*f[3])
            center_x = (x + w/2) / frame.shape[1]
            center_y = (y + h/2) / frame.shape[0]

            self.mini.look_at(center_x, center_y, frame="camera")

        await asyncio.sleep(0.033)  # 30 FPS
```

---

## 8. Daemon Orchestration

**File:** `src/reachy_mini/daemon/daemon.py`

### Main Daemon Loop
```python
class ReachyMiniDaemon:
    def __init__(self, config: DaemonConfig):
        # Initialize backend
        if config.backend == "robot":
            self.backend = RobotBackend(config.port)
        elif config.backend == "mujoco":
            self.backend = MujocoBackend(config.model_path)
        else:
            self.backend = MockupSimBackend()

        # Initialize communication
        self.zenoh = ZenohServer(config.zenoh)

        # Initialize kinematics
        self.kinematics = AnalyticalKinematics(config.kinematics)

        # State
        self.current_pose = np.zeros(6)
        self.target_pose = None
        self.active_motion = None

    async def run(self):
        """Main daemon loop at 100Hz."""
        self.backend.connect()

        while True:
            # Process incoming commands
            await self._process_commands()

            # Update motion
            if self.active_motion:
                self.current_pose = self.active_motion.interpolate(
                    time.time() - self.active_motion._start_time
                )

            # Compute IK and send to motors
            joint_positions = self.kinematics.inverse(self.current_pose)
            self.backend.set_joint_positions(joint_positions)

            # Publish state
            self.zenoh.publish("head_pose", self.current_pose.tobytes())

            await asyncio.sleep(0.01)  # 100Hz
```

---

## 9. Audio Playback

**File:** `src/reachy_mini/media/audio.py`

```python
import sounddevice as sd
import soundfile as sf

class AudioPlayer:
    def __init__(self, device: str = None):
        self.device = device

    def play_sound(self, path: str, blocking: bool = False):
        """Play audio file."""
        data, samplerate = sf.read(path)
        sd.play(data, samplerate, device=self.device)
        if blocking:
            sd.wait()

    def speak(self, text: str, voice: str = "en"):
        """Text-to-speech (requires pyttsx3 or gTTS)."""
        import pyttsx3
        engine = pyttsx3.init()
        engine.say(text)
        engine.runAndWait()
```

---

## Key Patterns Summary

1. **Zenoh Pub/Sub** - Decoupled communication between SDK and daemon
2. **Backend Abstraction** - Same API for hardware, MuJoCo, and mockup
3. **Interpolation Library** - Smooth motion profiles (min-jerk, quintic, cartoon)
4. **Stewart Platform IK** - Parallel manipulator inverse kinematics
5. **App Framework** - Async lifecycle for robot applications
6. **100Hz Control Loop** - Real-time motion update in daemon
