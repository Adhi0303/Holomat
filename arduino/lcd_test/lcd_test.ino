/*
  ============================================================
  HoloMat - I2C LCD Display Test
  ============================================================

  REQUIRED LIBRARY:
  In Arduino IDE → Sketch → Include Library → Manage Libraries
  Search: "LiquidCrystal I2C" by Frank de Brabander → Install

  WIRING:
  ┌──────────────┬───────────────┐
  │ LCD I2C Pin  │ Arduino Pin   │
  ├──────────────┼───────────────┤
  │ VCC          │ 5V            │
  │ GND          │ GND           │
  │ SDA          │ A4            │
  │ SCL          │ A5            │
  └──────────────┴───────────────┘

  ⚠️  BEFORE RUNNING THIS:
  Run i2c_scanner.ino first to find your LCD I2C address.
  Then set it in the LCD_ADDRESS variable below.
  Common addresses: 0x27 (most common) or 0x3F

  WHAT THIS SKETCH DOES:
  - Tests LCD by cycling through display content every 3 seconds
  - Scrolls text, shows sensor placeholders
  - Verifies your LCD is working correctly before integration
*/

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ⚠️ SET YOUR LCD ADDRESS HERE (run i2c_scanner.ino first)
#define LCD_ADDRESS 0x27  // Change to 0x3F if 0x27 doesn't work

// Set LCD size: (address, columns, rows)
// For 16x2 LCD: LiquidCrystal_I2C lcd(LCD_ADDRESS, 16, 2)
// For 20x4 LCD: LiquidCrystal_I2C lcd(LCD_ADDRESS, 20, 4)
LiquidCrystal_I2C lcd(LCD_ADDRESS, 16, 2);

int testStep = 0;
unsigned long lastTestTime = 0;
const unsigned long TEST_INTERVAL = 3000; // Show each test for 3 seconds

// Custom degree symbol for temperature display
byte degreeSymbol[8] = {
  0b00110,
  0b01001,
  0b01001,
  0b00110,
  0b00000,
  0b00000,
  0b00000,
  0b00000
};

void setup() {
  Serial.begin(115200);
  
  // Initialize LCD
  lcd.init();
  lcd.backlight(); // Turn on backlight
  lcd.createChar(0, degreeSymbol); // Register custom degree symbol
  
  Serial.println("=== HoloMat LCD Display Test ===");
  Serial.println("You should see messages on your LCD.");
  Serial.println("If screen is blank, try adjusting the contrast");
  Serial.println("  potentiometer on the back of the I2C module.");
  Serial.println("---");
  
  // Show boot message
  lcd.setCursor(0, 0);
  lcd.print("  HOLOMAT v1.0  ");
  lcd.setCursor(0, 1);
  lcd.print("  Initializing..");
  delay(2000);
}

void loop() {
  unsigned long now = millis();
  
  if (now - lastTestTime >= TEST_INTERVAL) {
    lastTestTime = now;
    lcd.clear();
    
    switch (testStep) {
      case 0:
        // Test 1: Basic text
        lcd.setCursor(0, 0);
        lcd.print("LCD Test #1");
        lcd.setCursor(0, 1);
        lcd.print("Basic Text OK!");
        Serial.println("Test 1: Basic text display");
        break;
        
      case 1:
        // Test 2: Simulate sensor data
        lcd.setCursor(0, 0);
        lcd.print("Motion: YES");
        lcd.setCursor(0, 1);
        lcd.print("Dist:  42.5 cm");
        Serial.println("Test 2: Sensor data display");
        break;
        
      case 2:
        // Test 3: Numbers and special char
        lcd.setCursor(0, 0);
        lcd.print("Temp: 27.5");
        lcd.write(0); // Print degree symbol
        lcd.print("C");
        lcd.setCursor(0, 1);
        lcd.print("Light: 78%");
        Serial.println("Test 3: Numbers + special char");
        break;
        
      case 3:
        // Test 4: HoloMat status screen
        lcd.setCursor(0, 0);
        lcd.print("HOLOMAT ACTIVE");
        lcd.setCursor(0, 1);
        lcd.print("Zone: FAR      ");
        Serial.println("Test 4: HoloMat status screen");
        break;
        
      case 4:
        // Test 5: Scrolling text simulation
        lcd.setCursor(0, 0);
        lcd.print("System Online!");
        lcd.setCursor(0, 1);
        lcd.print("All sensors OK");
        Serial.println("Test 5: All sensors OK message");
        testStep = -1; // Will be incremented to 0 → loop
        break;
    }
    
    testStep++;
  }
}
