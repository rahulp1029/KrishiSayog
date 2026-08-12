# 🌾 KrishiSayog Raspberry Pi 4 — Complete Setup Guide

> **KrishiSayog IoT Sensor Hub** — Monitors soil moisture, temperature, humidity, and water tank level in real-time. Pushes data to Firebase for the web dashboard and mobile app.

---

## 📦 Prerequisites

### Hardware You Need
| Component | Model | Purpose | Qty |
|---|---|---|---|
| Raspberry Pi 4 Model B | 2GB/4GB/8GB | Main controller | 1 |
| MicroSD Card | 16GB+ Class 10 | Pi storage | 1 |
| USB-C Power Supply | 5V/3A | Pi power | 1 |
| DHT11 Sensor | 3-pin module | Temperature & Humidity | 1 |
| Soil Moisture Sensor | With comparator board | Soil wet/dry detection | 1 |
| HC-SR04 Ultrasonic | 4-pin module | Water tank level | 1 |
| 5V Relay Module | 1-channel | Water pump control | 1 |
| Water Pump | 3-6V DC mini pump | Irrigation | 1 |
| Jumper Wires | Male-Female | Connections | ~15 |
| Breadboard | Half-size | Prototyping | 1 |
| 1kΩ + 2kΩ Resistors | For voltage divider | HC-SR04 ECHO (5V→3.3V) | 1 each |

### Software Requirements
- Raspberry Pi OS (Bookworm or Bullseye) — 32-bit or 64-bit
- Python 3.9+
- Internet connection (for Firebase sync)
- Firebase project with Realtime Database enabled

---

## 🔌 Wiring Diagram

### GPIO Pin Reference (BCM Numbering)

```
                    Raspberry Pi 4 GPIO Header
                    ┌───────────────────────┐
              3.3V  │ (1)  ●  ●  (2)  │  5V
    DHT11 DATA →    │ (3)  ●  ●  (4)  │  5V ← HC-SR04 VCC, Relay VCC
                    │ (5)  ●  ●  (6)  │  GND ← DHT11 GND
  GPIO4 (DHT11) →  │ (7)  ●  ●  (8)  │
                    │ (9)  ●  ●  (10) │
  GPIO17 (MOIST) → │ (11) ●  ●  (12) │
  GPIO27 (RELAY) → │ (13) ●  ●  (14) │  GND ← HC-SR04 GND
                    │ (15) ●  ●  (16) │  ← GPIO23 (TRIG)
              3.3V  │ (17) ●  ●  (18) │  ← GPIO24 (ECHO via divider)
  GPIO11 (LCD D7)→  │ (23) ●  ●  (24) │
                    │ (25) ●  ●  (26) │
                    │ (27) ●  ●  (28) │
  GPIO5 (LCD D6) →  │ (29) ●  ●  (30) │  GND ← LCD GND, Relay GND, Moisture GND
  GPIO6 (LCD D5) →  │ (31) ●  ●  (32) │
  GPIO13 (LCD D4)→  │ (33) ●  ●  (34) │
  GPIO19 (LCD EN)→  │ (35) ●  ●  (36) │
  GPIO26 (LCD RS)→  │ (37) ●  ●  (38) │
                    │ (39) ●  ●  (40) │
                    └───────────────────────┘
```

### Sensor & Display Wiring Table

| Component | Pin | → | Pi Pin | Pi GPIO | Notes |
|---|---|---|---|---|---|
| **DHT11** | VCC | → | Pin 1 | 3.3V | ⚠️ Use 3.3V, NOT 5V |
| | GND | → | Pin 6 | GND | |
| | DATA | → | Pin 7 | GPIO 4 | |
| **Soil Moisture** | VCC | → | Pin 17 | 3.3V | |
| | GND | → | Pin 9 | GND | |
| | DO | → | Pin 11 | GPIO 17 | Digital Output only |
| **HC-SR04** | VCC | → | Pin 4 | 5V | ⚠️ Must be 5V |
| | GND | → | Pin 14 | GND | |
| | TRIG | → | Pin 16 | GPIO 23 | |
| | ECHO | → | Pin 18 | GPIO 24 | ⚠️ **Through voltage divider!** |
| **Relay** | VCC | → | Pin 2 | 5V | |
| | GND | → | Pin 20 | GND | |
| | IN | → | Pin 13 | GPIO 27 | Signal pin |
| **16x2 LCD** | VSS | → | GND | GND | Ground |
| | VDD | → | Pin 2 | 5V | Power |
| | V0 | → | Potentiometer | — | Contrast adjust (connect pot middle pin) |
| | RS | → | Pin 37 | GPIO 26 | Register Select |
| | RW | → | GND | GND | Read/Write (ground = write-only) |
| | EN | → | Pin 35 | GPIO 19 | Enable |
| | D4 | → | Pin 33 | GPIO 13 | Data bit 4 |
| | D5 | → | Pin 31 | GPIO 6 | Data bit 5 |
| | D6 | → | Pin 29 | GPIO 5 | Data bit 6 |
| | D7 | → | Pin 23 | GPIO 11 | Data bit 7 |
| | A (LED+) | → | Pin 2 | 5V | Backlight anode (via 220Ω resistor) |
| | K (LED-) | → | GND | GND | Backlight cathode |

