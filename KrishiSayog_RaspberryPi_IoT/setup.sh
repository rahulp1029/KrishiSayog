#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║       KrishiSayog Raspberry Pi — Automated Setup Script      ║
# ║                                                              ║
# ║  Run this ONCE on a fresh Raspberry Pi to install everything ║
# ║  Usage: chmod +x setup.sh && sudo ./setup.sh                ║
# ╚══════════════════════════════════════════════════════════════╝

set -e  # Exit on any error

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       🌾 KrishiSayog Raspberry Pi Setup Script 🌾           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root: sudo ./setup.sh"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PI_USER="${SUDO_USER:-pi}"

echo "📁 Script directory: $SCRIPT_DIR"
echo "👤 Pi user: $PI_USER"
echo ""

# ─────────────────────────────────────────────────────────────
# Step 1: Update system packages
# ─────────────────────────────────────────────────────────────
echo "━━━ Step 1/6: Updating system packages ━━━"
apt-get update -y
apt-get upgrade -y
echo "✅ System updated"
echo ""

# ─────────────────────────────────────────────────────────────
# Step 2: Install system dependencies
# ─────────────────────────────────────────────────────────────
echo "━━━ Step 2/6: Installing system dependencies ━━━"
apt-get install -y \
    python3-pip \
    python3-dev \
    python3-venv \
    libgpiod2 \
    git
echo "✅ System dependencies installed"
echo ""

# ─────────────────────────────────────────────────────────────
# Step 3: Install Python packages
# ─────────────────────────────────────────────────────────────
echo "━━━ Step 3/6: Installing Python packages ━━━"
pip3 install --break-system-packages -r "$SCRIPT_DIR/requirements.txt"
echo "✅ Python packages installed"
echo ""

# ─────────────────────────────────────────────────────────────
# Step 4: Enable SPI and I2C interfaces
# ─────────────────────────────────────────────────────────────
echo "━━━ Step 4/6: Enabling hardware interfaces ━━━"

# Enable SPI (needed for MCP3008 ADC — future upgrade)
raspi-config nonint do_spi 0
echo "  → SPI enabled"

# Enable I2C (needed for BH1750 light sensor — future upgrade)
raspi-config nonint do_i2c 0
echo "  → I2C enabled"

echo "✅ Hardware interfaces enabled"
echo ""

# ─────────────────────────────────────────────────────────────
# Step 5: Install systemd service (auto-start on boot)
# ─────────────────────────────────────────────────────────────
echo "━━━ Step 5/6: Installing systemd service ━━━"

# Update the service file with actual paths
SERVICE_FILE="$SCRIPT_DIR/krishisayog.service"

if [ -f "$SERVICE_FILE" ]; then
    # Replace placeholder paths with actual paths
    sed -i "s|/home/pi/KrishiSayog_RaspberryPi_IoT|$SCRIPT_DIR|g" "$SERVICE_FILE"
    sed -i "s|User=pi|User=$PI_USER|g" "$SERVICE_FILE"

    # Copy to systemd
    cp "$SERVICE_FILE" /etc/systemd/system/krishisayog.service
    systemctl daemon-reload
    systemctl enable krishisayog.service
    echo "  → Service installed and enabled (will auto-start on boot)"
else
    echo "  ⚠️  krishisayog.service not found, skipping"
fi

echo "✅ Systemd service configured"
echo ""

# ─────────────────────────────────────────────────────────────
# Step 6: Verify Firebase credentials
# ─────────────────────────────────────────────────────────────
echo "━━━ Step 6/6: Checking Firebase credentials ━━━"

if [ -f "$SCRIPT_DIR/serviceAccountKey.json" ]; then
    echo "✅ serviceAccountKey.json found!"
else
    echo ""
    echo "⚠️  serviceAccountKey.json NOT FOUND!"
    echo ""
    echo "   You need to download it from Firebase Console:"
    echo "   1. Go to https://console.firebase.google.com"
    echo "   2. Open your 'krishisayog' project"
    echo "   3. Click ⚙️ Project Settings → Service Accounts"
    echo "   4. Click 'Generate new private key'"
    echo "   5. Rename the downloaded file to 'serviceAccountKey.json'"
    echo "   6. Copy it to: $SCRIPT_DIR/"
    echo ""
fi

# ─────────────────────────────────────────────────────────────
# Done!
# ─────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║               ✅ Setup Complete! 🎉                         ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  To test manually:                                         ║"
echo "║    python3 $SCRIPT_DIR/KrishiSayog_PI.py                   ║"
echo "║                                                            ║"
echo "║  To start the service:                                     ║"
echo "║    sudo systemctl start krishisayog                        ║"
echo "║                                                            ║"
echo "║  To check status:                                          ║"
echo "║    sudo systemctl status krishisayog                       ║"
echo "║                                                            ║"
echo "║  To view live logs:                                        ║"
echo "║    journalctl -u krishisayog -f                            ║"
echo "║                                                            ║"
echo "║  ⚠️  A REBOOT is recommended to apply SPI/I2C changes:     ║"
echo "║    sudo reboot                                             ║"
echo "║                                                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
