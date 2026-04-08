/*
  ============================================================
  HoloMat - Master Sensor Hub  (v2.0 — Full Workstation)
  ============================================================
  Bidirectional: reads sensors → sends JSON to Pi
                 receives commands ← from Pi (IR, LCD, etc.)

  COMPONENTS:
  - PIR Motion Sensor (HC-SR501)
  - HC-SR04 Ultrasonic Distance Sensor
  - LDR Light Sensor
  - I2C LCD Display (16x2 or 20x4)
  - IR LED Transmitter (for projector brightness control)

  ⚠️ LIBRARIES REQUIRED (install via Arduino IDE Library Manager):
  - "LiquidCrystal I2C" by Frank de Brabander
  - "IRremote" by shirriff/z3t0 (v4.x)

  WIRING:
  ┌────────────────────┬───────────────┐
  │ Component & Pin    │ Arduino Pin   │
  ├────────────────────┼───────────────┤
  │ PIR VCC            │ 5V            │
  │ PIR GND            │ GND           │
  │ PIR OUT            │ Digital 7     │
  ├────────────────────┼───────────────┤
  │ HC-SR04 VCC        │ 5V            │
  │ HC-SR04 GND        │ GND           │
  │ HC-SR04 TRIG       │ Digital 9     │
  │ HC-SR04 ECHO       │ Digital 10    │
  ├────────────────────┼───────────────┤
  │ LDR (leg 1)        │ 5V            │
  │ LDR (leg 2)        │ A0            │
  │ 10kΩ resistor      │ A0 → GND      │
  ├────────────────────┼───────────────┤
  │ LCD VCC            │ 5V            │
  │ LCD GND            │ GND           │
  │ LCD SDA            │ A4            │
  │ LCD SCL            │ A5            │
  ├────────────────────┼───────────────┤
  │ IR LED (anode)     │ Digital 3     │
  │ IR LED (cathode)   │ GND (via 100Ω)│
  └────────────────────┴───────────────┘

  SERIAL OUTPUT (115200 baud, JSON, every 100ms):
  {"motion":true,"distance":42.5,"zone":"GESTURE","light":78,"light_raw":800,"light_status":"BRIGHT","lcd":true,"uptime":12}

  SERIAL INPUT (JSON commands from Raspberry Pi):
  {"cmd":"ir","action":"brightness_up"}
  {"cmd":"ir","action":"brightness_down"}
  {"cmd":"ir","action":"power"}
  {"cmd":"lcd","line1":"HOLOMAT ONLINE","line2":"Welcome, Sir"}
  {"cmd":"lcd_status","text":"STANDBY"}
*/

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <IRremote.h>

// ============================================================
// CONFIGURATION
// ============================================================
#define LCD_ADDRESS   0x27
#define LCD_COLS      16
#define LCD_ROWS      2

// PIN DEFINITIONS
const int PIR_PIN   = 7;
const int TRIG_PIN  = 9;
const int ECHO_PIN  = 10;
const int LDR_PIN   = A0;
const int IR_SEND_PIN = 3;  // IR LED on pin 3 (must be PWM pin)

// SENSOR TIMING
const unsigned long SENSOR_INTERVAL  = 100;   // 10Hz
const unsigned long LCD_INTERVAL     = 500;   // 2Hz
const unsigned long SERIAL_INTERVAL  = 100;   // 10Hz

// DISTANCE ZONES (cm)
const float DIST_GRAB    = 15.0;
const float DIST_GESTURE = 40.0;
const float DIST_NEAR    = 80.0;

// LDR THRESHOLDS (%)
const int LIGHT_DARK   = 20;
const int LIGHT_DIM    = 40;
const int LIGHT_BRIGHT = 70;

// LDR smoothing
const int LDR_SAMPLES = 5;

// ============================================================
// IR CODES — HY320 Projector (NEC Protocol)
// These are common NEC codes for generic Chinese projectors.
// If your projector doesn't respond, use the IR learning mode
// to capture codes from your actual remote.
// ============================================================
const uint32_t IR_POWER         = 0x00FF02FD;
const uint32_t IR_BRIGHTNESS_UP = 0x00FF906F;
const uint32_t IR_BRIGHTNESS_DN = 0x00FFA857;
const uint32_t IR_MENU          = 0x00FF22DD;
const uint32_t IR_OK            = 0x00FF02FD;

// ============================================================
// STATE VARIABLES
// ============================================================
bool   motionDetected = false;
float  distance       = 0.0;
String zone           = "FAR";
int    lightPercent   = 0;
int    lightRaw       = 0;
String lightStatus    = "NORMAL";
bool   lcdOk          = false;

unsigned long lastSensorRead = 0;
unsigned long lastLcdUpdate  = 0;
unsigned long lastSerialSend = 0;

