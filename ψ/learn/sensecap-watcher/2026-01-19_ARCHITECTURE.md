# SenseCAP Watcher - Architecture Overview

**Date**: 2026-01-19
**Repository**: https://github.com/Seeed-Studio/OSHW-SenseCAP-Watcher
**License**: Apache 2.0
**Build System**: ESP-IDF v5.1

---

## Project Identity

SenseCAP Watcher เป็น open-source hardware AI assistant ที่รวม ESP32-S3 กับ Himax HX6538 AI processor สามารถทำ computer vision, audio processing และเชื่อมต่อ LLM ได้ ออกแบบมาให้ process AI locally โดยไม่จำเป็นต้องพึ่ง cloud

---

## Directory Structure

```
OSHW-SenseCAP-Watcher/
├── Firmware/                          # Compiled firmware binaries
│   ├── ESP32/                         # ESP32-S3 main controller
│   │   └── V1.1.7/
│   │       ├── bootloader.bin
│   │       ├── partition-table.bin
│   │       ├── factory_firmware.bin
│   │       └── srmodels.bin
│   └── Himax/                         # HX6538 AI chip firmware
│       └── himax_firmware_20240816.img
│
├── Hardware/                          # Hardware documentation
│   ├── SenseCAP_Watcher_v1.0_SCH.pdf  # Schematic
│   ├── SenseCAP_Watcher-3D-Shell.stp  # 3D model
│   ├── esp32-s3_datasheet.pdf
│   └── HX6538_datasheet.pdf
│
├── Documentation/                     # Wiki and guides
│   ├── Product_Overview/
│   ├── Firmware_architecture_Overview/
│   └── Software_Framework_Overview/
│
└── Applications/                      # Example projects
    ├── e-paper_esphome/               # E-paper display
    └── emotion-sensor/                # Emotion detection
```

---

## Hardware Architecture

### Primary Components

| Component | Specs | Role |
|-----------|-------|------|
| **ESP32-S3** | Dual-core 240MHz, 8MB PSRAM, 32MB Flash | Main controller, UI, connectivity |
| **Himax HX6538** | Cortex-M55 + Ethos-U55 NPU, 16MB Flash | AI inference |
| **Camera** | OV5647, 120° FOV | Vision input |
| **Display** | 1.45" touchscreen, 412×412 | User interface |
| **Audio** | Mic + 1W speaker | Voice I/O |
| **Battery** | 3.7V 400mAh Li-ion | Backup power |

### Connectivity
- Wi-Fi: 802.11b/g/n (2.4GHz, 100m range)
- Bluetooth 5.0 LE
- Grove I2C + GPIO expansion
- microSD (32GB FAT32)
- 2x USB-C (power / programming)

---

## Dual Firmware Architecture

```
┌────────────────────────────────┐
│       ESP32-S3 Firmware        │ ← factory_firmware.bin
│  - Main control, UI, network   │
│  - Task Flow Engine            │
└───────────────┬────────────────┘
                │ UART/SPI
┌───────────────┴────────────────┐
│       Himax HX6538 Firmware    │ ← himax_firmware.img
│  - Vision AI inference         │
│  - Neural network processing   │
└────────────────────────────────┘
```

---

## Software Architecture

### Layered Design

```
┌─────────────────────────────────────────┐
│        APP Applications Layer            │  WiFi, BLE, OTA, SenseCraft
├─────────────────────────────────────────┤
│     UI & Interaction Layer               │  Display, touch, wheel, LED
├─────────────────────────────────────────┤
│      Task Flow Framework Layer           │  JSON-based orchestration
├─────────────────────────────────────────┤
│   Function Modules (Building Blocks)    │  Individual capabilities
├─────────────────────────────────────────┤
│        Hardware Drivers (BSP)            │  ESP-IDF peripherals
└─────────────────────────────────────────┘
```

### Task Flow Engine (TFE)

Node-RED style task orchestration using JSON:

```json
{
  "tlid": 123456789,
  "tn": "Fire Detection",
  "task_flow": [
    {
      "id": 1,
      "type": "ai camera",
      "params": { "model": "fire_detect" },
      "wires": [[2]]
    },
    {
      "id": 2,
      "type": "local alarm",
      "params": { "sound": "alert.wav" }
    }
  ]
}
```

### Function Modules

| Type | Examples | Purpose |
|------|----------|---------|
| Vision | AI Camera, Image Analyzer | Capture, process images |
| Audio | Mic, STT | Voice input/recognition |
| Analytics | Model Inference, Condition | Run models, evaluate |
| Actions | Alarm, HTTP, Discord | Notifications |
| Integration | SenseCraft, MQTT | Cloud/platform |

---

## Three Deployment Models

| Mode | AI Processing | Latency | Cost |
|------|--------------|---------|------|
| **Local Only** | On-device | ~2s | Free |
| **Cloud Only** | SenseCraft/OpenAI | ~10s | API costs |
| **Hybrid** | Local + Cloud fallback | ~10s | Optimized |

---

## Flash Partition Map

| Address | Size | Purpose |
|---------|------|---------|
| 0x0 | 64KB | Bootloader |
| 0x8000 | 4KB | Partition table |
| 0x9000 | 200KB | NVS factory (EUI) |
| 0x110000 | 1.6MB | Main firmware |
| 0x1910000 | 1MB | SR models |
| 0x1a10000 | 6.4MB | Storage |

---

## Key Design Patterns

1. **Modularity** - Task flow as composable blocks
2. **Event-Driven** - Async message passing (esp_event)
3. **Privacy First** - Local AI option, no cloud required
4. **Dual-Core** - ESP32 (control) + Himax (AI) separation
5. **Extensibility** - Grove interface, custom modules
