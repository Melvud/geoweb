import argparse
import json
import re
import statistics
import sys
from datetime import datetime
from pathlib import Path

import pdfplumber
from pypdf import PdfReader


def clean(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def markdown_table(rows):
    normalized = []
    width = max((len(row) for row in rows), default=0)
    if width == 0:
        return ""
    for row in rows:
        cells = [clean(cell).replace("|", "\\|") for cell in row]
        normalized.append(cells + [""] * (width - len(cells)))
    header = normalized[0]
    body = normalized[1:]
    lines = ["| " + " | ".join(header) + " |", "| " + " | ".join(["---"] * width) + " |"]
    lines.extend("| " + " | ".join(row) + " |" for row in body)
    return "\n".join(lines)


def line_groups(page):
    words = page.extract_words(extra_attrs=["fontname", "size"], keep_blank_chars=False) or []
    groups = []
    for word in sorted(words, key=lambda item: (round(float(item["top"]) / 3) * 3, float(item["x0"]))):
        top = float(word["top"])
        if not groups or abs(groups[-1]["top"] - top) > 3:
            groups.append({"top": top, "words": [word]})
        else:
            groups[-1]["words"].append(word)
    return groups


def styled_line(group, median_size):
    words = sorted(group["words"], key=lambda item: float(item["x0"]))
    if not words:
        return ""
    size = max(float(word.get("size") or median_size) for word in words)
    chunks = []
    for word in words:
        text = clean(word.get("text"))
        font = str(word.get("fontname") or "").lower()
        if not text:
            continue
        if "bold" in font or "black" in font or "demi" in font:
            text = f"**{text}**"
        elif "italic" in font or "oblique" in font:
            text = f"*{text}*"
        chunks.append(text)
    text = " ".join(chunks)
    plain = clean(re.sub(r"[*_]", "", text))
    if not plain:
        return ""
    if size >= median_size * 1.65 and len(plain) < 180:
        return f"# {plain}"
    if size >= median_size * 1.35 and len(plain) < 220:
        return f"## {plain}"
    if size >= median_size * 1.15 and len(plain) < 220:
        return f"### {plain}"
    return text


def join_lines(lines):
    paragraphs = []
    current = []
    for line in lines:
        if line.startswith("#") or line.startswith("|") or not line:
            if current:
                paragraphs.append(" ".join(current))
                current = []
            if line:
                paragraphs.append(line)
            continue
        if current and (current[-1].endswith((".", "!", "?", ":")) or len(" ".join(current)) > 700):
            paragraphs.append(" ".join(current))
            current = []
        current.append(line)
    if current:
        paragraphs.append(" ".join(current))
    return "\n\n".join(paragraphs)


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("output_dir")
    parser.add_argument("public_prefix")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    reader = PdfReader(str(input_path))
    metadata = reader.metadata or {}
    markdown_pages = []
    first_lines = []
    first_page_lines = []
    title_candidates = []
    extracted_images = []
    table_count = 0

    with pdfplumber.open(str(input_path)) as pdf:
        all_sizes = [float(char.get("size") or 0) for page in pdf.pages for char in page.chars if char.get("size")]
        median_size = statistics.median(all_sizes) if all_sizes else 10.0

        for page_index, page in enumerate(pdf.pages):
            groups = line_groups(page)
            styled_groups = [(group, styled_line(group, median_size)) for group in groups]
            styled_groups = [(group, line) for group, line in styled_groups if line]
            lines = [line for _, line in styled_groups]
            if page_index < 2:
                first_lines.extend(clean(re.sub(r"[*#_]", "", line)) for line in lines[:20])
            if page_index == 0:
                first_page_lines.extend(clean(re.sub(r"[*#_]", "", line)) for line in lines)
                for group, line in styled_groups:
                    plain = clean(re.sub(r"[*#_]", "", line))
                    if 12 <= len(plain) <= 320:
                        size = max(float(word.get("size") or median_size) for word in group["words"])
                        bold = any("bold" in str(word.get("fontname") or "").lower() for word in group["words"])
                        title_candidates.append((size + (1.5 if bold else 0), plain))

            page_text = join_lines(lines)
            tables = page.extract_tables() or []
            table_blocks = []
            for table in tables:
                block = markdown_table(table)
                if block:
                    table_blocks.append(block)
                    table_count += 1

            image_blocks = []
            if page_index < len(reader.pages):
                for image_index, image in enumerate(reader.pages[page_index].images):
                    if len(extracted_images) >= 100:
                        break
                    suffix = Path(image.name or "image.png").suffix.lower()
                    if suffix not in {".png", ".jpg", ".jpeg", ".jp2", ".tif", ".tiff"}:
                        suffix = ".png"
                    filename = f"page-{page_index + 1:03d}-image-{image_index + 1:02d}{suffix}"
                    target = output_dir / filename
                    target.write_bytes(image.data)
                    public_path = f"{args.public_prefix}/{filename}"
                    extracted_images.append(public_path)
                    image_blocks.append(f"![Изображение со страницы {page_index + 1}]({public_path})")

            blocks = [block for block in [page_text, *table_blocks, *image_blocks] if block]
            if blocks:
                markdown_pages.append("\n\n".join(blocks))

    raw_text = "\n".join(first_lines)
    doi_match = re.search(r"10\.\d{4,9}/[-._;()/:A-Z0-9]+", raw_text, re.I)
    years = [int(value) for value in re.findall(r"\b(?:19|20)\d{2}\b", "\n".join(first_page_lines))]
    years = [value for value in years if value <= datetime.now().year + 1]
    title = clean(metadata.get("/Title"))
    if not title:
        excluded = re.compile(r"(министерств|образовательн|университет|институт|факультет|кафедр|научный руководитель|^doi\b|^удк\b|^issn\b)", re.I)
        candidates = [(score, line) for score, line in title_candidates if not excluded.search(line)]
        title = max(candidates, key=lambda item: (item[0], len(item[1])), default=(0, input_path.stem))[1]

    result = {
        "title": title,
        "authors": clean(metadata.get("/Author")),
        "year": str(max(years)) if years else "",
        "source": clean(metadata.get("/Subject")),
        "doi": doi_match.group(0).rstrip(".,;)") if doi_match else "",
        "content": "\n\n---\n\n".join(markdown_pages),
        "images": extracted_images,
        "tables": table_count,
        "pages": len(reader.pages),
    }
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
