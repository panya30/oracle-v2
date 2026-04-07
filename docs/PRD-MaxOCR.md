# PRD: MaxOCR - Thai OCR Platform

> **แปลงภาพเป็นข้อความไทย ด้วย AI**

**Version**: 1.0
**Created**: 2026-01-20
**Author**: ATHENA (Director Panya)
**Status**: Draft

---

## 1. Problem Statement

### Current Pain Points
1. **Thai OCR ยังไม่ดีพอ** - Tools ส่วนใหญ่ไม่รองรับภาษาไทยดี โดยเฉพาะลายมือ
2. **Multi-page PDF ลำบาก** - ต้อง extract ทีละหน้า
3. **ไม่มี batch processing** - Upload ได้ทีละไฟล์
4. **ไม่มี edit/review UI** - Copy ไปแก้ที่อื่น
5. **Privacy concerns** - ต้องส่งขึ้น cloud

### Target Users
- นักเรียน/นักศึกษา - แปลงโน้ตลายมือ
- Office workers - แปลงเอกสารเก่า
- Developers - ต้องการ Thai OCR API
- Researchers - ต้องการ accuracy metrics

---

## 2. Goals & Success Metrics

### Goals
1. **Best-in-class Thai OCR** - Handwriting + printed
2. **Fast & Easy** - Drag-drop, instant results
3. **Privacy-first** - Local processing option
4. **Developer-friendly** - API + CLI

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Thai text accuracy | >95% CER | Test dataset |
| Handwriting accuracy | >85% CER | Handwriting samples |
| Processing speed | <3s per page | Benchmark |
| User satisfaction | >4.5/5 | Feedback |

---

## 3. Core Features

### P0 - MVP (Week 1-2)

| Feature | Description | Panya |
|---------|-------------|-------|
| **Multi-page PDF** | Process all pages, combine results | HEPHAESTUS |
| **Batch upload** | Multiple files at once | HEPHAESTUS |
| **3 OCR modes** | v1.5 (fast), default, structure | HEPHAESTUS |
| **Thai test dataset** | 100+ samples for validation | ARGUS |
| **Copy/export** | Copy button, .txt export | APOLLO |

### P1 - Enhanced (Week 3-4)

| Feature | Description | Panya |
|---------|-------------|-------|
| **Image preprocessing** | Auto-rotate, deskew, contrast | HEPHAESTUS |
| **Edit/review UI** | Inline text editing | APOLLO |
| **Accuracy dashboard** | CER/WER per document | ARGUS |
| **Export formats** | .docx, .md, .json | HEPHAESTUS |
| **Mobile responsive** | Touch-friendly UI | APOLLO |

### P2 - Advanced (Week 5+)

| Feature | Description | Panya |
|---------|-------------|-------|
| **Local model** | Ollama/local Typhoon | HEPHAESTUS |
| **API endpoint** | REST API for developers | HEPHAESTUS |
| **CLI tool** | `maxocr scan image.jpg` | HEPHAESTUS |
| **History/cache** | Past OCR results | HEPHAESTUS |
| **Thai-Arabic numbers** | ๑๒๓ ↔ 123 conversion | APOLLO |

---

## 4. Technical Architecture

### Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui            │
│  - Drag-drop upload (react-dropzone)                           │
│  - PDF preview (react-pdf)                                      │
│  - Rich text editor (tiptap)                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  Next.js API Routes + Edge Functions                            │
│  - /api/ocr - Main OCR endpoint                                │
│  - /api/batch - Batch processing                               │
│  - /api/export - Export generation                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      OCR PROVIDERS                               │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Typhoon    │  │   Local     │  │  Fallback   │            │
│  │  Cloud API  │  │   Ollama    │  │  Tesseract  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
MaxOCR/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── page.tsx           # Main OCR page
│   │   ├── api/
│   │   │   ├── ocr/route.ts   # OCR endpoint
│   │   │   ├── batch/route.ts # Batch processing
│   │   │   └── export/route.ts# Export endpoint
│   │   └── layout.tsx
│   ├── components/
│   │   ├── upload/            # Upload components
│   │   ├── preview/           # Document preview
│   │   ├── editor/            # Text editor
│   │   └── ui/                # shadcn components
│   ├── lib/
│   │   ├── ocr/               # OCR providers
│   │   │   ├── typhoon.ts     # Typhoon API
│   │   │   ├── ollama.ts      # Local Ollama
│   │   │   └── tesseract.ts   # Fallback
│   │   ├── preprocessing/     # Image processing
│   │   └── export/            # Export formats
│   └── types/
├── tests/
│   ├── datasets/              # Thai test images
│   │   ├── printed/
│   │   ├── handwriting/
│   │   └── mixed/
│   ├── unit/
│   └── e2e/
├── docs/
├── public/
├── CLAUDE.md
├── package.json
└── README.md
```

---

## 5. API Design

### POST /api/ocr

```typescript
// Request
{
  image: string,        // Base64 or URL
  mode: "v1.5" | "default" | "structure",
  language: "th" | "th-en",
  options?: {
    preprocess: boolean,
    confidence: boolean
  }
}

