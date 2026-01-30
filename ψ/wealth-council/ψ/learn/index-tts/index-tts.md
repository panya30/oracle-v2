# Index-TTS Learning Index

## Overview

**Index-TTS2** - Zero-shot TTS with emotion control and voice cloning by Bilibili.

**Repository**: https://github.com/JarodMica/index-tts
**Source**: `ψ/learn/repo/github.com/JarodMica/index-tts`

## Latest Exploration

**Date**: 2026-01-22

**Files**:
- [[2026-01-22_ARCHITECTURE|Architecture]] - System design, modules, data flow
- [[2026-01-22_CODE-SNIPPETS|Code Snippets]] - Key implementations
- [[2026-01-22_QUICK-REFERENCE|Quick Reference]] - Installation & usage guide

## Quick Start

```bash
# Clone & install
git clone https://github.com/JarodMica/index-tts.git
cd index-tts && uv sync --all-extras

# Download models
hf download IndexTeam/IndexTTS-2 --local-dir=checkpoints

# Run WebUI
uv run webui.py
```

## Key Insights

1. **Multi-stage Pipeline**: Text → GPT tokens → CFM → Mel → BigVGAN → Audio
2. **Emotion Disentanglement**: Speaker identity separate from emotional tone
3. **8 Emotion Types**: happy, angry, sad, afraid, disgusted, melancholic, surprised, calm
4. **Zero-shot Cloning**: Single reference audio, no fine-tuning needed

## Architecture Summary

```
Text → BPE → UnifiedVoice GPT → Mel Codes
                  ↑
         W2V-BERT (Speaker)
         CAMPPlus (Identity)
         Emotion Vector

Mel Codes → MaskGCT → CFM → Mel Spectrogram → BigVGAN → Audio
```

## Timeline

### 2026-01-22 (First exploration)
- Initial discovery via /learn
- Core: Autoregressive TTS with emotion control
- Notable: Production-ready with WebUI, CLI, and Python API