// Serial input buffer
String serialInputBuffer = "";

// LCD custom text (set by Pi commands)
String lcdCustomLine1 = "";
String lcdCustomLine2 = "";
bool   lcdCustomMode  = false;
unsigned long lcdCustomExpiry = 0;

// ============================================================
// LCD SETUP
// ============================================================
LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLS, LCD_ROWS);

// ============================================================
// SENSOR FUNCTIONS
// ============================================================

bool readPIR() {
  return digitalRead(PIR_PIN) == HIGH;
}

float readUltrasonic() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long dur = pulseIn(ECHO_PIN, HIGH, 30000);
  if (dur == 0) return -1.0;

  float d = (dur * 0.0343) / 2.0;
  return (d >= 2.0 && d <= 400.0) ? d : -1.0;
}

String getZone(float d) {
  if (d < 0)           return "NONE";
  if (d < DIST_GRAB)   return "GRAB";
  if (d < DIST_GESTURE)return "GESTURE";
  if (d < DIST_NEAR)   return "NEAR";
  return "FAR";
}

int readLDR() {
  long sum = 0;
  for (int i = 0; i < LDR_SAMPLES; i++) {
    sum += analogRead(LDR_PIN);
    delay(2);
  }
  lightRaw = sum / LDR_SAMPLES;
  return map(lightRaw, 0, 1023, 0, 100);
}

String getLightStatus(int pct) {
  if (pct < LIGHT_DARK)   return "DARK";
  if (pct < LIGHT_DIM)    return "DIM";
  if (pct < LIGHT_BRIGHT) return "NORMAL";
  return "BRIGHT";
}

// ============================================================
// IR TRANSMITTER
// ============================================================
void sendIRCommand(uint32_t code) {
  IrSender.sendNEC(code >> 16, code & 0xFFFF, 0);
  Serial.print("{\"ir_sent\":\"0x");
  Serial.print(code, HEX);
  Serial.println("\"}");
}

// ============================================================
// SERIAL COMMAND HANDLER (Pi → Arduino)
// ============================================================
void processSerialCommand(String input) {
  input.trim();
  if (!input.startsWith("{") || !input.endsWith("}")) return;

  // Simple JSON parser for our specific command format
  // We avoid using ArduinoJson to save memory

  if (input.indexOf("\"cmd\":\"ir\"") >= 0) {
    // IR command
    if (input.indexOf("\"action\":\"brightness_up\"") >= 0) {
      sendIRCommand(IR_BRIGHTNESS_UP);
    } else if (input.indexOf("\"action\":\"brightness_down\"") >= 0) {
      sendIRCommand(IR_BRIGHTNESS_DN);
    } else if (input.indexOf("\"action\":\"power\"") >= 0) {
      sendIRCommand(IR_POWER);
    } else if (input.indexOf("\"action\":\"menu\"") >= 0) {
      sendIRCommand(IR_MENU);
    }

  } else if (input.indexOf("\"cmd\":\"lcd\"") >= 0) {
    // LCD text command
    int l1Start = input.indexOf("\"line1\":\"");
    int l2Start = input.indexOf("\"line2\":\"");

    if (l1Start >= 0) {
      l1Start += 9;
      int l1End = input.indexOf("\"", l1Start);
      lcdCustomLine1 = input.substring(l1Start, l1End);
    }
    if (l2Start >= 0) {
      l2Start += 9;
      int l2End = input.indexOf("\"", l2Start);
      lcdCustomLine2 = input.substring(l2Start, l2End);
    }

    lcdCustomMode = true;
    lcdCustomExpiry = millis() + 10000; // Show custom text for 10 seconds
    updateLCDCustom();

  } else if (input.indexOf("\"cmd\":\"lcd_status\"") >= 0) {
    // LCD status text (persistent, no expiry)
    int tStart = input.indexOf("\"text\":\"");
    if (tStart >= 0) {
      tStart += 8;
      int tEnd = input.indexOf("\"", tStart);
      lcdCustomLine1 = "   HOLOMAT";
      lcdCustomLine2 = input.substring(tStart, tEnd);
      lcdCustomMode = true;
      lcdCustomExpiry = 0; // No expiry — stays until next command
      updateLCDCustom();
    }
  }
}

void updateLCDCustom() {
  if (!lcdOk) return;
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(lcdCustomLine1.substring(0, LCD_COLS));
  lcd.setCursor(0, 1);
  lcd.print(lcdCustomLine2.substring(0, LCD_COLS));
}

