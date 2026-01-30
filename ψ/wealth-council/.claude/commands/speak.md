# /speak - Robin Voice

Robin พูดด้วยเสียงจริง (Thai + English supported)

## Usage

```
/speak สวัสดีค่ะ             # Thai
/speak Hello world          # English
/speak --play ทดสอบเสียง    # Speak and play
```

## Action

1. Run Robin Voice module:

```bash
cd ψ/lib/robin-voice
python robin_voice.py "$ARGUMENTS" --play
```

2. If module not ready, show setup instructions:

```markdown
## Setup Robin Voice

### Step 1: Install dependencies
\`\`\`bash
cd ψ/lib/robin-voice
pip install -r requirements.txt
\`\`\`

### Step 2: Add reference voice
Add a 6+ second WAV file to:
\`ψ/lib/robin-voice/voices/robin_reference.wav\`

### Step 3: Test
\`\`\`bash
python robin_voice.py "สวัสดีค่ะ ฉันชื่อ Robin" --play
\`\`\`
```

## Python Integration

```python
from robin_voice import RobinVoice

robin = RobinVoice()

# Basic Thai
robin.speak("สวัสดีค่ะ วันนี้เป็นยังไงบ้าง")
robin.play()

# With emotion hint
robin.speak_with_emotion("ดีใจจังเลย!", emotion="happy")

# Different voice
robin.set_voice("voices/alternative.wav")
```

## Voice Requirements

- Format: WAV (16-bit, mono preferred)
- Length: 6-30 seconds (10s ideal)
- Quality: Clear speech, minimal background noise
- Content: Natural conversation in target language

## Supported Languages

| Code | Language |
|------|----------|
| th | Thai |
| en | English |
| zh-cn | Chinese |
| ja | Japanese |
| ko | Korean |
| fr | French |
| de | German |
| es | Spanish |
| it | Italian |
| pt | Portuguese |
| pl | Polish |
| tr | Turkish |
| ru | Russian |
| nl | Dutch |
| cs | Czech |
| ar | Arabic |
| hu | Hungarian |

## Notes

- First run downloads ~2GB model (cached after)
- GPU recommended for faster generation
- MPS (Apple Silicon) supported
