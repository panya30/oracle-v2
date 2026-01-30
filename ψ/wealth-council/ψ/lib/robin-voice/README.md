# Robin Voice - Thai TTS with Voice Cloning

XTTS v2 wrapper for Robin's voice - supports Thai, English, and 15+ languages.

## Quick Start

### 1. Install

```bash
cd ψ/lib/robin-voice
pip install -r requirements.txt
```

### 2. Add Reference Voice

Add a 6-30 second WAV file:
```
voices/robin_reference.wav
```

**Tips for good reference audio:**
- Clear speech, minimal background noise
- Natural conversation tone
- 16-bit WAV, mono preferred
- 10 seconds is ideal

### 3. Test

```bash
# CLI
python robin_voice.py "สวัสดีค่ะ ฉันชื่อ Robin" --play

# Interactive mode
python robin_voice.py
```

## Python Usage

```python
from robin_voice import RobinVoice

# Initialize
robin = RobinVoice()

# Basic Thai
robin.speak("สวัสดีค่ะ วันนี้เป็นยังไงบ้าง")
robin.play()

# English
robin.speak("Hello! How are you today?", language="en")
robin.play()

# With emotion
robin.speak_with_emotion("ดีใจมากเลย!", emotion="happy")

# Custom output path
robin.speak("ทดสอบ", output_path="custom.wav")

# Change voice
robin.set_voice("voices/another_voice.wav")
```

## CLI Options

```
python robin_voice.py [TEXT] [OPTIONS]

Arguments:
  TEXT                  Text to speak

Options:
  -v, --voice PATH      Reference voice file
  -o, --output PATH     Output file path
  -l, --language CODE   Language (th, en, zh, ja, etc.)
  --play                Play after generation
  --list-voices         List available voices
```

## Supported Languages

Thai, English, Chinese, Japanese, Korean, French, German, Spanish, Italian, Portuguese, Polish, Turkish, Russian, Dutch, Czech, Arabic, Hungarian

## Hardware Requirements

| Device | Speed | VRAM |
|--------|-------|------|
| CUDA GPU | Fast | 4GB+ |
| Apple Silicon | Medium | 8GB RAM |
| CPU | Slow | 8GB RAM |

## File Structure

```
robin-voice/
├── robin_voice.py     # Main module
├── requirements.txt   # Dependencies
├── README.md          # This file
├── voices/            # Reference audio files
│   └── robin_reference.wav
└── output/            # Generated audio
```

## Troubleshooting

**Model download slow?**
```bash
# Use mirror
export HF_ENDPOINT="https://hf-mirror.com"
```

**Out of memory?**
```python
robin = RobinVoice(device="cpu")  # Use CPU instead
```

**No audio playback?**
- macOS: Uses `afplay` (built-in)
- Linux: Install `aplay` or `sox`
- Windows: Uses `winsound`

## Integration with Robin Oracle

Add to `/speak` skill:
```bash
python ψ/lib/robin-voice/robin_voice.py "$TEXT" --play
```

---

**Model**: XTTS v2 by Coqui
**License**: MPL 2.0
