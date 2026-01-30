# Fine-tune XTTS v2 for Thai

## Overview

Fine-tune Coqui XTTS v2 to support Thai language with voice cloning.

## Requirements

- GPU with 24GB+ VRAM (A100, RTX 4090, etc.)
- ~50+ hours Thai speech data
- Python 3.11

## Dataset Options

### 1. Common Voice Thai (Recommended)
```bash
# Download from Mozilla
# https://commonvoice.mozilla.org/th/datasets
# ~50 hours of validated Thai speech
```

### 2. VISTEC Thai Speech
```bash
# https://github.com/vistec-AI/dataset-releases
# 41 hours with emotion labels
```

### 3. Record Your Own
- Need 5-10 hours minimum
- Clear audio, consistent speaker
- Transcribed text

## Data Format

```
dataset/
├── wavs/
│   ├── audio001.wav  # 22050 Hz, mono
│   ├── audio002.wav
│   └── ...
├── metadata.csv      # filename|text
└── speaker.json      # speaker info
```

### metadata.csv format:
```csv
audio001|สวัสดีครับ
audio002|ยินดีที่ได้รู้จัก
audio003|วันนี้อากาศดีมาก
```

## Fine-tuning Steps

### Step 1: Prepare Environment
```bash
cd ψ/lib/robin-voice
source .venv/bin/activate
pip install TTS[all]
```

### Step 2: Download Base Model
```bash
tts --model_name tts_models/multilingual/multi-dataset/xtts_v2 --list_language_idx
```

### Step 3: Prepare Dataset
```python
# scripts/prepare_thai_dataset.py
import os
import csv
from pathlib import Path

def prepare_dataset(audio_dir, output_dir):
    """Convert Thai speech corpus to XTTS format"""
    wavs_dir = Path(output_dir) / "wavs"
    wavs_dir.mkdir(parents=True, exist_ok=True)

    metadata = []
    for audio_file in Path(audio_dir).glob("*.wav"):
        # Copy/resample audio to 22050 Hz mono
        # Get corresponding transcript
        # Add to metadata
        pass

    # Write metadata.csv
    with open(Path(output_dir) / "metadata.csv", "w") as f:
        writer = csv.writer(f, delimiter="|")
        for row in metadata:
            writer.writerow(row)
```

### Step 4: Fine-tune
```bash
# Clone Coqui TTS repo for training scripts
git clone https://github.com/coqui-ai/TTS.git
cd TTS

# Run fine-tuning
python TTS/bin/train_tts.py \
    --config_path recipes/ljspeech/xtts_v2/config.json \
    --restore_path /path/to/xtts_v2_checkpoint.pth \
    --output_path output/thai_xtts \
    --train_csv /path/to/dataset/metadata.csv \
    --eval_csv /path/to/dataset/metadata_val.csv
```

### Step 5: Test
```python
from TTS.api import TTS

tts = TTS(model_path="output/thai_xtts/best_model.pth",
          config_path="output/thai_xtts/config.json")

tts.tts_to_file(
    text="สวัสดีค่ะ ฉันชื่อ Robin",
    speaker_wav="voices/robin_reference.wav",
    language="th",
    file_path="output/thai_test.wav"
)
```

## Training Config

Key settings in `config.json`:

```json
{
    "languages": ["en", "th"],  // Add Thai
    "datasets": [
        {
            "name": "thai_corpus",
            "path": "/path/to/dataset",
            "language": "th"
        }
    ],
    "training": {
        "batch_size": 8,
        "epochs": 100,
        "lr": 1e-5
    }
}
```

## Estimated Resources

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| VRAM | 16GB | 24GB+ |
| Dataset | 10 hours | 50+ hours |
| Training Time | 24 hours | 3-7 days |
| Storage | 50GB | 100GB |

## Cloud Training Options

### Google Colab Pro+
- A100 GPU available
- ~$50/month

### RunPod
- A100 80GB: ~$2/hour
- RTX 4090: ~$0.70/hour

### Vast.ai
- Cheapest GPU rental
- RTX 4090: ~$0.40/hour

## Alternative: Community Models

Check for pre-trained Thai XTTS:
- HuggingFace: search "xtts thai"
- GitHub: search "thai tts xtts"

## References

- [Coqui TTS Training Guide](https://tts.readthedocs.io/en/latest/training_a_model.html)
- [XTTS Fine-tuning](https://github.com/coqui-ai/TTS/discussions)
- [Common Voice Thai](https://commonvoice.mozilla.org/th)
- [VISTEC Dataset](https://github.com/vistec-AI/dataset-releases)
