# 🔌 HoloMat Arduino Wiring Reference

## ⚡ Power Rules
- All sensors run on **5V** from Arduino
- **Do NOT connect anything to 3.3V** unless specified
- Arduino is powered via **USB** from your laptop or Pi

---

## 1. PIR Motion Sensor (HC-SR501)

```
HC-SR501 Pins:
┌─────┬─────┬───────┐
│ VCC │ OUT │  GND  │    ← viewed from front (dome side)
└─────┴─────┴───────┘
  5V   D7    GND
```

**Arduino Connections:**
| PIR Pin | Arduino |
|---------|---------|
| VCC | 5V |
| GND | GND |
| OUT | Digital **7** |

**Potentiometers on the sensor:**
- Left pot (Sx) = Sensitivity — turn clockwise for more range
- Right pot (Tx) = Time delay — turn fully counter-clockwise for shortest hold

---

## 2. HC-SR04 Ultrasonic Sensor

```
HC-SR04 (viewed from front with sensors facing you):
┌─────┬───────┬──────┬─────┐
│ VCC │ TRIG  │ ECHO │ GND │
└─────┴───────┴──────┴─────┘
  5V    D9      D10   GND
```

**Arduino Connections:**
| HC-SR04 Pin | Arduino |
|-------------|---------|
| VCC | 5V |
| GND | GND |
| TRIG | Digital **9** |
| ECHO | Digital **10** |

---

## 3. LDR Light Sensor (Voltage Divider)

**IMPORTANT: The resistor is MANDATORY**

```
Circuit:
5V ──[LDR]──┬── A0 (Arduino reads voltage here)
             │
           [10kΩ] 
             │
            GND
```

**Breadboard layout:**
```
+5V rail → one leg of LDR
Other leg of LDR → Breadboard row X
Row X → Jumper wire to Arduino A0
Row X → 10kΩ resistor → GND rail
```

| Component | Connection |
|-----------|-----------|
| LDR leg 1 | 5V |
| LDR leg 2 | A0 |
| 10kΩ (one end) | A0 |
| 10kΩ (other end) | GND |

---

## 4. I2C LCD Display

> ⚠️ Run `i2c_scanner.ino` first to confirm your LCD's I2C address (0x27 or 0x3F)

```
I2C Backpack (small PCB on back of LCD):
┌─────┬─────┬─────┬─────┐
│ GND │ VCC │ SDA │ SCL │
└─────┴─────┴─────┴─────┘
  GND   5V    A4    A5
```

**Arduino Connections:**
| LCD I2C Pin | Arduino |
|-------------|---------|
| GND | GND |
| VCC | 5V |
| SDA | **A4** |
| SCL | **A5** |

> If LCD is on but nothing shows: turn the small blue potentiometer 
> on the I2C backpack to adjust contrast.

---

## 🗺️ Complete Wiring Summary (All Sensors at Once)

```
ARDUINO UNO
              ┌──────────────────────────────────────────┐
              │  D7  ──────────────────── PIR OUT        │
              │  D9  ──────────────────── HC-SR04 TRIG   │
              │  D10 ──────────────────── HC-SR04 ECHO   │
              │  A0  ──┬───────────────── LDR leg 2      │
              │        └── 10kΩ ── GND                   │
              │  A4  ──────────────────── LCD SDA        │
              │  A5  ──────────────────── LCD SCL        │
              │                                           │
              │  5V  ──┬── PIR VCC                       │
              │        ├── HC-SR04 VCC                   │
              │        ├── LDR leg 1                     │
              │        └── LCD VCC                       │
              │                                           │
              │  GND ──┬── PIR GND                       │
              │        ├── HC-SR04 GND                   │
              │        ├── 10kΩ (LDR resistor)           │
              │        └── LCD GND                       │
              └──────────────────────────────────────────┘
```

---

## 📟 Required Arduino Library

| Library | Who uses it | How to install |
|---------|-------------|----------------|
| **LiquidCrystal I2C** (by Frank de Brabander) | LCD display | Arduino IDE → Sketch → Include Library → Manage Libraries → Search "LiquidCrystal I2C" |

---

## ✅ Testing Order (Follow This!)

1. **Wire PIR only** → Upload `pir_test.ino` → Test motion detection
2. **Wire Ultrasonic only** → Upload `ultrasonic_test.ino` → Test distance reading  
3. **Wire LDR only** → Upload `ldr_test.ino` → Cover/uncover to test
4. **Wire LCD only** → Upload `i2c_scanner.ino` → Note I2C address
5. **Wire LCD** → Upload `lcd_test.ino` → Verify text shows on screen
6. **Wire ALL sensors** → Upload `holomat_sensor_hub.ino` → Full system running!

---

## 🔍 Serial Monitor Settings

Always set Serial Monitor to **115200 baud** (except i2c_scanner which uses 9600).

In Arduino IDE: Tools → Serial Monitor → select baud rate bottom-right
