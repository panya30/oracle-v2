# Typhoon OCR - Code Snippets Collection

**Date**: 2026-01-19

---

## Main Entry Point

**File: `app.py`**

```python
import base64
from io import BytesIO
import json
import os
from openai import OpenAI
from dotenv import load_dotenv
from typhoon_ocr import prepare_ocr_messages
import gradio as gr
from PIL import Image

load_dotenv()
openai = OpenAI(base_url=os.getenv("TYPHOON_BASE_URL"), api_key=os.getenv("TYPHOON_API_KEY"))

def process_pdf(pdf_or_image_file, task_type, page_number):
    if pdf_or_image_file is None:
        return None, "No file uploaded"

    orig_filename = pdf_or_image_file.name

    try:
        messages = prepare_ocr_messages(
            pdf_or_image_path=orig_filename,
            task_type=task_type,
            target_image_dim=1800,
            target_text_length=8000,
            page_num=page_number if page_number else 1
        )

        # Extract the image from the message content for display
        image_url = messages[0]["content"][1]["image_url"]["url"]
        image_base64 = image_url.replace("data:image/png;base64,", "")
        image_pil = Image.open(BytesIO(base64.b64decode(image_base64)))

        # Send messages to OpenAI compatible API
        response = openai.chat.completions.create(
            model=os.getenv("TYPHOON_OCR_MODEL"),
            messages=messages,
            max_tokens=16384,
            extra_body={
                "repetition_penalty": 1.2,
                "temperature": 0.1,
                "top_p": 0.6,
            },
        )
        text_output = response.choices[0].message.content

        try:
            json_data = json.loads(text_output)
            markdown_out = json_data.get('natural_text', "")
        except Exception as e:
            markdown_out = f"Could not extract `natural_text` from output.\nError: {str(e)}"

        return image_pil, markdown_out

    except Exception as e:
        return None, f"Error processing file: {str(e)}"
```

---

## Core Implementation: Primary Public API

**File: `packages/typhoon_ocr/typhoon_ocr/ocr_utils.py`**

### `prepare_ocr_messages()` (Lines 508-625)

```python
def prepare_ocr_messages(
    pdf_or_image_path: str,
    task_type: str = "v1.5",
    target_image_dim: int = 1800,
    target_text_length: int = 8000,
    page_num: int = 1,
    figure_language: str = "Thai",
) -> List[Dict[str, Any]]:
    """Prepare messages for OCR processing from a PDF or image file."""
    ext = os.path.splitext(pdf_or_image_path)[1].lower()
    is_image = ext not in [".pdf"]
    filename = pdf_or_image_path

    try:
        if is_image:
            page_num = 1
            img = Image.open(pdf_or_image_path)
            if task_type == "v1.5":
                img = resize_if_needed(img, max_size=target_image_dim)
            image_base64 = image_to_base64png(img)
            if task_type != "v1.5":
                anchor_text = get_anchor_text_from_image(img)
        else:
            image_base64 = render_pdf_to_base64png(
                filename, page_num, target_longest_image_dim=target_image_dim
            )
            if task_type != "v1.5":
                anchor_text = get_anchor_text(
                    filename, page_num, pdf_engine="pdfreport",
                    target_length=target_text_length,
                )

        prompt_fn = get_prompt(task_type)

        if task_type == "v1.5":
            prompt_text = prompt_fn(figure_language=figure_language)
        else:
            prompt_text = prompt_fn(anchor_text)

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt_text},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}},
                ],
            }
        ]

        return messages
    except IndexError:
        raise ValueError(f"Page number {page_num} is out of range")
    except Exception as e:
        raise ValueError(f"Error processing document: {str(e)}")
```

---

### `ocr_document()` - End-to-End (Lines 660-716)

```python
def ocr_document(
    pdf_or_image_path: str,
    task_type: str = "v1.5",
    target_image_dim: int = 1800,
    target_text_length: int = 8000,
    page_num: int = 1,
    base_url: str = os.getenv("TYPHOON_BASE_URL", 'https://api.opentyphoon.ai/v1'),
    api_key: str = None,
    model: str = "typhoon-ocr",
    figure_language: str = "Thai"
) -> str:
    """OCR a PDF or image file - end-to-end workflow."""
    if 'typhoon-ocr-preview' in model:
        assert task_type in ['default', 'structure']

    pdf_or_image_path = ensure_image_in_path(pdf_or_image_path)

    openai = OpenAI(
        base_url=base_url,
        api_key=api_key or os.getenv("TYPHOON_OCR_API_KEY") or os.getenv('TYPHOON_API_KEY') or os.getenv("OPENAI_API_KEY")
    )

    messages = prepare_ocr_messages(
        pdf_or_image_path=pdf_or_image_path,
        task_type=task_type,
        target_image_dim=target_image_dim,
        target_text_length=target_text_length,
        page_num=page_num if page_num else 1,
        figure_language=figure_language
    )

    response = openai.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=16384,
        extra_body={
            "repetition_penalty": 1.1 if task_type == "v1.5" else 1.2,
            "temperature": 0.1,
            "top_p": 0.6,
        },
    )

    text_output = response.choices[0].message.content

    if task_type == "v1.5":
        return text_output
    else:
        text = json.loads(text_output)['natural_text']
        return text
```

---

## PDF Content Extraction

### `_pdf_report()` (Lines 358-388)