### ⚠️ IMPORTANT: HC-SR04 Voltage Divider

The HC-SR04 ECHO pin outputs **5V**, but the Raspberry Pi GPIO pins are **3.3V tolerant only**. You **MUST** use a voltage divider to protect your Pi!

```
HC-SR04 ECHO ──── [1kΩ] ──┬── GPIO 24 (Pin 18)
                           │
                         [2kΩ]
                           │
                          GND
```

This divides 5V down to ~3.3V: `5V × 2kΩ / (1kΩ + 2kΩ) = 3.33V` ✅

### 💡 LCD Contrast Adjustment

The LCD V0 pin controls text contrast. Connect a **10kΩ potentiometer**:
- One end → 5V
- Other end → GND  
- Middle (wiper) → LCD V0 pin

Turn the potentiometer slowly until you see clear text on the LCD. If you don't have a potentiometer, connect V0 directly to GND for maximum contrast.


---

## 🛠️ Software Setup

### Step 1: Prepare the Raspberry Pi OS

If you haven't already, install Raspberry Pi OS:
1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Flash Raspberry Pi OS (32-bit or 64-bit) to your MicroSD card
3. Boot the Pi and complete initial setup (WiFi, password, etc.)

### Step 2: Transfer Files to the Pi

Copy the entire `KrishiSayog_RaspberryPi_IoT` folder to your Pi:

```bash
# From your Windows computer, use SCP:
scp -r "C:\path\to\KrishiSayog_RaspberryPi_IoT" pi@<PI_IP>:/home/pi/

# Or use a USB drive, or clone from GitHub
```

### Step 3: Generate Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Open your **krishisayog** project
3. Click ⚙️ **Project Settings** (gear icon, top-left)
4. Go to **Service Accounts** tab
5. Click **"Generate new private key"**
6. A JSON file will download
7. Rename it to `serviceAccountKey.json`
8. Copy it to `/home/pi/KrishiSayog_RaspberryPi_IoT/`

### Step 4: Run the Setup Script

```bash
cd /home/pi/KrishiSayog_RaspberryPi_IoT
chmod +x setup.sh
sudo ./setup.sh
```

This will:
- ✅ Update system packages
- ✅ Install Python dependencies
- ✅ Enable SPI and I2C interfaces
- ✅ Install the auto-start service
- ✅ Verify Firebase credentials

### Step 5: Reboot

```bash
sudo reboot
```

---

## 🧪 Testing

### Test Individual Sensors

**Test DHT11:**
```bash
python3 -c "
import board
import adafruit_dht
d = adafruit_dht.DHT11(board.D4, use_pulseio=False)
for i in range(5):
    try:
        print(f'Temp: {d.temperature}°C, Humidity: {d.humidity}%')
    except:
        print('Retry...')
    import time; time.sleep(2)
d.exit()
"
```

**Test Soil Moisture:**
```bash
python3 -c "
import RPi.GPIO as GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(17, GPIO.IN)
print('Dry' if GPIO.input(17) else 'Wet')
GPIO.cleanup()
"
```

**Test Ultrasonic:**
```bash
python3 -c "
import RPi.GPIO as GPIO, time
GPIO.setmode(GPIO.BCM)
GPIO.setup(23, GPIO.OUT)
GPIO.setup(24, GPIO.IN)
GPIO.output(23, False)
time.sleep(0.5)
GPIO.output(23, True)
time.sleep(0.00001)
GPIO.output(23, False)
while GPIO.input(24)==0: s=time.time()
while GPIO.input(24)==1: e=time.time()
print(f'Distance: {((e-s)*34300)/2:.1f} cm')
GPIO.cleanup()
"
```

