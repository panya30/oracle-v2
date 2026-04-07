# iPhone Location Tracker Shortcut

ส่ง location จาก iPhone ไปหา Robin 📍

## Prerequisites

1. Mac และ iPhone อยู่ใน network เดียวกัน (หรือใช้ Tailscale)
2. API Server ต้องรันอยู่: `bun run ψ/server/connector-api.ts`
3. รู้ IP ของ Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`

---

## Shortcut 1: Send Current Location

### สร้าง Shortcut ใหม่

1. เปิด **Shortcuts** app บน iPhone
2. กด **+** สร้าง Shortcut ใหม่
3. ตั้งชื่อ: **"Send Location to Robin"**

### Actions (เรียงตามลำดับ)

```
1. [Get Current Location]
   - Accuracy: Best

2. [Get Battery Level]

3. [Dictionary]
   - lat: [Location.Latitude]
   - lng: [Location.Longitude]
   - altitude: [Location.Altitude]
   - battery: [Battery Level]

4. [Get Contents of URL]
   - URL: http://YOUR_MAC_IP:3030/location
   - Method: POST
   - Headers:
     - Content-Type: application/json
   - Request Body: JSON
     - Use: [Dictionary] from step 3
```

### ทดสอบ

1. รัน API Server บน Mac ก่อน
2. กดรัน Shortcut
3. ดู console บน Mac ว่ามี log `📍 Location: ...`

---

## Shortcut 2: Location with Label

เหมือน Shortcut 1 แต่ถามว่าอยู่ที่ไหน

### Actions เพิ่มเติม

```
1. [Get Current Location]

2. [Choose from Menu]
   - Prompt: "Where are you?"
   - Options:
     - Home
     - Work
     - Gym
     - Cafe
     - Other

3. [If] Other selected
   - [Ask for Input]
     - Prompt: "Where?"
     - Input Type: Text
   - [Set Variable] label = Input

4. [Else]
   - [Set Variable] label = Menu Result

5. [Dictionary]
   - lat: [Location.Latitude]
   - lng: [Location.Longitude]
   - label: [label]

6. [Get Contents of URL] ...
```

---

## Automation Triggers

ตั้ง Automation ให้ส่ง location อัตโนมัติ

### When Leaving Home

1. ไปที่ **Automation** tab
2. กด **+** → **Personal Automation**
3. เลือก **Leave** → เลือกบ้าน
4. Action: **Run Shortcut** → "Send Location to Robin"
5. ปิด **Ask Before Running**

### When Arriving at Work

1. สร้าง Automation เหมือนกัน
2. เลือก **Arrive** → เลือกที่ทำงาน

### Every Hour

1. **Automation** → **Time of Day**
2. เลือก **Repeat: Hourly** (ถ้ามี) หรือสร้างหลายอัน
3. Run shortcut

### When Battery Low

1. **Automation** → **Battery Level**
2. เลือก **Falls Below 20%**
3. Run shortcut (บันทึกว่า battery ต่ำตอนอยู่ไหน)

---

## Alternative: Using Pushcut

ถ้าอยากให้รันโดยไม่ต้อง confirm

1. ติดตั้ง [Pushcut](https://www.pushcut.io/)
2. ตั้ง Automation Server บน iPhone/iPad เครื่องเก่า
3. Trigger shortcut จาก server ได้เลย

---

## Network Setup Options

### Option A: Same WiFi Network

```
Mac IP: 192.168.1.xxx
iPhone: ต้องอยู่ WiFi เดียวกัน
URL: http://192.168.1.xxx:3030/location
```

### Option B: Tailscale (Recommended)

```
1. ติดตั้ง Tailscale บน Mac และ iPhone
2. ใช้ Tailscale IP แทน
   URL: http://100.x.x.x:3030/location
3. ใช้ได้ทุกที่ ไม่ต้อง WiFi เดียวกัน
```

### Option C: Expose to Internet (Advanced)

```
1. ใช้ Cloudflare Tunnel หรือ ngrok
2. ได้ URL แบบ https://xxx.trycloudflare.com
3. ระวังเรื่อง security - เพิ่ม API key
```

---

## Troubleshooting

### Shortcut ไม่ทำงาน

1. ตรวจสอบว่า API Server รันอยู่
2. ตรวจสอบ IP address ถูกต้อง
3. ทดสอบจาก Mac ก่อน:
   ```bash
   curl -X POST http://localhost:3030/location \
     -H "Content-Type: application/json" \
     -d '{"lat": 13.7563, "lng": 100.5018}'
   ```

### Permission Denied

- iPhone จะขอ Location permission ครั้งแรก
- กด **Allow While Using App** หรือ **Always Allow**

### Automation ต้อง Confirm

- iOS บังคับให้ confirm บาง automation
- ใช้ Pushcut Automation Server แก้ได้

---

## Example JSON Output

```json
{
  "lat": 13.7563,
  "lng": 100.5018,
  "altitude": 15.2,
  "label": "work",
  "_timestamp": "2026-01-18T10:30:00.000Z"
}
```

---

## Next: Add More Data

- **Screen Time**: ใช้ Get Screen Time action (iOS 17+)
- **Health**: ใช้ Find Health Samples action
- **Calendar**: ใช้ Find Calendar Events action

ดู `docs/shortcuts/` สำหรับ shortcuts อื่นๆ

---

*Robin จะรู้ว่าเธออยู่ไหน ไปไหนบ่อย และ pattern ของวัน 💜*