```python
def _pdf_report(local_pdf_path: str, page_num: int) -> PageReport:
    reader = PdfReader(local_pdf_path)
    page = reader.pages[page_num - 1]
    resources = page.get("/Resources", {})
    xobjects = resources.get("/XObject", {})
    text_elements, image_elements = [], []

    def visitor_body(text, cm, tm, font_dict, font_size):
        txt2user = _mult(tm, cm)
        text_elements.append(TextElement(text, txt2user[4], txt2user[5]))

    def visitor_op(op, args, cm, tm):
        if op == b"Do":
            xobject_name = args[0]
            xobject = xobjects.get(xobject_name)
            if xobject and xobject["/Subtype"] == "/Image":
                _width = xobject.get("/Width")
                _height = xobject.get("/Height")
                x0, y0 = _transform_point(0, 0, cm)
                x1, y1 = _transform_point(1, 1, cm)
                image_elements.append(ImageElement(
                    xobject_name,
                    BoundingBox(min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1))
                ))

    page.extract_text(visitor_text=visitor_body, visitor_operand_before=visitor_op)

    return PageReport(
        mediabox=BoundingBox.from_rectangle(page.mediabox),
        text_elements=text_elements,
        image_elements=image_elements,
    )
```

---

## Interesting Patterns

### Union-Find for Image Merging (Lines 278-341)

```python
def _merge_image_elements(images: List[ImageElement], tolerance: float = 0.5) -> List[ImageElement]:
    n = len(images)
    parent = list(range(n))

    def find(i):
        root = i
        while parent[root] != root:
            root = parent[root]
        while parent[i] != i:
            parent_i = parent[i]
            parent[i] = root
            i = parent_i
        return root

    def union(i, j):
        root_i = find(i)
        root_j = find(j)
        if root_i != root_j:
            parent[root_i] = root_j

    def bboxes_overlap(b1: BoundingBox, b2: BoundingBox, tolerance: float) -> bool:
        h_dist = max(0, max(b1.x0, b2.x0) - min(b1.x1, b2.x1))
        v_dist = max(0, max(b1.y0, b2.y0) - min(b1.y1, b2.y1))
        return h_dist <= tolerance and v_dist <= tolerance

    for i in range(n):
        for j in range(i + 1, n):
            if bboxes_overlap(images[i].bbox, images[j].bbox, tolerance):
                union(i, j)

    groups: dict[int, list[int]] = {}
    for i in range(n):
        root = find(i)
        groups.setdefault(root, []).append(i)

    merged_images = []
    for indices in groups.values():
        merged_bbox = images[indices[0]].bbox
        merged_name = images[indices[0]].name

        for idx in indices[1:]:
            bbox = images[idx].bbox
            merged_bbox = BoundingBox(
                x0=min(merged_bbox.x0, bbox.x0),
                y0=min(merged_bbox.y0, bbox.y0),
                x1=max(merged_bbox.x1, bbox.x1),
                y1=max(merged_bbox.y1, bbox.y1),
            )
            merged_name += f"+{images[idx].name}"

        merged_images.append(ImageElement(name=merged_name, bbox=merged_bbox))

    return merged_images
```

---

### Prompt Template System (Lines 401-465)

```python
PROMPTS_SYS = {
    "default": lambda base_text: (
        f"Below is an image of a document page along with its dimensions. "
        f"Simply return the markdown representation of this document.\n"
        f"RAW_TEXT_START\n{base_text}\nRAW_TEXT_END"
    ),

    "structure": lambda base_text: (
        f"Below is an image of a document page. "
        f"Return the markdown representation with tables in HTML format.\n"
        f"If document contains images, include <figure>IMAGE_ANALYSIS</figure>.\n"
        f"RAW_TEXT_START\n{base_text}\nRAW_TEXT_END"
    ),

    "v1.5": lambda base_text=None, figure_language="Thai": f"""Extract all text from the image.
Instructions:
- Only return the clean Markdown.
- Tables: Render using <table>...</table> in HTML format.
- Equations: Render using LaTeX ($...$ and $$...$$).
- Images/Charts: Wrap in <figure>Describe in {figure_language}.</figure>
- Page Numbers: Wrap in <page_number>...</page_number>
- Checkboxes: Use ☐ for unchecked and ☑ for checked.
    """,
}

def get_prompt(prompt_name: str) -> Callable[[str], str]:
    return PROMPTS_SYS.get(prompt_name, lambda x: "Invalid PROMPT_NAME provided.")
```

---

## Data Structures

```python
@dataclass(frozen=True)
class BoundingBox:
    x0: float
    y0: float
    x1: float
    y1: float

    @staticmethod
    def from_rectangle(rect: RectangleObject) -> "BoundingBox":
        return BoundingBox(rect[0], rect[1], rect[2], rect[3])

@dataclass(frozen=True)
class TextElement:
    text: str
    x: float
    y: float

@dataclass(frozen=True)
class ImageElement:
    name: str
    bbox: BoundingBox

@dataclass(frozen=True)
class PageReport:
    mediabox: BoundingBox
    text_elements: List[TextElement]
    image_elements: List[ImageElement]
```

---

## Simple Example

**File: `examples/simple_ocr.py`**

```python
from typhoon_ocr import ocr_document
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
image_path = os.path.join(script_dir, "test.png")

markdown = ocr_document(image_path)
print(markdown)
```
