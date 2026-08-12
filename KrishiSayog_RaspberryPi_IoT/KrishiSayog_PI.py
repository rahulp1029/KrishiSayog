#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════╗
║                    KrishiSayog IoT Sensor Hub                    ║
║              Raspberry Pi 4 Model B — Production Build           ║
║                                                                  ║
║  Sensors: DHT11 · Soil Moisture · HC-SR04 Ultrasonic             ║
║  Display: 16x2 LCD (JHD 162A / HD44780)                          ║
║  Actuators: 5V Relay → Water Pump                                ║
║  Cloud: Firebase Realtime Database (bi-directional sync)         ║
╚══════════════════════════════════════════════════════════════════╝

Author:  Rahul Pokhriyal
Project: KrishiSayog — AI-Powered Smart Agriculture Ecosystem
License: MIT
"""

import time
import json
import signal
import sys
import os
import logging
from logging.handlers import RotatingFileHandler

# ─────────────────────────────────────────────────────────────────
# 1. CONFIGURATION — Load from config.json
# ─────────────────────────────────────────────────────────────────

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def load_config():
    """Load configuration from config.json in the same directory as this script."""
    config_path = os.path.join(SCRIPT_DIR, 'config.json')
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        print(f"❌ ERROR: config.json not found at {config_path}")
        print("   Please create config.json from the template. See README_PI_SETUP.md")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ ERROR: Invalid JSON in config.json: {e}")
        sys.exit(1)

CONFIG = load_config()

# ─────────────────────────────────────────────────────────────────
# 2. LOGGING SETUP — Console + Rotating File
# ─────────────────────────────────────────────────────────────────

log_cfg = CONFIG.get('logging', {})
LOG_FILE = os.path.join(SCRIPT_DIR, log_cfg.get('log_file', 'krishisayog.log'))
LOG_LEVEL = getattr(logging, log_cfg.get('log_level', 'INFO').upper(), logging.INFO)

logger = logging.getLogger('KrishiSayog')
logger.setLevel(LOG_LEVEL)

# Console handler (with emoji-rich formatting)
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(LOG_LEVEL)
console_fmt = logging.Formatter('%(asctime)s │ %(message)s', datefmt='%H:%M:%S')
console_handler.setFormatter(console_fmt)
logger.addHandler(console_handler)

# Rotating file handler (5MB max, 3 backups)
file_handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=log_cfg.get('max_bytes', 5 * 1024 * 1024),
    backupCount=log_cfg.get('backup_count', 3)
)
file_handler.setLevel(LOG_LEVEL)
file_fmt = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
file_handler.setFormatter(file_fmt)
logger.addHandler(file_handler)

# ─────────────────────────────────────────────────────────────────
# 3. HARDWARE IMPORTS — Import GPIO & Sensor Libraries
# ─────────────────────────────────────────────────────────────────

try:
    import RPi.GPIO as GPIO
    import board
    import adafruit_dht
    HARDWARE_AVAILABLE = True
except (ImportError, NotImplementedError) as e:
    logger.warning(f"⚠️  Hardware libraries not available: {e}")
    logger.warning("   Running in SIMULATION MODE (for testing on non-Pi systems)")
    HARDWARE_AVAILABLE = False

# LCD Display (JHD 162A / HD44780) — optional
LCD_AVAILABLE = False
try:
    from RPLCD.gpio import CharLCD
    LCD_AVAILABLE = True
except ImportError:
    logger.info("ℹ️  RPLCD not installed. LCD display disabled. Install with: pip3 install RPLCD")

# ─────────────────────────────────────────────────────────────────
# 4. FIREBASE INITIALIZATION
# ─────────────────────────────────────────────────────────────────

try:
    import firebase_admin
    from firebase_admin import credentials, db
    FIREBASE_AVAILABLE = True
except ImportError:
    logger.error("❌ firebase-admin not installed. Run: pip3 install firebase-admin")
    FIREBASE_AVAILABLE = False

def init_firebase():
    """Initialize Firebase Admin SDK with service account credentials."""
    if not FIREBASE_AVAILABLE:
        return None, None, None, None

    # Look for serviceAccountKey.json in the script directory
    key_path = os.path.join(SCRIPT_DIR, 'serviceAccountKey.json')

    if not os.path.exists(key_path):
        logger.error(f"❌ Firebase service account key not found at: {key_path}")
        logger.error("   Download it from Firebase Console → Project Settings → Service Accounts")
        logger.error("   → Generate new private key → Save as 'serviceAccountKey.json'")
        return None, None, None, None

    try:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred, {
            'databaseURL': CONFIG.get('firebase_db_url', 'https://krishisayog-default-rtdb.firebaseio.com')
        })

        device_id = CONFIG.get('device_id', 'device_001')

        # Firebase database references
        sensors_ref = db.reference(f'/iot_devices/{device_id}/sensors')
        pump_ref = db.reference(f'/iot_devices/{device_id}/pump_control/state')
        farm_data_ref = db.reference('/farmData')
        alerts_ref = db.reference('/alerts')

        logger.info("✅ Firebase Realtime Database connected successfully!")
        return sensors_ref, pump_ref, farm_data_ref, alerts_ref

    except Exception as e:
        logger.error(f"❌ Firebase initialization failed: {e}")
        return None, None, None, None

# ─────────────────────────────────────────────────────────────────
# 5. GPIO & SENSOR SETUP
# ─────────────────────────────────────────────────────────────────

# Extract pin numbers from config
pins = CONFIG.get('gpio_pins', {})
DHT_PIN = pins.get('dht_data', 4)
MOISTURE_DO_PIN = pins.get('moisture_digital', 17)
RELAY_PIN = pins.get('relay_pump', 27)
TRIG_PIN = pins.get('ultrasonic_trig', 23)
ECHO_PIN = pins.get('ultrasonic_echo', 24)

# LCD Display pins (4-bit mode)
LCD_RS = pins.get('lcd_rs', 26)
LCD_EN = pins.get('lcd_en', 19)
LCD_D4 = pins.get('lcd_d4', 13)
LCD_D5 = pins.get('lcd_d5', 6)
LCD_D6 = pins.get('lcd_d6', 5)
LCD_D7 = pins.get('lcd_d7', 11)

# Sensor enable flags
sensor_flags = CONFIG.get('sensor_enable', {})
ENABLE_DHT = sensor_flags.get('dht11', True)
ENABLE_MOISTURE = sensor_flags.get('soil_moisture', True)
ENABLE_ULTRASONIC = sensor_flags.get('ultrasonic_water_level', True)
ENABLE_LCD = sensor_flags.get('lcd_display', True)

# Auto-irrigation config
auto_irr = CONFIG.get('auto_irrigation', {})
AUTO_IRRIGATION_ENABLED = auto_irr.get('enabled', True)
DRY_THRESHOLD = auto_irr.get('dry_threshold_percent', 30)
WET_THRESHOLD = auto_irr.get('wet_threshold_percent', 70)

# Water tank config (for ultrasonic calculation)
tank_cfg = CONFIG.get('water_tank', {})
TANK_HEIGHT_CM = tank_cfg.get('tank_height_cm', 50)
SENSOR_OFFSET_CM = tank_cfg.get('sensor_offset_cm', 2)

# Global sensor/display objects
dht_device = None
lcd_device = None

def setup_hardware():
    """Initialize GPIO pins and sensor objects."""
    global dht_device, lcd_device

    if not HARDWARE_AVAILABLE:
        logger.info("🔧 Skipping hardware setup (simulation mode)")
        return

    # Set GPIO mode to BCM (Broadcom pin numbering)
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)

    # --- DHT11 Sensor ---
    if ENABLE_DHT:
        try:
            # Map GPIO number to board pin object
            # GPIO 4 = board.D4 on Raspberry Pi
            board_pin_map = {
                4: board.D4, 5: board.D5, 6: board.D6,
                12: board.D12, 13: board.D13, 16: board.D16,
                17: board.D17, 18: board.D18, 19: board.D19,
                20: board.D20, 21: board.D21, 22: board.D22,
                23: board.D23, 24: board.D24, 25: board.D25,
                26: board.D26, 27: board.D27
            }
            board_pin = board_pin_map.get(DHT_PIN, board.D4)
            dht_device = adafruit_dht.DHT11(board_pin, use_pulseio=False)
            logger.info(f"✅ DHT11 sensor initialized on GPIO {DHT_PIN}")
        except Exception as e:
            logger.error(f"❌ DHT11 setup failed: {e}")
            dht_device = None

    # --- Soil Moisture Sensor (Digital Output) ---
    if ENABLE_MOISTURE:
        GPIO.setup(MOISTURE_DO_PIN, GPIO.IN)
        logger.info(f"✅ Soil Moisture sensor (Digital) on GPIO {MOISTURE_DO_PIN}")

    # --- HC-SR04 Ultrasonic Distance Sensor ---
    if ENABLE_ULTRASONIC:
        GPIO.setup(TRIG_PIN, GPIO.OUT)
        GPIO.setup(ECHO_PIN, GPIO.IN)
        GPIO.output(TRIG_PIN, GPIO.LOW)
        logger.info(f"✅ HC-SR04 Ultrasonic on TRIG=GPIO{TRIG_PIN}, ECHO=GPIO{ECHO_PIN}")

    # --- Water Pump Relay ---
    GPIO.setup(RELAY_PIN, GPIO.OUT)
    GPIO.output(RELAY_PIN, GPIO.LOW)  # Pump OFF at startup
    logger.info(f"✅ Water Pump Relay on GPIO {RELAY_PIN} (default: OFF)")

    # --- 16x2 LCD Display (JHD 162A / HD44780) ---
    if ENABLE_LCD and LCD_AVAILABLE:
        try:
            lcd_device = CharLCD(
                pin_rs=LCD_RS,
                pin_e=LCD_EN,
                pins_data=[LCD_D4, LCD_D5, LCD_D6, LCD_D7],
                numbering_mode=GPIO.BCM,
                cols=16,
                rows=2,
                dotsize=8,
                auto_linebreaks=True
            )
            lcd_device.clear()
            # Show boot message
            lcd_device.cursor_pos = (0, 0)
            lcd_device.write_string('KrishiSayog v2.0')
            lcd_device.cursor_pos = (1, 0)
            lcd_device.write_string('  Starting...   ')
            logger.info(f"✅ 16x2 LCD Display initialized (RS={LCD_RS}, EN={LCD_EN})")
        except Exception as e:
            logger.error(f"❌ LCD setup failed: {e}")
            lcd_device = None

# ─────────────────────────────────────────────────────────────────
# 6. SENSOR READING FUNCTIONS
# ─────────────────────────────────────────────────────────────────

def read_dht11():
    """
    Read temperature (°C) and humidity (%) from DHT11 sensor.
    Returns (temperature, humidity) or (None, None) on failure.
    DHT11 sensors are notoriously flaky — failures are normal and expected.
    """
    if not ENABLE_DHT or dht_device is None:
        return None, None

    try:
        temperature = dht_device.temperature
        humidity = dht_device.humidity

        if temperature is not None and humidity is not None:
            # DHT11 sanity checks (sensor range: 0-50°C, 20-90% humidity)
            if -10 <= temperature <= 60 and 0 <= humidity <= 100:
                return round(temperature, 1), round(humidity, 1)
            else:
                logger.warning(f"⚠️  DHT11 out-of-range: T={temperature}°C, H={humidity}%")
                return None, None
        return None, None

    except RuntimeError as e:
        # This is NORMAL for DHT sensors — they fail ~10-20% of reads
        logger.debug(f"DHT11 read retry: {e}")
        return None, None
    except Exception as e:
        logger.error(f"❌ DHT11 critical error: {e}")
        return None, None


def read_soil_moisture():
    """
    Read soil moisture from digital output sensor.

    Since the Raspberry Pi has NO built-in ADC (analog-to-digital converter),
    we use the Digital Output (DO) pin from the sensor's comparator board:
      - DO = HIGH (1) → Soil is DRY
      - DO = LOW  (0) → Soil is WET

    We map this to estimated percentages for the dashboard:
      - Dry → 10%  (below threshold, needs watering)
      - Wet → 90%  (above threshold, soil is moist)

    💡 For true 0-100% analog readings, add an MCP3008 ADC chip.
       See README_PI_SETUP.md → "Future Upgrades" section.
    """
    if not ENABLE_MOISTURE or not HARDWARE_AVAILABLE:
        return 50  # Default fallback

    try:
        is_dry = GPIO.input(MOISTURE_DO_PIN)
        # HIGH = dry (sensor pulls high when no water detected)
        # LOW  = wet (sensor pulls low when water is detected)
        moisture_percent = 10 if is_dry else 90
        return moisture_percent
    except Exception as e:
        logger.error(f"❌ Soil moisture read error: {e}")
        return None


def read_ultrasonic_distance():
    """
    Measure distance using HC-SR04 ultrasonic sensor.

    How it works:
    1. Send a 10μs HIGH pulse on TRIG pin
    2. Sensor emits 8 ultrasonic pulses at 40kHz
    3. ECHO pin goes HIGH when pulses are sent
    4. ECHO pin goes LOW when echo is received
    5. Distance = (echo_duration × speed_of_sound) / 2

    Speed of sound ≈ 343 m/s = 34300 cm/s at 20°C

    Returns distance in cm, or None on timeout/failure.
    """
    if not ENABLE_ULTRASONIC or not HARDWARE_AVAILABLE:
        return None

    try:
        # Ensure TRIG is LOW before starting
        GPIO.output(TRIG_PIN, GPIO.LOW)
        time.sleep(0.05)  # 50ms settling time

        # Send 10μs trigger pulse
        GPIO.output(TRIG_PIN, GPIO.HIGH)
        time.sleep(0.00001)  # 10 microseconds
        GPIO.output(TRIG_PIN, GPIO.LOW)

        # Wait for ECHO to go HIGH (pulse sent) — with timeout
        timeout_start = time.time()
        pulse_start = time.time()
        while GPIO.input(ECHO_PIN) == GPIO.LOW:
            pulse_start = time.time()
            if pulse_start - timeout_start > 0.5:  # 500ms timeout
                logger.warning("⚠️  Ultrasonic: ECHO start timeout")
                return None

        # Wait for ECHO to go LOW (echo received) — with timeout
        pulse_end = time.time()
        while GPIO.input(ECHO_PIN) == GPIO.HIGH:
            pulse_end = time.time()
            if pulse_end - pulse_start > 0.5:  # 500ms timeout
                logger.warning("⚠️  Ultrasonic: ECHO end timeout")
                return None

        # Calculate distance
        pulse_duration = pulse_end - pulse_start
        distance_cm = (pulse_duration * 34300) / 2  # Speed of sound / 2 (round trip)

        # HC-SR04 effective range: 2cm to 400cm
        if 2 <= distance_cm <= 400:
            return round(distance_cm, 1)
        else:
            logger.debug(f"Ultrasonic out-of-range: {distance_cm:.1f}cm")
            return None

    except Exception as e:
        logger.error(f"❌ Ultrasonic read error: {e}")
        return None


def calculate_water_level(distance_cm):
    """
    Convert ultrasonic distance to water level percentage.

    The sensor is mounted at the TOP of the water tank, pointing DOWN at the water.
    ┌─────────────┐
    │  [SENSOR] ← sensor_offset_cm from top
    │             │
    │  ↕ distance │ ← measured by ultrasonic
    │             │
    │ ~~~~~~~~~~~~│ ← water surface
    │ ████████████│
    │ ████████████│ ← water
    └─────────────┘
      tank_height_cm

    water_depth = tank_height - sensor_offset - distance
    water_level% = (water_depth / usable_height) × 100
    """
    if distance_cm is None:
        return None

    usable_height = TANK_HEIGHT_CM - SENSOR_OFFSET_CM
    if usable_height <= 0:
        return None

    water_depth = TANK_HEIGHT_CM - SENSOR_OFFSET_CM - distance_cm
    water_level = (water_depth / usable_height) * 100

    # Clamp to 0-100%
    water_level = max(0, min(100, water_level))
    return round(water_level, 1)


def calculate_farm_health(moisture, temperature, humidity, water_level):
    """
    Calculate an overall farm health score (0-100).
    This mirrors the scoring logic in server.js for consistency.

    Scoring rules:
      - Start at 100 (perfect health)
      - Moisture too low (<30%) or too high (>80%): -20 points
      - Temperature too hot (>35°C) or too cold (<10°C): -20 points
      - Humidity too low (<20%) or too high (>90%): -10 points
      - Water level critically low (<20%): -15 points
    """
    score = 100

    if moisture is not None:
        if moisture < 30 or moisture > 80:
            score -= 20

    if temperature is not None:
        if temperature > 35 or temperature < 10:
            score -= 20

    if humidity is not None:
        if humidity < 20 or humidity > 90:
            score -= 10

    if water_level is not None:
        if water_level < 20:
            score -= 15

    return max(0, score)

# ─────────────────────────────────────────────────────────────────
# 7. SMART AUTO-IRRIGATION
# ─────────────────────────────────────────────────────────────────

def handle_irrigation(moisture, auto_mode_firebase, pump_ref):
    """
    Smart irrigation control logic.

    Two modes:
    1. AUTO MODE (autoMode = true in Firebase):
       - If moisture < dry_threshold → Turn pump ON automatically
       - If moisture > wet_threshold → Turn pump OFF automatically
       - This runs the pump only when needed, saving water

    2. MANUAL MODE (autoMode = false in Firebase):
       - Only respond to pump_control/state from Firebase
       - User controls the pump from the web dashboard or mobile app

    Returns the current pump state (True=ON, False=OFF).
    """
    if not HARDWARE_AVAILABLE:
        return False

    pump_on = False

    if auto_mode_firebase and AUTO_IRRIGATION_ENABLED:
        # AUTO MODE — let the soil moisture decide
        if moisture is not None:
            if moisture < DRY_THRESHOLD:
                GPIO.output(RELAY_PIN, GPIO.HIGH)
                pump_on = True
                logger.info(f"🚿 AUTO-IRRIGATION: Pump ON (moisture {moisture}% < {DRY_THRESHOLD}% threshold)")
            elif moisture > WET_THRESHOLD:
                GPIO.output(RELAY_PIN, GPIO.LOW)
                pump_on = False
                logger.info(f"💧 AUTO-IRRIGATION: Pump OFF (moisture {moisture}% > {WET_THRESHOLD}% threshold)")
            else:
                # In the middle zone — maintain current state
                pump_on = GPIO.input(RELAY_PIN) == GPIO.HIGH
    else:
        # MANUAL MODE — read pump command from Firebase
        if pump_ref is not None:
            try:
                pump_state = pump_ref.get()
                if pump_state is True:
                    GPIO.output(RELAY_PIN, GPIO.HIGH)
                    pump_on = True
                else:
                    GPIO.output(RELAY_PIN, GPIO.LOW)
                    pump_on = False
            except Exception as e:
                logger.error(f"❌ Failed to read pump state from Firebase: {e}")
                pump_on = False

    return pump_on

# ─────────────────────────────────────────────────────────────────
# 8. FIREBASE DATA PUSH
# ─────────────────────────────────────────────────────────────────

def push_to_firebase(sensors_ref, farm_data_ref, alerts_ref, data):
    """
    Push sensor telemetry to Firebase Realtime Database.

    We write to TWO paths for compatibility:
    1. /iot_devices/{device_id}/sensors — device-specific telemetry
    2. /farmData — dashboard-compatible summary (what the web UI reads)

    Also generates dynamic alerts for the dashboard.
    """
    if sensors_ref is None or farm_data_ref is None:
        logger.warning("⚠️  Firebase not connected — skipping data push")
        return

    timestamp_ms = int(time.time() * 1000)  # Milliseconds (matching JavaScript)

    try:
        # Path 1: Device-specific telemetry
        sensors_ref.set({
            'temperature': data['temperature'],
            'humidity': data['humidity'],
            'moisture': data['moisture'],
            'waterLevel': data['water_level'],
            'farmHealth': data['farm_health'],
            'last_updated': timestamp_ms
        })

        # Path 2: Dashboard-compatible /farmData
        farm_data_ref.set({
            'soilMoisture': data['moisture'],
            'temperature': data['temperature'],
            'humidity': data['humidity'],
            'waterLevel': data['water_level'] if data['water_level'] is not None else 100,
            'motorOn': data['pump_on'],
            'autoMode': data.get('auto_mode', True),
            'farmHealth': data['farm_health']
        })

        # Dynamic alerts (same logic as server.js)
        alert_updates = {}

        if data['moisture'] is not None and data['moisture'] < 35:
            alert_updates['low_moisture'] = {
                'title': 'Critical Moisture Level',
                'severity': 'high',
                'message': f"Moisture dropped to {data['moisture']}%. Irrigation required immediately.",
                'time': time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime())
            }
        else:
            alert_updates['low_moisture'] = None

        if data['temperature'] is not None and data['temperature'] > 35:
            alert_updates['high_temp'] = {
                'title': 'High Temperature Detected',
                'severity': 'medium',
                'message': f"Temperature reached {data['temperature']}°C. Ensure proper ventilation.",
                'time': time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime())
            }
        else:
            alert_updates['high_temp'] = None

        if data['water_level'] is not None and data['water_level'] < 15:
            alert_updates['low_water'] = {
                'title': 'Low Water Tank Level',
                'severity': 'high',
                'message': f"Water tank at {data['water_level']:.0f}%. Refill needed soon.",
                'time': time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime())
            }
        else:
            alert_updates['low_water'] = None

        if alerts_ref is not None:
            alerts_ref.update(alert_updates)

        logger.info("  → Synced to Firebase ✅")

    except Exception as e:
        logger.error(f"❌ Firebase push error: {e}")

# ─────────────────────────────────────────────────────────────────
# 9. LCD DISPLAY FUNCTIONS
# ─────────────────────────────────────────────────────────────────

def update_lcd(screen_number, data):
    """
    Update the 16x2 LCD display with sensor data.

    The display cycles through 3 screens every reading:
      Screen 0: Temperature & Humidity
        ┌────────────────┐
        │T:28.5C  H:65.2%│
        │Soil:WET  Pump:ON│
        └────────────────┘
      Screen 1: Water Level & Farm Health
        ┌────────────────┐
        │Water:  72.5%   │
        │Health: 85/100  │
        └────────────────┘
      Screen 2: Status & Time
        ┌────────────────┐
        │KrishiSayog v2.0│
        │Read #0042  AUTO│
        └────────────────┘
    """
    if lcd_device is None:
        return

    try:
        lcd_device.clear()

        if screen_number == 0:
            # Screen 0: Temperature, Humidity, Soil, Pump
            temp_str = f"{data['temperature']:.1f}" if data['temperature'] is not None else "--"
            hum_str = f"{data['humidity']:.0f}" if data['humidity'] is not None else "--"
            soil_str = "DRY" if data['moisture'] is not None and data['moisture'] < 50 else "WET"
            pump_str = "ON" if data['pump_on'] else "OFF"

            lcd_device.cursor_pos = (0, 0)
            lcd_device.write_string(f"T:{temp_str}C H:{hum_str}%"[:16])
            lcd_device.cursor_pos = (1, 0)
            lcd_device.write_string(f"Soil:{soil_str} Pump:{pump_str}"[:16])

        elif screen_number == 1:
            # Screen 1: Water Level & Farm Health
            water_str = f"{data['water_level']:.0f}%" if data['water_level'] is not None else "N/A"
            health_str = f"{data['farm_health']}/100"

            lcd_device.cursor_pos = (0, 0)
            lcd_device.write_string(f"Water:  {water_str}"[:16])
            lcd_device.cursor_pos = (1, 0)
            lcd_device.write_string(f"Health: {health_str}"[:16])

        elif screen_number == 2:
            # Screen 2: System status
            mode_str = "AUTO" if data.get('auto_mode', True) else "MANUAL"
            count_str = f"#{data.get('read_count', 0):04d}"

            lcd_device.cursor_pos = (0, 0)
            lcd_device.write_string('KrishiSayog v2.0')
            lcd_device.cursor_pos = (1, 0)
            lcd_device.write_string(f"Read {count_str} {mode_str}"[:16])

    except Exception as e:
        logger.debug(f"LCD update error: {e}")

# ─────────────────────────────────────────────────────────────────
# 10. SIGNAL HANDLING — Graceful Shutdown
# ─────────────────────────────────────────────────────────────────

running = True

def signal_handler(sig, frame):
    """Handle SIGTERM and SIGINT for clean shutdown."""
    global running
    sig_name = signal.Signals(sig).name
    logger.info(f"\n🛑 Received {sig_name} — shutting down gracefully...")
    running = False

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

# ─────────────────────────────────────────────────────────────────
# 11. MAIN LOOP — The Heart of KrishiSayog IoT
# ─────────────────────────────────────────────────────────────────

def main():
    global running

    print()
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║           🌾 KrishiSayog IoT Sensor Hub v2.0 🌾            ║")
    print("║            Raspberry Pi 4 Model B Edition                   ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()

    # Initialize hardware
    setup_hardware()
    print()

    # Initialize Firebase
    sensors_ref, pump_ref, farm_data_ref, alerts_ref = init_firebase()
    print()

    # Reading interval from config
    interval = CONFIG.get('reading_interval_seconds', 5)
    logger.info(f"📡 Sensor reading interval: {interval} seconds")
    logger.info(f"🚿 Auto-irrigation: {'ENABLED' if AUTO_IRRIGATION_ENABLED else 'DISABLED'}")
    logger.info(f"   Thresholds: DRY < {DRY_THRESHOLD}% | WET > {WET_THRESHOLD}%")
    print()
    logger.info("━" * 60)
    logger.info("Starting sensor readings... (Press Ctrl+C to stop)")
    logger.info("━" * 60)
    print()

    # Track last successful readings for fallback
    last_temp = None
    last_humidity = None
    last_moisture = 50
    last_water_level = None
    read_count = 0

    while running:
        try:
            read_count += 1

            # ── Read DHT11 (Temperature + Humidity) ──────────────
            temperature, humidity = read_dht11()
            if temperature is not None:
                last_temp = temperature
                last_humidity = humidity
            else:
                # Use last known good reading (DHT11 failures are common)
                temperature = last_temp
                humidity = last_humidity

            # ── Read Soil Moisture (Digital) ─────────────────────
            moisture = read_soil_moisture()
            if moisture is not None:
                last_moisture = moisture

            # ── Read Ultrasonic Distance → Water Level ───────────
            distance = read_ultrasonic_distance()
            water_level = calculate_water_level(distance)
            if water_level is not None:
                last_water_level = water_level
            else:
                water_level = last_water_level

            # ── Calculate Farm Health Score ───────────────────────
            farm_health = calculate_farm_health(moisture, temperature, humidity, water_level)

            # ── Get auto mode from Firebase ──────────────────────
            auto_mode = True  # Default
            if farm_data_ref is not None:
                try:
                    farm_snapshot = farm_data_ref.child('autoMode').get()
                    if farm_snapshot is not None:
                        auto_mode = bool(farm_snapshot)
                except Exception:
                    pass

            # ── Handle Irrigation Logic ──────────────────────────
            pump_on = handle_irrigation(moisture, auto_mode, pump_ref)

            # ── Print Status to Console ──────────────────────────
            status_line = f"#{read_count:>4d} │ "
            status_line += f"🌡️ {temperature if temperature else '--'}°C  "
            status_line += f"💧 {humidity if humidity else '--'}%  "
            status_line += f"🌱 {'DRY' if moisture and moisture < 50 else 'WET'} ({moisture if moisture else '--'}%)  "
            status_line += f"🪣 {water_level if water_level is not None else '--'}%  "
            status_line += f"❤️ {farm_health}  "
            status_line += f"🚿 {'ON' if pump_on else 'OFF'}"
            logger.info(status_line)

            # ── Update LCD Display (rotating screens) ────────────
            lcd_data = {
                'temperature': temperature,
                'humidity': humidity,
                'moisture': moisture,
                'water_level': water_level,
                'farm_health': farm_health,
                'pump_on': pump_on,
                'auto_mode': auto_mode,
                'read_count': read_count
            }
            lcd_screen = read_count % 3  # Cycle through 3 screens
            update_lcd(lcd_screen, lcd_data)

            # ── Push to Firebase ─────────────────────────────────
            push_to_firebase(sensors_ref, farm_data_ref, alerts_ref, {
                'temperature': temperature,
                'humidity': humidity,
                'moisture': moisture if moisture is not None else last_moisture,
                'water_level': water_level,
                'farm_health': farm_health,
                'pump_on': pump_on,
                'auto_mode': auto_mode
            })

        except RuntimeError as e:
            # DHT sensor errors are expected — just retry next loop
            logger.debug(f"Sensor retry: {e}")
            time.sleep(2)
            continue

        except Exception as e:
            logger.error(f"❌ Critical error in main loop: {e}")
            logger.error("   Attempting to continue...")
            time.sleep(5)
            continue

        # Wait before next reading
        time.sleep(interval)

    # ── Cleanup on exit ──────────────────────────────────────────
    logger.info("")
    logger.info("🔌 Shutting down KrishiSayog IoT...")

    if HARDWARE_AVAILABLE:
        # Turn off pump before exit
        try:
            GPIO.output(RELAY_PIN, GPIO.LOW)
            logger.info("  → Pump turned OFF")
        except Exception:
            pass

        # Show shutdown message on LCD
        if lcd_device is not None:
            try:
                lcd_device.clear()
                lcd_device.cursor_pos = (0, 0)
                lcd_device.write_string('KrishiSayog')
                lcd_device.cursor_pos = (1, 0)
                lcd_device.write_string('  Stopped.      ')
                logger.info("  → LCD: Shutdown message displayed")
            except Exception:
                pass

        # Release DHT device
        if dht_device is not None:
            try:
                dht_device.exit()
                logger.info("  → DHT11 sensor released")
            except Exception:
                pass

        # Cleanup all GPIO (this also clears LCD pins)
        try:
            GPIO.cleanup()
            logger.info("  → GPIO cleaned up")
        except Exception:
            pass

    logger.info("👋 KrishiSayog IoT stopped. Goodbye!")
    print()


if __name__ == '__main__':
    main()
