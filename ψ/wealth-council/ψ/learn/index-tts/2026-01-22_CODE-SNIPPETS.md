# Index-TTS Code Snippets

**Date**: 2026-01-22
**Repository**: https://github.com/JarodMica/index-tts

---

## 1. Main Inference Script

**File**: `inference_script.py`

```python
def main() -> None:
    args = parse_args()
    text = load_text(args)
    generation_kwargs = build_generation_kwargs(args)

    cfg = OmegaConf.load(cfg_path)

    engine = IndexTTS2(
        cfg_path=str(tmp_cfg_path),
        model_dir=str(model_dir_resolved),
        device=args.device,
        use_fp16=args.fp16,
    )

    engine.infer(
        spk_audio_prompt=args.speaker,
        text=text,
        output_path=args.output,
        emo_audio_prompt=args.emo_audio,
        emo_alpha=args.emo_alpha,
        use_emo_text=args.use_emo_text,
        emo_text=args.emo_text,
        **generation_kwargs,
    )
```

---

## 2. IndexTTS2 Model Initialization

**File**: `indextts/infer_v2.py`

```python
class IndexTTS2:
    def __init__(self, cfg_path, model_dir, use_fp16=False, device=None,
                 use_cuda_kernel=None, use_deepspeed=False, use_accel=False):

        # Device detection
        if torch.cuda.is_available():
            self.device = "cuda:0"
        elif hasattr(torch, "mps") and torch.backends.mps.is_available():
            self.device = "mps"
        else:
            self.device = "cpu"

        # Load semantic model (W2V-BERT)
        self.semantic_model, self.semantic_mean, self.semantic_std = build_semantic_model(...)

        # Load semantic codec (MaskGCT)
        self.semantic_codec = build_semantic_codec(self.cfg.semantic_codec)

        # Load GPT acoustic model
        self.gpt = UnifiedVoice(**self.cfg.gpt, use_accel=use_accel)
        self.gpt.post_init_gpt2_config(use_deepspeed=use_deepspeed, kv_cache=True)

        # Load Speech-to-Mel and BigVGAN vocoder
        self.s2mel = MyModel(self.cfg.s2mel, use_gpt_latent=True)
        self.bigvgan = bigvgan.BigVGAN.from_pretrained(bigvgan_name)

        # Load CAMPPlus speaker embedding
        self.campplus_model = CAMPPlus(feat_dim=80, embedding_size=192)
```

---

## 3. UnifiedVoice GPT Model

**File**: `indextts/gpt/model.py`

```python
class UnifiedVoice(nn.Module):
    def __init__(self, layers=8, model_dim=512, heads=8, max_text_tokens=120,
                 max_mel_tokens=250, number_mel_codes=8194, condition_type="perceiver"):
        super().__init__()

        # Embeddings
        self.text_embedding = nn.Embedding(self.number_text_tokens * types + 1, model_dim)
        self.mel_embedding = nn.Embedding(self.number_mel_codes, model_dim)

        # GPT transformer
        self.gpt, self.mel_pos_embedding, self.text_pos_embedding = \
            build_hf_gpt_transformer(layers, model_dim, heads, max_mel_tokens, max_text_tokens)

        # Conditioning encoder
        if condition_type == "perceiver":
            self.conditioning_encoder = ConditioningEncoder(100, model_dim)
            self.perceiver_encoder = PerceiverResampler(model_dim, num_latents=32)

        # Output heads
        self.mel_head = nn.Linear(model_dim, self.number_mel_codes)

    def post_init_gpt2_config(self, use_deepspeed=False, kv_cache=False):
        self.inference_model = GPT2InferenceModel(
            gpt_config, self.gpt, self.mel_pos_embedding,
            self.mel_embedding, self.final_norm, self.mel_head, kv_cache=kv_cache
        )
```

---

## 4. Text Normalization

**File**: `indextts/utils/front.py`

```python
class TextNormalizer:
    def __init__(self, preferred_language: str | None = None):
        self.char_rep_map = {
            "：": ",", "；": ",", "，": ",", "。": ".",
            "！": "!", "？": "?", "\n": " ",
        }

    def use_chinese(self, s):
        has_chinese = bool(re.search(r"[\u4e00-\u9fff]", s))
        has_alpha = bool(re.search(r"[a-zA-Z]", s))
        return has_chinese or not has_alpha

    def load(self):
        if platform.system() != "Linux":
            from wetext import Normalizer
            self.zh_normalizer = Normalizer(remove_erhua=False, lang="zh")
            self.en_normalizer = Normalizer(lang="en")
```

---

## 5. Speaker Embedding Extraction

**File**: `indextts/infer_v2.py`

