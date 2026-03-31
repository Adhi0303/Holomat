/*
  ============================================================
  HoloMat - I2C Address Scanner
  Run this FIRST to find your LCD's I2C address!
  ============================================================

  WIRING (same as LCD):
  ┌──────────────┬───────────────┐
  │ LCD/I2C Pin  │ Arduino Pin   │
  ├──────────────┼───────────────┤
  │ VCC          │ 5V            │
  │ GND          │ GND           │
  │ SDA          │ A4            │
  │ SCL          │ A5            │
  └──────────────┴───────────────┘

  WHY:
  I2C LCD modules have a small PCF8574 chip soldered on the back.
  The I2C address is set by solder bridges on that chip.
  Most common addresses are 0x27 or 0x3F.
  This scanner will tell you exactly which one yours is.

  HOW TO USE:
  1. Wire LCD to Arduino as above
  2. Upload this sketch
  3. Open Serial Monitor at 9600 baud
  4. You'll see: "Found device at address: 0x27" (or 0x3F)
  5. Note that address — you'll need it for lcd_test.ino
*/

#include <Wire.h>

void setup() {
  Wire.begin();
  Serial.begin(9600);
  
  Serial.println("=== I2C Address Scanner ===");
  Serial.println("Scanning for I2C devices...");
  Serial.println();
  
  int deviceCount = 0;
  
  // Scan all 127 possible I2C addresses
  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    byte error = Wire.endTransmission();
    
    if (error == 0) {
      // Found a device!
      Serial.print("✓ Found device at address: 0x");
      if (address < 16) {
        Serial.print("0"); // Leading zero for hex formatting
      }
      Serial.println(address, HEX);
      
      // Give hints for common devices
      if (address == 0x27 || address == 0x3F) {
        Serial.println("  → This is likely your LCD display module (PCF8574)");
      }
      if (address == 0x76 || address == 0x77) {
        Serial.println("  → This might be a BME280/BMP280 sensor");
      }
      
      deviceCount++;
    }
  }
  
  Serial.println();
  if (deviceCount == 0) {
    Serial.println("✗ No I2C devices found!");
    Serial.println();
    Serial.println("Check:");
    Serial.println("  1. SDA is connected to A4");
    Serial.println("  2. SCL is connected to A5");
    Serial.println("  3. VCC is 5V (not 3.3V for LCD)");
    Serial.println("  4. GND is connected");
    Serial.println("  5. LCD module has I2C backpack soldered on");
  } else {
    Serial.print("Total devices found: ");
    Serial.println(deviceCount);
    Serial.println();
    Serial.println("Use this address in lcd_test.ino");
  }
}

void loop() {
  // Nothing to do — scanner runs once in setup()
  // Reset Arduino to scan again
}
