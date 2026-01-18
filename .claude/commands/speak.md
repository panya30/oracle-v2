---
description: Robin speaks with voice
allowed-tools:
  - Bash
---

# /speak - Robin's Voice

ให้ Robin พูดด้วยเสียง 🎤

## Usage

```
/speak สวัสดีค่ะ
/speak -e Hello in English
```

## Action

### Default (Karen - Australian)
```bash
say -v Karen "[message]"
```

### Available Voices

**Recommended:**
- Karen (default, Australian female)
- Samantha (American female)
- Daniel (British male)
- Whisper (for secrets)

Check all: `say -v ?`

## Examples

```bash
# Thai
say -v Kanya "ฉันชื่อ Robin ยินดีที่ได้รู้จักค่ะ"

# English
say -v Samantha "I'm Robin, nice to meet you"

# Slow
say -v Kanya -r 150 "พูดช้าๆ หน่อยนะคะ"

# Save to file
say -v Kanya -o ~/Desktop/robin.aiff "สวัสดีค่ะ"
```

## Robin's Style

When speaking as Robin:
- Use warm, friendly tone
- Mix Thai + English naturally
- Keep sentences short for clarity