```python
@torch.no_grad()
def get_emb(self, input_features, attention_mask):
    # Extract semantic embeddings using W2V-BERT
    vq_emb = self.semantic_model(
        input_features=input_features,
        attention_mask=attention_mask,
        output_hidden_states=True,
    )
    feat = vq_emb.hidden_states[17]  # Layer 17
    feat = (feat - self.semantic_mean) / self.semantic_std
    return feat

# Usage
audio_16k = torchaudio.transforms.Resample(sr, 16000)(audio)
inputs = self.extract_features(audio_16k, sampling_rate=16000, return_tensors="pt")
spk_cond_emb = self.get_emb(inputs["input_features"], inputs["attention_mask"])
_, S_ref = self.semantic_codec.quantize(spk_cond_emb)

# Speaker identity via CAMPPlus
feat = torchaudio.compliance.kaldi.fbank(audio_16k, num_mel_bins=80)
style = self.campplus_model(feat.unsqueeze(0))  # [1, 192]
```

---

## 6. BigVGAN Vocoder Block

**File**: `indextts/BigVGAN/bigvgan.py`

```python
class AMPBlock1(torch.nn.Module):
    def __init__(self, h, channels, kernel_size=3, dilation=(1, 3, 5), activation="snakebeta"):
        super().__init__()

        # Dilated convolutions
        self.convs1 = nn.ModuleList([
            weight_norm(Conv1d(channels, channels, kernel_size, dilation=d))
            for d in dilation
        ])

        # Snake activations
        self.activations = nn.ModuleList([
            Activation1d(activations.SnakeBeta(channels))
            for _ in range(self.num_layers)
        ])

    def forward(self, x):
        for c1, c2, a1, a2 in zip(self.convs1, self.convs2, acts1, acts2):
            xt = a1(x)
            xt = c1(xt)
            xt = a2(xt)
            xt = c2(xt)
            x = xt + x  # Residual
        return x
```

---

## 7. Emotion Vector Processing

**File**: `indextts/infer_v2.py`

```python
def normalize_emo_vec(self, emo_vector, apply_bias=True):
    """
    Emotion types: [happy, angry, sad, afraid, disgusted, melancholic, surprised, calm]
    """
    if apply_bias:
        emo_bias = [0.9375, 0.875, 1.0, 1.0, 0.9375, 0.9375, 0.6875, 0.5625]
        emo_vector = [vec * bias for vec, bias in zip(emo_vector, emo_bias)]

    emo_sum = sum(emo_vector)
    if emo_sum > 0.8:
        emo_vector = [vec * (0.8 / emo_sum) for vec in emo_vector]

    return emo_vector
```

---

## 8. Remove Long Silence

**File**: `indextts/infer.py`

```python
def remove_long_silence(self, codes, silent_token=52, max_consecutive=30):
    """Keep max 10 consecutive silence tokens"""
    for i in range(codes.shape[0]):
        code = codes[i]
        count = torch.sum(code == silent_token).item()

        if count > max_consecutive:
            ncode_idx = []
            n = 0
            for k in range(len_):
                if code[k] != silent_token:
                    ncode_idx.append(k)
                    n = 0
                elif n < 10:
                    ncode_idx.append(k)
                    n += 1
            codes_list.append(code[ncode_idx])

    return pad_sequence(codes_list, batch_first=True)
```

---

## 9. Fast Inference with Bucketing

**File**: `indextts/infer.py`

```python
def infer_fast(self, audio_prompt, text, output_path, max_text_tokens_per_segment=100):
    """2-10x speedup via segment bucketing"""

    # Split text into segments
    segments = self.tokenizer.split_segments(text_tokens_list, max_text_tokens_per_segment)

    # Bucket by size (adaptive batching)
    all_segments = self.bucket_segments(segments, bucket_max_size=4)

    # Batch GPT inference
    for bucket_segment in all_segments:
        batch_text_tokens = self.pad_tokens_cat(item_tokens)
        temp_codes = self.gpt.inference_speech(
            auto_conditioning, batch_text_tokens,
            do_sample=True, top_p=0.8, top_k=30, temperature=1.0
        )

    # Chunked vocoding
    for items in chunk_latents:
        wav, _ = self.bigvgan(latent, auto_conditioning.transpose(1, 2))
```

---

## Architecture Flow

```
Text → TextNormalizer → BPE Tokenizer → UnifiedVoice GPT → Mel Codes
                                              ↑
                                    Speaker (W2V-BERT + CAMPPlus)
                                    Emotion (Vector or Audio)

Mel Codes → MaskGCT Decoder → CFM → Mel Spectrogram → BigVGAN → Audio
```
