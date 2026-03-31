/*
  ============================================================
  HoloMat - HC-SR04 Ultrasonic Distance Sensor Test
  ============================================================

  WIRING:
  ┌──────────────┬───────────────┐
  │ HC-SR04 Pin  │ Arduino Pin   │
  ├──────────────┼───────────────┤
  │ VCC          │ 5V            │
  │ GND          │ GND           │
  │ TRIG         │ Digital 9     │
  │ ECHO         │ Digital 10    │
  └──────────────┴───────────────┘

  HOW IT WORKS:
  1. Arduino sends a 10µs HIGH pulse to TRIG
  2. Sensor emits 8 ultrasonic pulses at 40kHz
  3. ECHO pin goes HIGH for as long as it takes sound to 
     travel to the object and back
  4. Distance = (pulse duration × speed of sound) / 2
     Speed of sound ≈ 0.0343 cm/µs at room temperature

  VALID RANGE: 2cm to 400cm
  ACCURACY:    ±3mm

  WHAT THIS SKETCH DOES:
  - Reads distance every 100ms
  - Sends JSON: {"distance": 42.5}
  - Also shows human-readable zone description for HoloMat:
      < 15cm  = GRAB zone
      15-40cm = GESTURE zone (HoloMat interaction zone)
      40-80cm = NEAR zone
      > 80cm  = FAR / no interaction
*/

// --- PIN DEFINITIONS ---
const int TRIG_PIN = 9;
const int ECHO_PIN = 10;
const int LED_PIN = 13;

// --- DISTANCE THRESHOLDS (cm) for HoloMat zones ---
const float GRAB_ZONE = 15.0;
const float GESTURE_ZONE = 40.0;
const float NEAR_ZONE = 80.0;

// --- TIMING ---
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL = 100; // 10Hz

float readDistance() {
  // Start with TRIG LOW to ensure clean pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  
  // Send 10µs HIGH pulse to trigger measurement
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Measure duration of ECHO pulse
  // pulseIn returns duration in microseconds (timeout = 30000µs = 30ms)
  // 30ms timeout corresponds to ~500cm — well beyond our max range of 400cm
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  
  // Timeout check — if no echo received
  if (duration == 0) {
    return -1.0; // Indicates out-of-range or error
  }
  
  // Convert to cm: distance = (duration × 0.0343) / 2
  float distance = (duration * 0.0343) / 2.0;
  
  // Filter invalid readings
  if (distance < 2.0 || distance > 400.0) {
    return -1.0;
  }
  
  return distance;
}

String getZone(float dist) {
  if (dist < 0) return "OUT_OF_RANGE";
  if (dist < GRAB_ZONE) return "GRAB";
  if (dist < GESTURE_ZONE) return "GESTURE";
  if (dist < NEAR_ZONE) return "NEAR";
  return "FAR";
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  
  Serial.println("=== HoloMat Ultrasonic Sensor Test ===");
  Serial.println("Point sensor at an object and move it closer/farther.");
  Serial.println("Format: {\"distance\": 42.5, \"zone\": \"GESTURE\"}");
  Serial.println("---");
  delay(500);
}

void loop() {
  unsigned long now = millis();
  
  if (now - lastReadTime >= READ_INTERVAL) {
    lastReadTime = now;
    
    float dist = readDistance();
    String zone = getZone(dist);
    
    // Send JSON output
    Serial.print("{\"distance\": ");
    if (dist < 0) {
      Serial.print("null");
    } else {
      Serial.print(dist, 1); // 1 decimal place
    }
    Serial.print(", \"zone\": \"");
    Serial.print(zone);
    Serial.println("\"}");
    
    // LED on when in interaction zone
    digitalWrite(LED_PIN, (dist > 0 && dist < NEAR_ZONE) ? HIGH : LOW);
  }
}