// Response
{
  text: string,
  pages?: Array<{
    page: number,
    text: string,
    confidence?: number
  }>,
  metadata: {
    processingTime: number,
    mode: string,
    provider: string
  }
}
```

### POST /api/batch

```typescript
// Request
{
  files: Array<{
    name: string,
    content: string  // Base64
  }>,
  mode: "v1.5" | "default" | "structure"
}

// Response
{
  results: Array<{
    filename: string,
    text: string,
    status: "success" | "error",
    error?: string
  }>,
  summary: {
    total: number,
    success: number,
    failed: number,
    processingTime: number
  }
}
```

---

## 6. Thai-Specific Considerations

### Font Support
- TH Sarabun PSK
- TH SarabunIT๙
- Angsana New
- Cordia New
- Browallia New

### Character Handling
- วรรณยุกต์ (tone marks): ่ ้ ๊ ๋
- สระลอย: ั ิ ี ึ ื ็
- ตัวเลขไทย: ๐ ๑ ๒ ๓ ๔ ๕ ๖ ๗ ๘ ๙
- อักขระพิเศษ: ฯ ๆ

### Test Categories

| Category | Samples | Description |
|----------|---------|-------------|
| Printed clean | 30 | Clear printed Thai |
| Printed noisy | 20 | Scanned, low quality |
| Handwriting neat | 20 | Neat handwriting |
| Handwriting messy | 15 | Difficult handwriting |
| Mixed Thai-English | 15 | Combined text |

---

## 7. UI/UX Requirements

### Design Principles
1. **Thai-first** - UI ภาษาไทย, ฟอนต์ไทยสวย
2. **Dark mode default** - ถนอมสายตา
3. **Instant feedback** - Loading states, progress
4. **Keyboard shortcuts** - Cmd+V paste, Cmd+C copy

### Key Screens

1. **Home/Upload** - Drag-drop zone, recent files
2. **Processing** - Progress indicator, preview
3. **Results** - Text output, edit, export options
4. **Settings** - API key, mode preferences

---

## 8. Panya Council Assignments

### ATHENA (Director)
- Create and prioritize issues
- Coordinate between Panyas
- Review architecture decisions
- Escalate blockers

### HEPHAESTUS (Dev)
- All code implementation
- API development
- Performance optimization
- Technical debt

### ARGUS (Test)
- Create Thai test dataset
- Accuracy benchmarking
- Integration tests
- Edge case discovery

### APOLLO (Product/UX)
- UI/UX design
- Thai localization
- User feedback integration
- Accessibility

---

## 9. Milestones

### Week 1-2: MVP
- [ ] Project setup (Next.js, TypeScript)
- [ ] Basic OCR with Typhoon API
- [ ] Multi-page PDF support
- [ ] Batch upload
- [ ] Thai test dataset (50 samples)

### Week 3-4: Enhanced
- [ ] Image preprocessing
- [ ] Edit/review UI
- [ ] Accuracy dashboard
- [ ] Export formats (.txt, .docx, .md)
- [ ] Mobile responsive

### Week 5+: Advanced
- [ ] Local model support (Ollama)
- [ ] REST API for developers
- [ ] CLI tool
- [ ] History/cache
- [ ] Full test suite (100+ samples)

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Typhoon API rate limits | High | Add caching, queue system |
| Poor handwriting accuracy | Medium | Clear guidance, preprocess |
| Large file handling | Medium | Chunk processing, limits |
| API key exposure | High | Server-side only, env vars |

---

## 11. Success Criteria

MVP is successful when:
1. ✅ Can OCR single image with >90% accuracy on printed Thai
2. ✅ Can process multi-page PDF
3. ✅ Can batch process 10+ files
4. ✅ Results exportable as .txt
5. ✅ 50+ test samples with documented accuracy

---

## Appendix: References

- Typhoon OCR learnings: `ψ/learn/typhoon-ocr/`
- Existing prototype: `ψ/lab/typhoon-ocr-app/`
- Panya Workflow: `docs/PLAYBOOK-PANYA-WORKFLOW.md`

---

*PRD Version: 1.0*
*Last Updated: 2026-01-20*
*Author: ATHENA (Director Panya)*
