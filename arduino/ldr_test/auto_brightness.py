import serial
import json
import time
import screen_brightness_control as sbc

# ==========================================
# CONFIGURATION
# ==========================================
# IMPORTANT: Change this to match the COM port in your Arduino IDE!
# E.g., 'COM5', 'COM3'
SERIAL_PORT = 'COM5'
BAUD_RATE = 115200

def main():
    print("========================================")
    print(" ☀️ HoloMat Auto-Brightness Controller")
    print("========================================")
    print(f"Connecting to Arduino on {SERIAL_PORT}...")
    
    try:
        # Before this runs, ensure the Arduino IDE Serial Monitor is CLOSED!
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print("✅ Connected! Waiting for LDR data...\n")
        
        while True:
            if ser.in_waiting > 0:
                # Read the line from Arduino
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                
                # Check if it looks like the expected JSON
                if line.startswith('{') and line.endswith('}'):
                    try:
                        data = json.loads(line)
                        
                        if "light" in data:
                            room_light_pct = data["light"]  # 0 to 100 from LDR
                            
                            # We don't want the screen to go to 0% (pitch black)
                            # So we map the 0-100% room lighting to 20-100% screen brightness
                            target_brightness = max(20, min(100, room_light_pct))
                            
                            # Get current screen brightness (sbc returns a list for multimonitor, we grab the first)
                            current_brightness = sbc.get_brightness()[0]
                            
                            # Only adjust if the change is significant (> 5%) to prevent jitter
                            if abs(current_brightness - target_brightness) > 5:
                                sbc.set_brightness(target_brightness)
                                print(f"Room light: {room_light_pct}% ➔ Adjusted laptop screen to {target_brightness}%")
                                
                    except json.JSONDecodeError:
                        # Ignore garbled serial text during startup
                        pass
                        
            # Sleep slightly to avoid 100% CPU usage
            time.sleep(0.1)
            
    except serial.SerialException:
        print(f"❌ ERROR: Could not connect to {SERIAL_PORT}.")
        print("   -> Did you leave the Arduino IDE Serial Monitor open?")
        print("   -> You MUST close the Serial Monitor before running this script!")
    except ImportError:
        print("❌ ERROR: Missing libraries.")
        print("Please run: pip install pyserial screen-brightness-control")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")

if __name__ == "__main__":
    main()