// ============================================================
// SERIAL JSON OUTPUT
// ============================================================
void sendJSON() {
  Serial.print("{");

  Serial.print("\"motion\":");
  Serial.print(motionDetected ? "true" : "false");
  Serial.print(",");

  Serial.print("\"distance\":");
  if (distance < 0) {
    Serial.print("null");
  } else {
    Serial.print(distance, 1);
  }
  Serial.print(",");

  Serial.print("\"zone\":\"");
  Serial.print(zone);
  Serial.print("\",");

  Serial.print("\"light\":");
  Serial.print(lightPercent);
  Serial.print(",");

  Serial.print("\"light_raw\":");
  Serial.print(lightRaw);
  Serial.print(",");

  Serial.print("\"light_status\":\"");
  Serial.print(lightStatus);
  Serial.print("\",");

  Serial.print("\"lcd\":");
  Serial.print(lcdOk ? "true" : "false");
  Serial.print(",");

  Serial.print("\"uptime\":");
  Serial.print(millis() / 1000);

  Serial.println("}");
}

// ============================================================
// LCD DISPLAY UPDATE (auto mode — shows live sensor data)
// ============================================================
void updateLCD() {
  if (!lcdOk) return;

  // If custom text is active and not expired, skip auto-update
  if (lcdCustomMode) {
    if (lcdCustomExpiry > 0 && millis() > lcdCustomExpiry) {
      lcdCustomMode = false; // Expired, return to auto
    } else {
      return; // Still showing custom text
    }
  }

  lcd.clear();

  if (LCD_ROWS >= 4) {
    lcd.setCursor(0, 0);
    lcd.print("Mtn:"); lcd.print(motionDetected ? "YES " : "NO  ");
    lcd.print("D:");
    if (distance >= 0) {
      lcd.print((int)distance); lcd.print("cm");
    } else {
      lcd.print("---");
    }

    lcd.setCursor(0, 1);
    lcd.print("Zone: "); lcd.print(zone);

    lcd.setCursor(0, 2);
    lcd.print("Light: "); lcd.print(lightPercent); lcd.print("% ");
    lcd.print(lightStatus);

    lcd.setCursor(0, 3);
    lcd.print("HOLOMAT ONLINE");

  } else {
    // 16x2 LCD
    lcd.setCursor(0, 0);
    lcd.print("M:");
    lcd.print(motionDetected ? "Y " : "N ");
    lcd.print("D:");
    if (distance >= 0) {
      char distStr[6];
      dtostrf(distance, 4, 1, distStr);
      lcd.print(distStr);
      lcd.print("cm");
    } else {
      lcd.print("--.- cm");
    }

    lcd.setCursor(0, 1);
    lcd.print("L:");
    lcd.print(lightPercent);
    lcd.print("% Z:");
    lcd.print(zone.substring(0, 4));
  }
}

// ============================================================
// SETUP
// ============================================================
void setup() {
  Serial.begin(115200);

  // Configure pins
  pinMode(PIR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);
  pinMode(LED_BUILTIN, OUTPUT);

  // Initialize IR transmitter
  IrSender.begin(IR_SEND_PIN, ENABLE_LED_FEEDBACK);

  // Initialize I2C and LCD
  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcdOk = true;

  // Boot splash
  lcd.setCursor(0, 0);
  lcd.print("  HOLOMAT HUB   ");
  lcd.setCursor(0, 1);
  lcd.print("   v2.0 READY   ");

  Serial.println("=== HoloMat Sensor Hub v2.0 ===");
  Serial.println("Bidirectional: sensors + IR + LCD commands");
  Serial.println("Baud: 115200 | IR Pin: D3 | PIR: D7");
  Serial.println("---");

  delay(1500);
  lcd.clear();
}

// ============================================================
// MAIN LOOP
// ============================================================
void loop() {
  unsigned long now = millis();

  // --- Check for incoming commands from Pi ---
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (serialInputBuffer.length() > 0) {
        processSerialCommand(serialInputBuffer);
        serialInputBuffer = "";
      }
    } else {
      serialInputBuffer += c;
      // Prevent buffer overflow
      if (serialInputBuffer.length() > 256) {
        serialInputBuffer = "";
      }
    }
  }

  // --- Read all sensors at 10Hz ---
  if (now - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = now;

    motionDetected = readPIR();
    distance       = readUltrasonic();
    zone           = getZone(distance);
    lightPercent   = readLDR();
    lightStatus    = getLightStatus(lightPercent);

    bool activeState = motionDetected || (distance > 0 && distance < DIST_GESTURE);
    digitalWrite(LED_BUILTIN, activeState ? HIGH : LOW);
  }

  // --- Send JSON over Serial at 10Hz ---
  if (now - lastSerialSend >= SERIAL_INTERVAL) {
    lastSerialSend = now;
    sendJSON();
  }

  // --- Update LCD at 2Hz ---
  if (now - lastLcdUpdate >= LCD_INTERVAL) {
    lastLcdUpdate = now;
    updateLCD();
  }
}
