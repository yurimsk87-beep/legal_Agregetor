import argparse
import json
from pathlib import Path

from PIL import Image


def main():
    parser = argparse.ArgumentParser(description="Crop a 4x4 generated lawyer contact sheet into profile PNGs.")
    parser.add_argument("sheet", help="Path to generated 4x4 image")
    parser.add_argument("gender", choices=["male", "female"], help="Which manifest gender this sheet belongs to")
    parser.add_argument("start", type=int, help="Zero-based start index inside the gender-filtered manifest list")
    parser.add_argument("--manifest", default="public/generated-lawyer-photos/manifest.json")
    parser.add_argument("--out-dir", default="public/generated-lawyer-photos")
    args = parser.parse_args()

    manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    records = [item for item in manifest if item["gender"] == args.gender]
    selected = records[args.start : args.start + 16]
    if not selected:
        raise SystemExit("No records selected.")

    sheet = Image.open(args.sheet).convert("RGB")
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    width, height = sheet.size
    cell_w = width / 4
    cell_h = height / 4
    written = []

    for local_index, record in enumerate(selected):
        row = local_index // 4
        col = local_index % 4
        left = round(col * cell_w)
        top = round(row * cell_h)
        right = round((col + 1) * cell_w)
        bottom = round((row + 1) * cell_h)
        crop = sheet.crop((left, top, right, bottom))
        crop = trim_gutter(crop)
        crop = crop.resize((400, 400), Image.Resampling.LANCZOS)
        output = out_dir / f"{record['slug']}.png"
        crop.save(output, optimize=True)
        written.append(str(output))

    print(json.dumps({"written": len(written), "first": written[0], "last": written[-1]}, ensure_ascii=False))


def trim_gutter(image):
    width, height = image.size
    margin_x = max(3, round(width * 0.018))
    margin_y = max(3, round(height * 0.018))
    return image.crop((margin_x, margin_y, width - margin_x, height - margin_y))


if __name__ == "__main__":
    main()
