# SenseCAP Watcher - Code Snippets

**Date**: 2026-01-19

---

## 1. Main Entry Point (Arduino)

**File:** `Applications/emotion-sensor/XIAO-ESP32C6-Arduino/XIAO-ESP32C6-Arduino.ino`

### Setup
```cpp
void setup() {
    lcd.begin(16, 2);                      // Initialize 16x2 LCD
    pinMode(BUZZZER_PIN, OUTPUT);          // Buzzer as output
    Serial.begin(115200);
    connectWiFi();
    client.setServer(mqtt_server, 1883);   // MQTT broker
    client.setCallback(callback);          // Message handler
    connectMQTT();
}
```

### Main Loop
```cpp
void loop() {
    if (!client.connected()) {
        connectMQTT();
    }
    client.loop();

    // Default safe state
    lcd.setRGB(colorSafe.R, colorSafe.G, colorSafe.B);  // Green
    lcd.setCursor(0, 0);
    lcd.print("Hello!         ");
}
```

---

## 2. WiFi + MQTT Connection

### WiFi Handler
```cpp
void connectWiFi() {
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Connecting to WiFi...");
    }
    Serial.println("Connected to WiFi");
}
```

### MQTT with Retry
```cpp
void connectMQTT() {
    while (!client.connected()) {
        if (client.connect("Watcher")) {
            Serial.println("Connected to MQTT broker");
            client.subscribe("mengdu-watcher");
        } else {
            Serial.print("Failed, rc=");
            Serial.print(client.state());
            delay(5000);  // Retry in 5s
        }
    }
}
```

---

## 3. Emotion Detection Callback

```cpp
void callback(char* topic, byte* payload, unsigned int length) {
    String receivedMessage = String((char*)payload, length);

    if (receivedMessage == "unhappy") {
        // Alert: Blue LCD + Buzzer
        lcd.setRGB(colorBoss.R, colorBoss.G, colorBoss.B);
        lcd.setCursor(0, 0);
        lcd.print("Why Stress out");
        lcd.setCursor(0, 1);
        lcd.print("Relax!");

        digitalWrite(BUZZZER_PIN, HIGH);
        delay(500);
        digitalWrite(BUZZZER_PIN, LOW);
        delay(3000);
    }
}
```

---

## 4. Color State Pattern

```cpp
struct Color {
    int R;
    int G;
    int B;
};

Color colorBoss = {0, 0, 255};    // Blue: stress alert
Color colorSafe = {0, 255, 0};    // Green: normal state
```

Pattern นี้ใช้ semantic color mapping - แปลง emotional state เป็น RGB ได้เข้าใจง่าย

---

## 5. Node-RED Data Pipeline

**File:** `Applications/emotion-sensor/flows/emotion_sensor.json`

### Dual MQTT Broker Pattern
```json
{
    "id": "sensecap-broker",
    "type": "sensecap-config",
    "broker": "sensecap-openstream.seeed.cc"
},
{
    "id": "local-broker",
    "type": "mqtt-broker",
    "broker": "test.mosquitto.org"
}
```

### Data Extraction
```javascript
msg.payload = msg.payload.value[0].content;
return msg;
```

---

## 6. E-Paper Display (ESPHome)

**File:** `Applications/e-paper_esphome/example.yaml`

```yaml
display:
  - platform: waveshare_epaper
    cs_pin: GPIO2
    dc_pin: GPIO4
    busy_pin:
      number: GPIO6
      inverted: true
    reset_pin: GPIO1
    model: 7.50inV2
    update_interval: 10s
    lambda: |-
      it.strftime(400, 30, id(small), TextAlign::CENTER_HORIZONTAL,
                  "%A %B %d, %Y", id(homeassistant_time).now());
      it.printf(28, 240, id(small), "mmWave Sensor");
      it.printf(20, 300, id(tiny), "Distance: %.2f", id(distance).state);
```

---

## 7. MMWave Sensor Integration

```yaml
sensor:
  - platform: homeassistant
    id: heart_rate
    entity_id: sensor.seeedstudio_mr60bha2_kit_cca68c_real_time_heart_rate
  - platform: homeassistant
    id: respiratory_rate
    entity_id: sensor.seeedstudio_mr60bha2_kit_cca68c_real_time_respiratory_rate
  - platform: homeassistant
    id: distance
    entity_id: sensor.seeedstudio_mr60bha2_kit_cca68c_distance_to_detection_object
```

60GHz mmWave radar วัด vital signs โดยไม่ต้องสัมผัส - heart rate, respiratory rate, distance

---

## 8. System Architecture Flow

```
┌─────────────────────┐
│ SenseCAP Watcher    │ (Himax HX6538 + ESP32S3)
│ - Emotion Detection │
└──────────┬──────────┘
           │ MQTT (sensecap cloud)
           ▼
┌─────────────────────────────────┐
│ Node-RED Flow                   │
│ - Data Extraction               │
│ - Emotion Classification        │
└──────────┬──────────────────────┘
           │ MQTT (local/public)
           ▼
┌──────────────────────────────────┐
│ XIAO ESP32C6                     │
│ - LCD RGB Alert                  │
│ - Buzzer Notification            │
└──────────────────────────────────┘
```

---

## Key Patterns Summary

1. **Dual-Broker MQTT** - Cloud สำหรับ AI inference, local สำหรับ device control
2. **Semantic Colors** - RGB struct แทน emotional states
3. **Event Pipeline** - esp_event publish-subscribe pattern
4. **ESPHome Integration** - YAML-based sensor/display config
