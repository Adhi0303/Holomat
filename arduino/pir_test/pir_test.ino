/*
  ============================================================
  HoloMat - PIR Motion Sensor Test
  Sensor: HC-SR501
  ============================================================

  WIRING:
  ┌──────────────┬───────────────┐
  │ PIR Pin      │ Arduino Pin   │
  ├──────────────┼───────────────┤
  │ VCC          │ 5V            │
  │ GND          │ GND           │
  │ OUT (signal) │ Digital 7     │
  └──────────────┴───────────────┘

  NOTES:
  - HC-SR501 has a ~60 second warmup time after powering on
  - The two orange potentiometers on the sensor:
      Left  = Sensitivity (turn clockwise = more sensitive)
      Right = Time delay (how long output stays HIGH after motion)
  - Once motion is detected, OUT goes HIGH for ~3-5 seconds
  - After that, it resets and waits for motion again

  WHAT THIS SKETCH DOES:
  - Reads the PIR sensor every 200ms
  - Sends JSON to Serial Monitor: {"motion": true/false}
  - Blinks built-in LED (pin 13) when motion is detected
*/

// --- PIN DEFINITIONS ---
const int PIR_PIN = 7;  // PIR OUT signal pin
const int LED_PIN = 13; // Built-in LED for visual feedback

// --- STATE TRACKING ---
bool lastMotionState = false; // Track last reading to detect changes
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL = 200; // Read every 200ms

void setup() {
  Serial.begin(115200);    // Match this baud rate in Serial Monitor
  pinMode(PIR_PIN, INPUT); // PIR output is digital input to Arduino
  pinMode(LED_PIN, OUTPUT);

  Serial.println("=== HoloMat PIR Sensor Test ===");
  Serial.println("Warming up PIR sensor... (Please wait 30 seconds!)");
  Serial.println("Do NOT move in front of it during this time.");

  // Proper 30-second hardware warmup
  for (int i = 30; i > 0; i--) {
    Serial.print(i);
    Serial.print("... ");
    digitalWrite(LED_PIN, HIGH);
    delay(500);
    digitalWrite(LED_PIN, LOW);
    delay(500);
  }
  Serial.println();

  Serial.println("PIR Ready! Move in front of sensor...");
  Serial.println("Format: {\"motion\": true/false}");
  Serial.println("---");
}

void loop() {
  unsigned long now = millis();

  // Read sensor at fixed interval
  if (now - lastReadTime >= READ_INTERVAL) {
    lastReadTime = now;

    bool motionDetected = digitalRead(PIR_PIN) == HIGH;

    // Only print when state changes (reduces Serial spam)
    if (motionDetected != lastMotionState) {
      lastMotionState = motionDetected;

      // Send JSON
      Serial.print("{\"motion\": ");
      Serial.print(motionDetected ? "true" : "false");
      Serial.println("}");

      // Visual feedback via LED
      digitalWrite(LED_PIN, motionDetected ? HIGH : LOW);

      // Human-readable message
      if (motionDetected) {
        Serial.println(">> MOTION DETECTED!");
      } else {
        Serial.println(">> Motion cleared.");
      }
    }
  }
}
