/*
  ============================================================
  HoloMat - LDR Light Sensor Test
  ============================================================

  WIRING (Voltage Divider Circuit):

  5V ──┬──[LDR]──┬── A0 (Arduino)
       │         │
      GND   [10kΩ Resistor]
                 │
                GND

  HOW IT WORKS:
  - LDR (Light Dependent Resistor) changes resistance based on light
  - In bright light: LDR resistance LOW → A0 voltage HIGH → reading HIGH
  - In dark:         LDR resistance HIGH → A0 voltage LOW → reading LOW
  - Arduino reads 0–1023 (10-bit ADC) on analog pin A0
  - We convert this to a 0–100% scale

  IMPORTANT:
  - You NEED the 10kΩ resistor to form a voltage divider
  - Without it, you'll get garbage readings or damage the pin
  - Connect LDR directly to 5V and to A0
  - Connect 10kΩ between A0 and GND

  WHAT THIS SKETCH DOES:
  - Reads analog A0 every 200ms (light sensor is slow — no need for high freq)
  - Averages 5 readings to smooth out noise
  - Sends JSON: {"light": 78, "raw": 800, "status": "BRIGHT"}
  - Status labels: DARK, DIM, NORMAL, BRIGHT
*/

// --- PIN DEFINITION ---
const int LDR_PIN = A0;
const int LED_PIN = 13;

// --- LIGHT THRESHOLDS (percentage) ---
const int DARK_THRESHOLD = 20;
const int DIM_THRESHOLD = 40;
const int BRIGHT_THRESHOLD = 70;

// --- SMOOTHING ---
const int NUM_SAMPLES = 5; // Average over 5 readings for stability

// --- TIMING ---
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL = 200; // 5Hz (light changes slowly)

// Reads multiple samples and returns averaged analog value
int readAveraged() {
  long total = 0;
  for (int i = 0; i < NUM_SAMPLES; i++) {
    total += analogRead(LDR_PIN);
    delay(5); // Small delay between samples
  }
  return total / NUM_SAMPLES;
}

// Convert raw ADC value to percentage
int toPercent(int raw) {
  // map() function: map(value, fromLow, fromHigh, toLow, toHigh)
  return map(raw, 0, 1023, 0, 100);
}

// Get a human-readable status label
String getLightStatus(int percent) {
  if (percent < DARK_THRESHOLD) return "DARK";
  if (percent < DIM_THRESHOLD) return "DIM";
  if (percent < BRIGHT_THRESHOLD) return "NORMAL";
  return "BRIGHT";
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  
  // A0 is analog — no pinMode needed, but set to INPUT explicitly
  pinMode(LDR_PIN, INPUT);
  
  Serial.println("=== HoloMat LDR Light Sensor Test ===");
  Serial.println("Cover the LDR (dark) or shine a light on it.");
  Serial.println("Format: {\"light\": 78, \"raw\": 800, \"status\": \"BRIGHT\"}");
  Serial.println("---");
  delay(200);
}

void loop() {
  unsigned long now = millis();
  
  if (now - lastReadTime >= READ_INTERVAL) {
    lastReadTime = now;
    
    int raw = readAveraged();
    int percent = toPercent(raw);
    String status = getLightStatus(percent);
    
    // Send JSON
    Serial.print("{\"light\": ");
    Serial.print(percent);
    Serial.print(", \"raw\": ");
    Serial.print(raw);
    Serial.print(", \"status\": \"");
    Serial.print(status);
    Serial.println("\"}");
    
    // Blink LED faster when bright, slower when dark
    // (simple visual indicator)
    digitalWrite(LED_PIN, (percent > 50) ? HIGH : LOW);
  }
}
