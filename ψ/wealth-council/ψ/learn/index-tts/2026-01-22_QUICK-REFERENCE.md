# Index-TTS Quick Reference

**Date**: 2026-01-22
**Repository**: https://github.com/JarodMica/index-tts

---

## What is Index-TTS?

Index-TTS2 is a state-of-the-art zero-shot text-to-speech system with precise duration control and emotionally expressive speech generation. It supports multiple languages and achieves high-quality voice cloning with independent control over speaker timbre and emotional tone.

---

## Key Features

- **Zero-Shot Voice Cloning** - Clone any speaker with a single reference audio
- **Emotional Expression Control** - 8 distinct emotions with independent control
- **Precision Duration Control** - Explicit or free autoregressive modes
- **Multilingual Support** - English, Chinese, Japanese out-of-box
- **Multiple Emotion Modalities** - Audio, vector, or text-based
- **Production Ready** - Industrial-level stability

---

## Installation

### Quick Install (uv)
```bash
git clone https://github.com/JarodMica/index-tts.git
cd index-tts
git lfs pull

pip install -U uv
uv sync --all-extras

# Download models
uv tool install "huggingface-hub[cli,hf_xet]"
hf download IndexTeam/IndexTTS-2 --local-dir=checkpoints
```

### YouTube Fast Track
```bash
git clone https://github.com/JarodMica/index-tts.git
cd index-tts
git switch youtube
uv sync
uv run huggingface-cli download IndexTeam/IndexTTS-2 --local-dir checkpoints
uv run webui_parallel.py
```

---

## Basic Usage

### Web UI (Easiest)
```bash
uv run webui.py
# Opens at http://127.0.0.1:7860
```

### Command-Line
```bash
# Basic
uv run inference_script.py \
  --speaker examples/voice_01.wav \
  --text "Hello, how are you?" \
  --output output.wav

# With emotion audio
uv run inference_script.py \
  --speaker examples/voice_07.wav \
  --text "This is sad..." \
  --emo-audio examples/emo_sad.wav \
  --output output.wav

# With text emotion
uv run inference_script.py \
  --speaker examples/voice_12.wav \
  --text "Hide! He's coming!" \
  --use-emo-text \
  --emo-alpha 0.6 \
  --output output.wav
```

### Python API
```python
from indextts.infer_v2 import IndexTTS2

tts = IndexTTS2(
    cfg_path="checkpoints/config.yaml",
    model_dir="checkpoints",
    use_fp16=False
)

# Basic
tts.infer(
    spk_audio_prompt='voice.wav',
    text="Hello world",
    output_path="gen.wav"
)

# With emotion vector
# [happy, angry, sad, afraid, disgusted, melancholic, surprised, calm]
tts.infer(
    spk_audio_prompt='voice.wav',
    text="Wow! Amazing!",
    emo_vector=[0, 0, 0, 0, 0, 0, 0.45, 0],  # Surprised
    output_path="gen.wav"
)

# With emotion audio
tts.infer(
    spk_audio_prompt='voice.wav',
    text="So sad...",
    emo_audio_prompt="sad_ref.wav",
    emo_alpha=0.8,
    output_path="gen.wav"
)
```

---

## Configuration Options

### CLI Options
```
--speaker PATH        # Reference audio (required)
--text TEXT           # Text to synthesize
--output PATH         # Output file (default: output.wav)
--device cuda:0       # Device
--fp16                # Half-precision (faster, lower VRAM)
--emo-audio PATH      # Emotion reference audio
--emo-alpha 0-1       # Emotion blend factor
--use-emo-text        # Derive emotion from text
--emo-text TEXT       # Separate emotion description
--top-k INT           # Sampling top-k
--top-p FLOAT         # Nucleus sampling
--temperature FLOAT   # Sampling temperature
--verbose             # Detailed logs
```

### Emotion Vector Reference
```python
# [happy, angry, sad, afraid, disgusted, melancholic, surprised, calm]

[0.8, 0, 0, 0, 0, 0, 0, 0]   # Happy
[0, 0.9, 0, 0, 0, 0, 0, 0]   # Angry
[0, 0, 0.9, 0, 0, 0, 0, 0]   # Sad
[0, 0, 0, 0.8, 0, 0, 0, 0]   # Afraid
[0, 0, 0, 0, 0, 0, 0.45, 0]  # Surprised
[0, 0, 0, 0, 0, 0, 0, 0.7]   # Calm
```

---

## Common Commands

```bash
# Start WebUI
uv run webui.py

# With FP16 optimization
uv run inference_script.py --fp16 ...

# Check GPU
uv run tools/gpu_check.py

# Use China mirror
export HF_ENDPOINT="https://hf-mirror.com"

# List models
ls -la checkpoints/
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CUDA Error | Ensure CUDA 12.8+; try `--fp16` |
| Slow Download | `export HF_ENDPOINT="https://hf-mirror.com"` |
| Out of Memory | Enable `--fp16` flag |
| Bad Quality | Use clear reference audio; adjust `--emo-alpha` |
| Missing Models | `hf download IndexTeam/IndexTTS-2 --local-dir=checkpoints` |
| Git-LFS | `git lfs install && git lfs pull` |

---

## Resources

- **Repo**: https://github.com/index-tts/index-tts
- **Paper**: https://arxiv.org/abs/2506.21619
- **Demo**: https://huggingface.co/spaces/IndexTeam/IndexTTS-2-Demo
- **Discord**: https://discord.gg/uT32E7KDmy

---

**Requirements**: Python 3.10+ | CUDA 12.8+ | ~8GB VRAM (FP16)
