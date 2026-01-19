# Typhoon OCR - Quick Reference

**Date**: 2026-01-19

---

## What It Does

Typhoon OCR เป็น vision-language model สำหรับ extract markdown จาก images และ PDFs โดยจะทำ document layout analysis และ text extraction แล้วคืน clean markdown หรือ HTML output รองรับทั้งภาษาไทยและอังกฤษ

---

## Installation

```bash
# Basic
pip install typhoon-ocr

# For Gradio demo
pip install -r requirements.txt

# macOS - ต้องมี poppler
brew install poppler

# Linux
sudo apt-get install poppler-utils
```

---

## Key Features

- **Multiple Input Formats**: PDF (multi-page) และ images (PNG, JPG, JPEG)
- **Three OCR Modes**:
  - `default`: Markdown tables
  - `structure`: HTML tables + image analysis
  - `v1.5`: Clean markdown, LaTeX equations, checkboxes
- **Multi-Language**: English และ Thai
- **Layout Analysis**: Structure detection, image/figure identification
- **Table Extraction**: Markdown หรือ HTML
- **Flexible Backend**: OpenAI-compatible APIs

---

## Usage Patterns

### Simple (Minimal)

```python
from typhoon_ocr import ocr_document

markdown = ocr_document("document.pdf")
print(markdown)
```

### With Parameters

```python
markdown = ocr_document(
    pdf_or_image_path="complex_form.png",
    task_type="structure",  # "default", "structure", "v1.5"
    page_num=1,
    figure_language="Thai"  # for v1.5 only
)
```

### Lower-Level API

```python
from typhoon_ocr import prepare_ocr_messages
from openai import OpenAI

messages = prepare_ocr_messages(
    pdf_or_image_path="document.pdf",
    task_type="v1.5",
    target_image_dim=1800,
    page_num=1
)

client = OpenAI(base_url="http://localhost:8101/v1", api_key="dummy")
response = client.chat.completions.create(
    model="typhoon-ocr",
    messages=messages,
    max_tokens=16384
)
```

### Web UI

```bash
python app.py
# Opens at http://localhost:7860
```

---

## Configuration

### Environment Variables (.env)

```bash
TYPHOON_BASE_URL=https://api.opentyphoon.ai/v1
TYPHOON_API_KEY=your_api_key_here
TYPHOON_OCR_MODEL=typhoon-ocr-preview
```

### Function Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `pdf_or_image_path` | required | Path to PDF or image |
| `task_type` | "v1.5" | "default", "structure", "v1.5" |
| `page_num` | 1 | Page to process (PDFs) |
| `target_image_dim` | 1800 | Longest dimension in pixels |
| `figure_language` | "Thai" | "Thai" or "English" |

---

## Task Types

| Mode | Output | Tables | Best For |
|------|--------|--------|----------|
| `default` | JSON wrapped | Markdown | Simple docs |
| `structure` | JSON wrapped | HTML | Complex layouts |
| `v1.5` | Raw markdown | HTML | Clean extraction |

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Error processing document" | Install poppler: `brew install poppler` |
| API Authentication | Check .env: `TYPHOON_API_KEY` |
| Page Out of Range | Check `page_num` ≤ total pages |

---

## Local Inference (Optional)

```bash
pip install vllm
vllm serve scb10x/typhoon-ocr-7b \
  --served-model-name typhoon-ocr \
  --dtype bfloat16 \
  --port 8101
```

Then use:
```python
ocr_document("doc.pdf", base_url="http://localhost:8101/v1")
```
