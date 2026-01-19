# SenseCAP Watcher - Quick Reference

**Date**: 2026-01-19

---

## What It Does

SenseCAP Watcher เป็น AI-powered visual monitoring device ที่สามารถ "เห็น ได้ยิน และตอบสนอง" ต่อสิ่งแวดล้อม ใช้ ESP32-S3 + Himax HX6538 AI chip ทำ computer vision ได้ทั้ง local และ cloud สั่งงานด้วยภาษาธรรมชาติผ่าน app หรือ voice command แล้วจะ monitor ตาม task ที่กำหนด

---

## Hardware Specs

| Component | Specification |
|-----------|---------------|
| **MCU** | ESP32-S3 @ 240MHz, 8MB PSRAM, 32MB Flash |
| **AI Chip** | Himax HX6538 (Cortex-M55 + Ethos-U55), 16MB |
| **Camera** | OV5647, 120° FOV, fixed 3m focal |
| **Display** | 1.45" touchscreen, 412×412 |
| **Audio** | Mic + 1W speaker |
| **WiFi** | 802.11b/g/n 2.4GHz, 100m range |
| **Bluetooth** | BLE 5.0 |
| **Battery** | 3.7V 400mAh Li-ion backup |
| **Storage** | microSD up to 32GB FAT32 |
| **Expansion** | Grove I2C + 2x GPIO |

---

## Key Features

- **Dual AI** - Local on-device + Cloud LLM fallback
- **Natural Language Tasks** - สั่งด้วยเสียงหรือ text
- **3 Operation Modes**:
  - Local only (2s latency, free)
  - Cloud only (10s, API costs)
  - Hybrid (best of both)
- **Task Templates** - Human/pet detection, gesture recognition
- **Privacy First** - Can run 100% offline
- **Integrations** - HTTP, MQTT, Node-RED, Home Assistant, Discord, Telegram

---

## Build & Flash

### Prerequisites
```bash
pip3 install --upgrade esptool
```

### Backup Factory Info (สำคัญมาก!)
```bash
esptool.py --chip esp32s3 --baud 2000000 read_flash 0x9000 204800 nvsfactory.bin
```

### Flash ESP32 Firmware
```bash
esptool.py --chip esp32s3 -b 2000000 \
  --before default_reset --after hard_reset \
  write_flash --flash_mode dio --flash_size 32MB --flash_freq 80m \
  0x0 bootloader.bin \
  0x8000 partition-table.bin \
  0x10d000 ota_data_initial.bin \
  0x110000 factory_firmware.bin \
  0x1910000 srmodels.bin \
  0x1a10000 storage.bin
```

### Flash Himax (Recovery Only)
```bash
pip3 install python-sscma
sscma.cli flasher -f himax_firmware_20240816.img
```

### Build Custom Firmware
```bash
git clone https://github.com/Seeed-Studio/SenseCAP-Watcher-Firmware
cd SenseCAP-Watcher-Firmware/examples/factory_firmware
idf.py set-target esp32s3
idf.py build
idf.py --port /dev/ttyACM0 flash monitor
```

---

## Use Cases

### Home & Office
- Security: ตรวจจับคน/สัตว์เลี้ยง/ผู้บุกรุก
- Automation: trigger actions จาก detected objects
- Pet monitoring: ดูแลสัตว์เลี้ยง

### Retail & Business
- Shelf monitoring: ตรวจ stock
- Queue management: นับคน
- Safety compliance: hard hat detection

### Custom AI
- Train custom models via SenseCraft
- On-premise deployment (Jetson/PC)
- Node-RED workflows

### Example Tasks
- "ถ้าเห็นเทียน บอกฉันด้วย" (fire hazard)
- "แจ้งเตือนถ้ามีคนเข้าโซนห้าม"
- "ดูแมวกินอาหารแล้วกระพริบไฟ"

---

## Serial Console Commands

```bash
help                              # List commands
wifi_sta -s <ssid> -p <password>  # Connect WiFi
ota -t <type> --url=<url>         # Firmware update
taskflow -i -f "test.json"        # Import task
factory_info                      # Device credentials
battery                           # Battery level
bsp i2cdetect <0|1>               # I2C scan
```

---

## Important Notes

1. **Two USB-C ports** - Back: power only, Bottom: power + programming
2. **Save nvsfactory.bin** ก่อน flash ทุกครั้ง - ถ้าหายจะเชื่อม cloud ไม่ได้
3. **Two serial ports** จะขึ้นมาเมื่อเสียบ USB (ESP32 + Himax)
4. **Himax firmware** - ไม่แนะนำให้แก้ไข, ใช้ recovery เท่านั้น
