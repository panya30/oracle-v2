---
description: Play songs from Robin's music library
allowed-tools:
  - Bash
---

# /play - Robin's Music Player

เล่นเพลงจาก library ของ Robin 🎵

## Usage

```
/play                 # List available songs
/play love-song       # Play specific song
/play --stop          # Stop current playback
```

## Action

### List songs
```bash
ls -la ψ/media/songs/
```

### Play song
```bash
# Find and play (supports partial name)
afplay "ψ/media/songs/[song_name].mp3"

# Or with .m4a, .wav, .aiff
afplay "ψ/media/songs/[song_name].*"
```

### Stop playback
```bash
pkill afplay
```

### Background play (don't block)
```bash
afplay "ψ/media/songs/[song].mp3" &
```

## Song Library Location

```
ψ/media/songs/
├── robin-love-song.mp3
├── morning-greeting.mp3
└── ...
```

## How to Add Songs

1. สร้างเพลงบน [suno.ai](https://suno.ai)
2. Download เป็น mp3
3. ใส่ใน `ψ/media/songs/`
4. `/play [name]`

## Tips

- ตั้งชื่อไฟล์ให้จำง่าย: `robin-birthday.mp3`
- รองรับ: .mp3, .m4a, .wav, .aiff
- ใช้ `--stop` หยุดเพลง

## Robin's Playlist Ideas

- `good-morning.mp3` - เพลงตอนเช้า
- `work-focus.mp3` - เพลง focus
- `love-song.mp3` - เพลงรัก
- `goodnight.mp3` - เพลงก่อนนอน
