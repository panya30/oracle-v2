#!/bin/bash
# Robin Voice Setup Script
# Thai TTS with Voice Cloning using XTTS v2

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🎙️ Robin Voice Setup"
echo "===================="

# Check for uv
if ! command -v uv &> /dev/null; then
    echo "❌ uv not found. Installing..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
fi

# Create venv with Python 3.11 (required for TTS)
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment with Python 3.11..."
    uv venv --python 3.11 .venv
fi

# Activate and install
echo "📦 Installing dependencies..."
source .venv/bin/activate
pip install --upgrade pip
pip install TTS

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Add a reference voice (6+ seconds WAV file):"
echo "      cp your_voice.wav voices/robin_reference.wav"
echo ""
echo "   2. Test Robin Voice:"
echo "      source .venv/bin/activate"
echo "      python robin_voice.py \"สวัสดีค่ะ\" --play"
echo ""
echo "   3. Or use interactive mode:"
echo "      python robin_voice.py"
