# Typhoon OCR - Architecture Document

**Date**: 2026-01-19
**Repository**: https://github.com/scb-10x/typhoon-ocr
**Version**: 0.4.1
**License**: Apache 2.0

---

## Overview

Typhoon OCR is an intelligent document extraction system designed to extract structured markdown from images and PDFs using advanced vision language models. It supports both English and Thai languages with sophisticated layout analysis and table extraction capabilities.

---

## Directory Structure

```
typhoon-ocr/
├── app.py                          # Gradio web UI application
├── requirements.txt                # Project dependencies
├── README.md                       # Main documentation
├── .env.template                   # Environment configuration template
├── examples/
│   ├── simple_ocr.py              # Basic usage example
│   └── test.png                   # Test image (~3MB)
├── packages/
│   └── typhoon_ocr/               # Main package
│       ├── pyproject.toml         # Package metadata and config
│       ├── setup.py               # Setup script
│       ├── README.md              # Package documentation
│       └── typhoon_ocr/           # Core module
│           ├── __init__.py        # Public API exports
│           ├── ocr_utils.py       # Primary OCR utilities (716 lines)
│           └── pdf_utils.py       # PDF utility checks
└── tests/                          # Test suite (83+ tests)
    ├── README.md                  # Test documentation
    ├── test_e2e_ocr.py           # End-to-end API tests
    ├── test_unit_ocr_utils.py    # Core utility tests
    ├── test_pdf_processing.py    # PDF-specific tests (31 tests)
    ├── test_error_handling_simple.py  # Error scenarios (18 tests)
    └── test_integration.py        # Integration tests (19 tests)
```

---

## Entry Points

### 1. Gradio Web Application (`/app.py`)
- **Purpose**: Interactive web UI for document OCR
- **Launch Command**: `python app.py`
- **Features**: File upload (PDF, PNG, JPG, JPEG), task selection, page number input, real-time preview

### 2. CLI Example (`examples/simple_ocr.py`)
- **Purpose**: Minimal command-line usage
- **Entry Point**: Direct call to `ocr_document()` function

### 3. Package Installation
```bash
pip install typhoon-ocr
```

---

## Core Abstractions & Key Classes

### Data Structures (Frozen Dataclasses)

```python
BoundingBox(x0, y0, x1, y1)
  → Represents spatial coordinates (from PyPDF rectangle objects)

TextElement(text, x, y)
  → Extracted text with position coordinates

ImageElement(name, bbox)
  → Image reference with bounding box

PageReport(mediabox, text_elements, image_elements)
  → Complete page analysis result
```

### Main API Functions

#### `prepare_ocr_messages()` - Primary Message Builder
```python
prepare_ocr_messages(
    pdf_or_image_path: str,
    task_type: str = "v1.5",           # "default", "structure", "v1.5"
    target_image_dim: int = 1800,
    target_text_length: int = 8000,
    page_num: int = 1,
    figure_language: str = "Thai"
) -> List[Dict[str, Any]]
```

#### `ocr_document()` - End-to-End Pipeline
```python
ocr_document(
    pdf_or_image_path: str,
    task_type: str = "v1.5",
    base_url: str = "https://api.opentyphoon.ai/v1",
    api_key: str = None,
    model: str = "typhoon-ocr"
) -> str
```

#### `get_prompt()` - Prompt Template System
- `"default"`: Markdown with markdown tables
- `"structure"`: Structured layout with HTML tables + image analysis
- `"v1.5"`: Clean markdown (no anchor text), HTML tables, Thai descriptions

---

## Dependencies

### Core Dependencies
```
ftfy              # Text encoding fixes
pypdf             # PDF parsing and analysis
pillow            # Image processing
openai            # OpenAI-compatible API client
```

### System Dependencies (Poppler utilities)
```
pdfinfo           # Extract PDF metadata (required)
pdftoppm          # Convert PDF pages to PNG (required)
```

**Installation**:
- macOS: `brew install poppler`
- Linux: `apt-get install poppler-utils`

---

## Key Design Patterns

### 1. Pipeline Architecture
Sequential processing stages:
- File detection (PDF/image)
- Format conversion (image → PDF if needed)
- Page rendering (PDF → PNG)
- Text extraction (anchor text with positions)
- Prompt application (task-specific template)
- API submission (OpenAI-compatible format)

### 2. Union-Find Algorithm
Efficiently groups overlapping images using path compression and union by attachment.

### 3. Prompt Polymorphism
Single `get_prompt()` function returns different prompt templates via lambda functions.

### 4. Boundary Element Preservation
Text linearization prioritizes edge elements (min/max x,y coordinates) before random sampling.

---

## Message Flow

```
Input File
    ↓
[Is Image?] → Yes → Load PIL Image
    ↓ No
[Is PDF?] → Render page to base64 PNG
    ↓
[Extract Anchor Text] (skip for v1.5)
    ↓
[Get Prompt Template] → Apply to anchor text
    ↓
[Build Messages Structure]
    ↓
[Send to OpenAI API]
    ↓
[Parse Response]
    ↓
Output: Markdown String
```

---

## Test Coverage

| Test File | Count | Focus |
|-----------|-------|-------|
| `test_pdf_processing.py` | 31 | PDF utilities, MediaBox, linearization |
| `test_error_handling_simple.py` | 18 | File errors, API errors, validation |
| `test_integration.py` | 19 | End-to-end workflows |
| `test_unit_ocr_utils.py` | ~15 | String, image, base64 utilities |
| `test_e2e_ocr.py` | - | Real API testing |

**Total**: 80+ tests
