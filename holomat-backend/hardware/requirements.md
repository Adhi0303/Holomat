# Hardware Requirements for Real IoT Sensors

## Required Components

### 1. Motion Detection
- **PIR Sensor (HC-SR501)** - $2-5
- **Connection**: GPIO 18
- **Function**: Auto-wake system

### 2. Gesture Control  
- **3x Ultrasonic Sensors (HC-SR04)** - $3-6 each
- **Connections**: 
  - Left: Trigger GPIO 23, Echo GPIO 24
  - Center: Trigger GPIO 25, Echo GPIO 8  
  - Right: Trigger GPIO 7, Echo GPIO 1
- **Function**: Hand gesture detection

### 3. Environmental Monitoring
- **DHT22 Temperature/Humidity Sensor** - $5-10
- **Connection**: GPIO 4
- **Function**: Environmental data

### 4. Light Detection
- **LDR (Light Dependent Resistor)** - $1-2
- **MCP3008 ADC Converter** - $3-5
- **Connection**: SPI interface
- **Function**: Auto-brightness control

### 5. Camera & Audio
- **USB Webcam** - $10-30
- **USB Microphone** - $5-15
- **Function**: Face recognition, voice control

### 6. Output Devices
- **WS2812B LED Strip** - $10-20
- **I2C LCD Display (20x4)** - $8-15
- **Speaker (3.5mm)** - $5-10

## Python Libraries Required

```bash
# Install on Raspberry Pi
pip install RPi.GPIO
pip install gpiozero
pip install Adafruit-DHT
pip install opencv-python
pip install rpi_ws281x
pip install RPLCD
```

## GPIO Pin Layout

```
GPIO 18 - PIR Motion Sensor
GPIO 23 - Ultrasonic Left Trigger
GPIO 24 - Ultrasonic Left Echo
GPIO 25 - Ultrasonic Center Trigger
GPIO 8  - Ultrasonic Center Echo
GPIO 7  - Ultrasonic Right Trigger
GPIO 1  - Ultrasonic Right Echo
GPIO 4  - DHT22 Temperature/Humidity
GPIO 2  - I2C SDA (LCD)
GPIO 3  - I2C SCL (LCD)
GPIO 10 - SPI MOSI (MCP3008)
GPIO 9  - SPI MISO (MCP3008)
GPIO 11 - SPI SCLK (MCP3008)
GPIO 8  - SPI CE0 (MCP3008)
GPIO 18 - WS2812B LED Strip
```

## Total Cost Estimate: $80-150