/*
  ============================================================
  HoloMat - Master Sensor Hub
  Stage 2: All sensors combined → JSON output → Raspberry Pi
  ============================================================

  COMPONENTS:
  - PIR Motion Sensor (HC-SR501)
  - HC-SR04 Ultrasonic Distance Sensor
  - LDR Light Sensor
  - I2C LCD Display (16x2 or 20x4)

  ⚠️ LIBRARIES REQUIRED (install via Arduino IDE Library Manager):
  - "LiquidCrystal I2C" by Frank de Brabander

  WIRING (ALL sensors at once):
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
  └────────────────────┴───────────────┘

  OUTPUT FORMAT (JSON — sent over USB Serial at 115200 baud):
  {
    "motion": true,
    "distance": 42.5,
    "zone": "GESTURE",
    "light": 78,
    "light_status": "BRIGHT",
    "lcd": true,
    "uptime": 12345
  }

  HOW THIS CONNECTS TO RASPBERRY PI:
  - Plug Arduino into Pi via USB cable
  - Pi reads this JSON from /dev/ttyACM0 or /dev/ttyUSB0
  - arduino_bridge.py on Pi parses this into sensor_cache
  - FastAPI serves it to the HoloMat frontend via WebSocket
*/

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ============================================================
// CONFIGURATION — ADJUST THESE IF NEEDED
// ============================================================
#define LCD_ADDRESS   0x27  // Run i2c_scanner.ino to find yours (0x27 or 0x3F)
#define LCD_COLS      16    // Change to 20 for 20x4 LCD
#define LCD_ROWS      2     // Change to 4 for 20x4 LCD

// PIN DEFINITIONS
const int PIR_PIN   = 7;
const int TRIG_PIN  = 9;
const int ECHO_PIN  = 10;
const int LDR_PIN   = A0;

// SENSOR TIMING
const unsigned long SENSOR_INTERVAL  = 100;   // Read all sensors every 100ms (10Hz)
const unsigned long LCD_INTERVAL     = 500;   // Update LCD every 500ms (2Hz — LCD is slow)
const unsigned long SERIAL_INTERVAL  = 100;   // Send JSON every 100ms

// DISTANCE ZONES (cm)
const float DIST_GRAB    = 15.0;
const float DIST_GESTURE = 40.0;
const float DIST_NEAR    = 80.0;

// LDR THRESHOLDS (%)
const int LIGHT_DARK   = 20;
const int LIGHT_DIM    = 40;
const int LIGHT_BRIGHT = 70;

// LDR smoothing samples
const int LDR_SAMPLES = 5;

// ============================================================
// STATE VARIABLES
// ============================================================
bool   motionDetected = false;
float  distance       = 0.0;
String zone           = "FAR";
int    lightPercent   = 0;
String lightStatus    = "NORMAL";
bool   lcdOk          = false;

unsigned long lastSensorRead = 0;
unsigned long lastLcdUpdate  = 0;
unsigned long lastSerialSend = 0;

// ============================================================
// LCD SETUP
// ============================================================
LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLS, LCD_ROWS);

// Custom characters
byte degChar[8] = {0b00110,0b01001,0b01001,0b00110,0b00000,0b00000,0b00000,0b00000};

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
  return map(sum / LDR_SAMPLES, 0, 1023, 0, 100);
}

String getLightStatus(int pct) {
  if (pct < LIGHT_DARK)   return "DARK";
  if (pct < LIGHT_DIM)    return "DIM";
  if (pct < LIGHT_BRIGHT) return "NORMAL";
  return "BRIGHT";
}

// ============================================================
// SERIAL JSON OUTPUT
// ============================================================
void sendJSON() {
  Serial.print("{");
  
  // Motion
  Serial.print("\"motion\":");
  Serial.print(motionDetected ? "true" : "false");
  Serial.print(",");
  
  // Distance
  Serial.print("\"distance\":");
  if (distance < 0) {
    Serial.print("null");
  } else {
    Serial.print(distance, 1);
  }
  Serial.print(",");
  
  // Zone
  Serial.print("\"zone\":\"");
  Serial.print(zone);
  Serial.print("\",");
  
  // Light
  Serial.print("\"light\":");
  Serial.print(lightPercent);
  Serial.print(",");
  
  // Light status
  Serial.print("\"light_status\":\"");
  Serial.print(lightStatus);
  Serial.print("\",");
  
  // LCD status
  Serial.print("\"lcd\":");
  Serial.print(lcdOk ? "true" : "false");
  Serial.print(",");
  
  // Uptime in seconds
  Serial.print("\"uptime\":");
  Serial.print(millis() / 1000);
  
  Serial.println("}");
}

// ============================================================
// LCD DISPLAY UPDATE
// ============================================================
void updateLCD() {
  if (!lcdOk) return;
  
  lcd.clear();
  
  if (LCD_ROWS >= 4) {
    // 20x4 LCD layout
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
    // 16x2 LCD layout (shows alternating data)
    // Row 1: Motion + Distance
    lcd.setCursor(0, 0);
    lcd.print("M:");
    lcd.print(motionDetected ? "Y " : "N ");
    lcd.print("D:");
    if (distance >= 0) {
      // Pad distance to keep layout clean
      char distStr[6];
      dtostrf(distance, 4, 1, distStr);
      lcd.print(distStr);
      lcd.print("cm");
    } else {
      lcd.print("--.- cm");
    }
    
    // Row 2: Light + Zone
    lcd.setCursor(0, 1);
    lcd.print("L:");
    lcd.print(lightPercent);
    lcd.print("% Z:");
    lcd.print(zone.substring(0, 4)); // First 4 chars of zone name
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
  
  // Initialize I2C and LCD
  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.createChar(0, degChar);
  lcdOk = true;
  
  // Boot splash on LCD
  lcd.setCursor(0, 0);
  lcd.print("  HOLOMAT HUB   ");
  lcd.setCursor(0, 1);
  lcd.print(" Starting up... ");
  
  // Log startup to Serial
  Serial.println("=== HoloMat Sensor Hub ===");
  Serial.println("All sensors starting at 10Hz...");
  Serial.println("Connect to Raspberry Pi via USB.");
  Serial.println("Pi reads this on /dev/ttyACM0 at 115200 baud.");
  Serial.println("---");
  
  delay(1500);
  lcd.clear();
}

// ============================================================
// MAIN LOOP
// ============================================================
void loop() {
  unsigned long now = millis();
  
  // --- Read all sensors at 10Hz ---
  if (now - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = now;
    
    motionDetected = readPIR();
    distance       = readUltrasonic();
    zone           = getZone(distance);
    lightPercent   = readLDR();
    lightStatus    = getLightStatus(lightPercent);
    
    // Built-in LED: ON when motion or something in gesture zone
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