### Run the Full System

```bash
cd /home/pi/KrishiSayog_RaspberryPi_IoT
python3 KrishiSayog_PI.py
```

You should see output like:
```
╔══════════════════════════════════════════════════════════════╗
║           🌾 KrishiSayog IoT Sensor Hub v2.0 🌾            ║
║            Raspberry Pi 4 Model B Edition                   ║
╚══════════════════════════════════════════════════════════════╝

✅ DHT11 sensor initialized on GPIO 4
✅ Soil Moisture sensor (Digital) on GPIO 17
✅ HC-SR04 Ultrasonic on TRIG=GPIO23, ECHO=GPIO24
✅ Water Pump Relay on GPIO 27 (default: OFF)
✅ Firebase Realtime Database connected successfully!

00:01:05 │ #   1 │ 🌡️ 28.0°C  💧 65%  🌱 WET (90%)  🪣 72.5%  ❤️ 100  🚿 OFF
  → Synced to Firebase ✅
```

---

## 🔄 Service Management

```bash
# Start the service
sudo systemctl start krishisayog

# Stop the service
sudo systemctl stop krishisayog

# Check status
sudo systemctl status krishisayog

# View live logs
journalctl -u krishisayog -f

# Restart after config changes
sudo systemctl restart krishisayog

# Disable auto-start
sudo systemctl disable krishisayog
```

---

## 🔧 Configuration

Edit `config.json` to customize settings without touching the Python code:

| Setting | Default | Description |
|---|---|---|
| `device_id` | `"device_001"` | Unique ID for this Pi in Firebase |
| `reading_interval_seconds` | `5` | How often to read sensors (seconds) |
| `auto_irrigation.enabled` | `true` | Enable smart auto-watering |
| `auto_irrigation.dry_threshold_percent` | `30` | Pump ON below this moisture % |
| `auto_irrigation.wet_threshold_percent` | `70` | Pump OFF above this moisture % |
| `water_tank.tank_height_cm` | `50` | Your water tank height in cm |
| `water_tank.sensor_offset_cm` | `2` | Distance from sensor to full water line |

After editing `config.json`, restart the service:
```bash
sudo systemctl restart krishisayog
```

---

## 🚀 Future Upgrades

When you're ready to add more sensors, here's what to buy and how to connect them:

### 1. MCP3008 ADC — True Analog Soil Moisture (0-100%)
- **What**: 8-channel 10-bit ADC chip
- **Why**: Replaces binary wet/dry with precise 0-100% moisture readings
- **Cost**: ~₹150
- **Connection**: SPI (already enabled by setup.sh)

### 2. NPK Soil Sensor (RS485 Modbus)
- **What**: Measures Nitrogen, Phosphorus, Potassium in mg/kg
- **Why**: Essential for soil fertility analysis and crop recommendations
- **Cost**: ~₹800-1500
- **Extra needed**: RS485-to-TTL converter module (~₹100)

### 3. Soil pH Sensor
- **What**: Analog pH probe with amplifier module
- **Why**: pH affects nutrient availability — critical for crop selection
- **Cost**: ~₹300-500
- **Requires**: MCP3008 ADC (for analog reading)

### 4. BH1750 Light Sensor (I2C)
- **What**: Digital ambient light intensity sensor (lux)
- **Why**: Helps determine optimal crop types for your location
- **Cost**: ~₹100
- **Connection**: I2C (already enabled by setup.sh)

---

## ❓ Troubleshooting

| Problem | Solution |
|---|---|
| `ModuleNotFoundError: adafruit_dht` | Run `pip3 install adafruit-circuitpython-dht adafruit-blinka` |
| DHT11 keeps showing "Retry" | This is normal! DHT11 fails ~10-20% of reads. The code handles it. |
| Ultrasonic shows `None` | Check wiring. Ensure voltage divider on ECHO pin. |
| Firebase connection fails | Check internet. Verify `serviceAccountKey.json` exists and is valid. |
| Permission denied on GPIO | Run with `sudo` or add user to `gpio` group: `sudo usermod -aG gpio pi` |
| Service won't start | Check logs: `journalctl -u krishisayog -n 50` |
| Pump stays ON/OFF | Check relay wiring. Test with: `python3 -c "import RPi.GPIO as G; G.setmode(G.BCM); G.setup(27,G.OUT); G.output(27,G.HIGH); input('Pump ON, press Enter to stop'); G.cleanup()"` |
