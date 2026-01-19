# Typhoon OCR Learning Index

**Repository**: https://github.com/scb-10x/typhoon-ocr
**By**: SCB 10X
**License**: Apache 2.0

---

## Summary

Vision-language OCR model สำหรับ extract markdown จาก documents (images/PDFs) รองรับ Thai + English มี 3 modes: default, structure, v1.5

---

## Latest Exploration

**Date**: 2026-01-19

**Files**:
- [[2026-01-19_ARCHITECTURE|Architecture]] - Directory structure, entry points, core abstractions
- [[2026-01-19_CODE-SNIPPETS|Code Snippets]] - Key implementations, patterns
- [[2026-01-19_QUICK-REFERENCE|Quick Reference]] - Installation, usage, config

---

## Key Insights

1. **Union-Find Algorithm** - ใช้ merge overlapping images ใน PDF ได้ efficient มาก
2. **Prompt Polymorphism** - 3 prompt templates via lambdas ทำให้ extend ง่าย
3. **Boundary Preservation** - Smart sampling ที่ keep edge elements ก่อน random sample

---

## Quick Start

```python
from typhoon_ocr import ocr_document

# ง่ายสุด
markdown = ocr_document("document.pdf")

# กำหนด options
markdown = ocr_document(
    "doc.pdf",
    task_type="v1.5",
    figure_language="Thai"
)
```

---

## Timeline

### 2026-01-19 (First exploration)
- Initial discovery via /learn
- Core: Pipeline architecture with OpenAI-compatible API
- Notable: Union-Find for image merging, 3 prompt modes
