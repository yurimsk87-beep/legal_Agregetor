import argparse
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


REQUIRED_HEADERS = {
    "Описание": "description",
    "Образование": "education",
    "Специализация": "specialization",
    "Услуги и стоимость": "servicesAndPrices",
    "Отзывы": "reviews",
}

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkgrel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def main():
    parser = argparse.ArgumentParser(description="Extract selected Harant columns from an XLSX file to JSON.")
    parser.add_argument("input", help="Path to harant_500_lawyers.xlsx")
    parser.add_argument("output", help="Path to the JSON file to create")
    args = parser.parse_args()

    rows = read_xlsx_rows(Path(args.input))
    if not rows:
        raise SystemExit("Workbook has no rows.")

    headers = rows[0]
    indexes = {}
    for header, field in REQUIRED_HEADERS.items():
        try:
            indexes[field] = headers.index(header)
        except ValueError as exc:
            raise SystemExit(f"Required column not found: {header}") from exc

    records = []
    for row in rows[1:]:
        record = {}
        for field, index in indexes.items():
            record[field] = clean_cell(row[index] if index < len(row) else "")
        if any(record.values()):
            records.append(record)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"rows": len(records), "output": str(output_path)}, ensure_ascii=False))


def read_xlsx_rows(path):
    with zipfile.ZipFile(path) as archive:
        shared_strings = read_shared_strings(archive)
        sheet_path = get_first_sheet_path(archive)
        sheet = ET.fromstring(archive.read(sheet_path))
        result = []

        for row_node in sheet.findall(".//main:sheetData/main:row", NS):
            row_values = []
            for cell in row_node.findall("main:c", NS):
                column_index = column_to_index(cell.get("r", "A1"))
                while len(row_values) <= column_index:
                    row_values.append("")
                row_values[column_index] = read_cell_value(cell, shared_strings)
            result.append(row_values)

        return result


def read_shared_strings(archive):
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []

    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    strings = []
    for item in root.findall("main:si", NS):
        parts = [node.text or "" for node in item.findall(".//main:t", NS)]
        strings.append("".join(parts))
    return strings


def get_first_sheet_path(archive):
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    first_sheet = workbook.find(".//main:sheets/main:sheet", NS)
    if first_sheet is None:
        raise SystemExit("Workbook has no sheets.")

    relation_id = first_sheet.get(f"{{{NS['rel']}}}id")
    for rel in rels.findall("pkgrel:Relationship", NS):
        if rel.get("Id") == relation_id:
            target = rel.get("Target", "").lstrip("/")
            return target if target.startswith("xl/") else "xl/" + target

    raise SystemExit("Could not find the first worksheet relationship.")


def read_cell_value(cell, shared_strings):
    cell_type = cell.get("t")
    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.findall(".//main:is/main:t", NS))

    value_node = cell.find("main:v", NS)
    if value_node is None:
        return ""

    value = value_node.text or ""
    if cell_type == "s":
        try:
            return shared_strings[int(value)]
        except (ValueError, IndexError):
            return ""
    return value


def column_to_index(cell_ref):
    letters = re.sub(r"[^A-Z]", "", cell_ref.upper())
    index = 0
    for letter in letters:
        index = index * 26 + (ord(letter) - ord("A") + 1)
    return max(index - 1, 0)


def clean_cell(value):
    if value is None:
        return None
    text = str(value).replace("\r\n", "\n").replace("\r", "\n").replace("\xa0", " ").strip()
    text = "\n".join(re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n"))
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text or None


if __name__ == "__main__":
    main()
