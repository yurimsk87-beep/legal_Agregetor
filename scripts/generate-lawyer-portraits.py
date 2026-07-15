import argparse
import hashlib
import json
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


CANVAS = 400
SCALE = 3
SIZE = CANVAS * SCALE
LOW_QUALITY_BYTES = 90_000

SKIN_TONES = [
    (236, 198, 171),
    (228, 184, 153),
    (246, 210, 184),
    (224, 178, 149),
    (239, 202, 176),
    (218, 170, 139),
]

HAIR_COLORS = [
    (43, 33, 29),
    (59, 43, 34),
    (76, 56, 42),
    (104, 77, 56),
    (135, 98, 64),
    (169, 132, 83),
    (91, 88, 84),
]

EYE_COLORS = [
    (40, 48, 55),
    (50, 63, 77),
    (54, 70, 59),
    (84, 62, 46),
]

DEFAULT_STYLE = {
    "suitColor": {"id": "navy", "hex": "#172033", "label": "navy suit"},
    "shirtColor": {"id": "white", "hex": "#F8F8F5", "label": "white shirt"},
    "tieOption": {"id": "dark-tie", "hex": "#222735", "label": "dark tie", "pattern": None},
    "background": {
        "id": "neutral-studio",
        "label": "neutral studio",
        "palette": ["#ECEDED", "#C7C9CA"],
        "accent": "clean seamless backdrop",
    },
    "pose": {"id": "frontal-portrait", "label": "frontal portrait", "crop": "head-and-shoulders"},
    "expression": {"id": "neutral-confident", "label": "neutral confident"},
    "visualStyle": {"id": "editorial-portrait", "label": "slightly illustrated editorial portrait style"},
}


def main():
    parser = argparse.ArgumentParser(description="Generate varied lawyer profile portraits from the style manifest.")
    parser.add_argument("--manifest", default="public/generated-lawyer-photos/manifest.json")
    parser.add_argument("--out-dir", default="public/generated-lawyer-photos")
    parser.add_argument(
        "--mode",
        choices=["replace-invalid", "missing", "all"],
        default="replace-invalid",
        help="Legacy procedural fallback mode. Prefer AI contact sheets plus crop-lawyer-photo-sheet.py.",
    )
    parser.add_argument(
        "--allow-procedural-fallback",
        action="store_true",
        help="Explicitly allow the legacy non-photorealistic fallback generator.",
    )
    args = parser.parse_args()

    if not args.allow_procedural_fallback:
        raise SystemExit(
            "This legacy procedural generator is disabled by default because it can produce flat/avatar-like portraits. "
            "Use realistic AI contact sheets and scripts/crop-lawyer-photo-sheet.py instead, or pass "
            "--allow-procedural-fallback for temporary local placeholders only."
        )

    manifest_path = Path(args.manifest)
    output_dir = Path(args.out_dir)
    records = json.loads(manifest_path.read_text(encoding="utf-8"))
    output_dir.mkdir(parents=True, exist_ok=True)

    generated = 0
    skipped = 0
    for record in records:
        output_path = output_dir / f"{record['slug']}.png"
        if should_skip(output_path, args.mode):
            skipped += 1
            continue

        image = create_portrait(record)
        image.save(output_path, optimize=False)
        generated += 1

    print(json.dumps({"generated": generated, "skipped": skipped, "output": str(output_dir)}, ensure_ascii=False))


def should_skip(path, mode):
    if mode == "all":
        return False
    if not path.exists():
        return False
    if mode == "missing":
        return True
    return path.stat().st_size >= LOW_QUALITY_BYTES


def create_portrait(record):
    rng = random.Random(stable_seed(record["slug"]))
    style = normalized_style(record)
    gender = record.get("gender", "male")

    image = Image.new("RGB", (SIZE, SIZE), parse_hex(style["background"]["palette"][0]))
    draw = ImageDraw.Draw(image)

    draw_background(image, draw, rng, style)
    pose = build_pose(rng, style)
    draw_body(draw, rng, gender, style, pose)
    draw_head(draw, rng, gender, style, pose)
    draw_foreground_depth(draw, rng, style, pose)
    draw_noise(image, rng, style)

    blur = 0.08 if style["visualStyle"]["id"] == "realistic-business-photo" else 0.12
    image = image.filter(ImageFilter.GaussianBlur(radius=blur * SCALE))
    return image.resize((CANVAS, CANVAS), Image.Resampling.LANCZOS)


def normalized_style(record):
    style = dict(DEFAULT_STYLE)
    style.update(record.get("style") or {})
    for key, fallback in DEFAULT_STYLE.items():
        if not style.get(key):
            style[key] = fallback
    return style


def build_pose(rng, style):
    pose_id = style["pose"]["id"]
    angle = {
        "frontal-portrait": 0,
        "three-quarter": rng.choice([-1, 1]) * rng.randint(6, 10),
        "seated-at-desk": rng.choice([-1, 1]) * rng.randint(2, 6),
        "standing-office": rng.choice([-1, 1]) * rng.randint(3, 8),
        "shoulders-up": rng.choice([-1, 1]) * rng.randint(0, 4),
    }.get(pose_id, 0)
    torso_y = {
        "seated-at-desk": 244,
        "standing-office": 258,
        "shoulders-up": 272,
    }.get(pose_id, rng.randint(255, 266))

    return {
        "x": 200 * SCALE + rng.randint(-8, 8) * SCALE,
        "angle": angle * SCALE,
        "head_y": rng.randint(150, 160) * SCALE,
        "torso_y": torso_y * SCALE,
        "shoulder_width": rng.randint(236, 272) * SCALE,
        "desk": pose_id == "seated-at-desk",
    }


def draw_background(image, draw, rng, style):
    palette = style["background"].get("palette") or DEFAULT_STYLE["background"]["palette"]
    top = parse_hex(palette[0])
    bottom = parse_hex(palette[1] if len(palette) > 1 else palette[0])
    for y in range(SIZE):
        t = y / SIZE
        color = tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        draw.line((0, y, SIZE, y), fill=color)

    accent = style["background"]["id"]
    if accent == "legal-library":
        draw_library(draw, rng, top, bottom)
    elif accent == "business-center":
        draw_business_center(draw, rng, top)
    elif accent == "meeting-room":
        draw_meeting_room(draw, rng, bottom)
    elif accent == "premium-office-dark":
        draw_premium_office(draw, rng)
    elif accent == "light-wall":
        draw_light_wall(draw, rng, top)
    else:
        draw_light_office(draw, rng, top)

    image.thumbnail((SIZE, SIZE))


def draw_light_office(draw, rng, top):
    for _ in range(5):
        x = rng.randint(-140, SIZE - 120)
        y = rng.randint(40, 460)
        w = rng.randint(180, 360)
        h = rng.randint(24, 58)
        color = lighten(top, rng.randint(10, 28))
        draw.rounded_rectangle((x, y, x + w, y + h), radius=12 * SCALE, fill=color)
    for x in range(rng.randint(-80, 60), SIZE, rng.randint(220, 290)):
        draw.line((x, 0, x + rng.randint(-25, 25), SIZE), fill=lighten(top, 18), width=2 * SCALE)


def draw_library(draw, rng, top, bottom):
    shelf_color = darken(bottom, 35)
    for row in range(4):
        y = (70 + row * 78) * SCALE + rng.randint(-6, 6) * SCALE
        draw.rounded_rectangle((18 * SCALE, y, 382 * SCALE, y + 46 * SCALE), radius=8 * SCALE, fill=blend(shelf_color, top, 0.22))
        for col in range(13):
            x = (30 + col * 27) * SCALE + rng.randint(-3, 3) * SCALE
            h = rng.randint(24, 42) * SCALE
            book = blend(pick(rng, [(91, 58, 45), (57, 65, 77), (94, 80, 58), (72, 45, 50)]), top, 0.16)
            draw.rounded_rectangle((x, y + 6 * SCALE, x + rng.randint(12, 18) * SCALE, y + 6 * SCALE + h), radius=2 * SCALE, fill=book)


def draw_business_center(draw, rng, top):
    glass = blend((141, 166, 181), top, 0.45)
    for x in range(-80 * SCALE, SIZE, 86 * SCALE):
        draw.polygon(
            [
                (x, 0),
                (x + rng.randint(22, 44) * SCALE, 0),
                (x + rng.randint(70, 95) * SCALE, SIZE),
                (x + rng.randint(38, 55) * SCALE, SIZE),
            ],
            fill=glass,
        )
        draw.line((x + 30 * SCALE, 0, x + 70 * SCALE, SIZE), fill=lighten(glass, 25), width=2 * SCALE)


def draw_meeting_room(draw, rng, bottom):
    table = darken(bottom, 28)
    draw.ellipse((-70 * SCALE, 302 * SCALE, 470 * SCALE, 460 * SCALE), fill=blend(table, (255, 255, 255), 0.22))
    for _ in range(5):
        x = rng.randint(28, 310) * SCALE
        y = rng.randint(96, 188) * SCALE
        draw.rounded_rectangle((x, y, x + rng.randint(44, 78) * SCALE, y + rng.randint(26, 48) * SCALE), radius=8 * SCALE, fill=lighten(bottom, rng.randint(8, 24)))


def draw_premium_office(draw, rng):
    for _ in range(8):
        x = rng.randint(0, SIZE)
        y = rng.randint(20, 330) * SCALE // SCALE
        radius = rng.randint(18, 54) * SCALE
        color = rng.choice([(63, 72, 87), (92, 78, 57), (42, 50, 61)])
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)
    draw.rectangle((0, 310 * SCALE, SIZE, SIZE), fill=(24, 26, 30))


def draw_light_wall(draw, rng, top):
    for _ in range(28):
        x = rng.randint(0, SIZE)
        y = rng.randint(0, SIZE)
        color = darken(top, rng.randint(1, 7))
        draw.point((x, y), fill=color)
    draw.line((0, 290 * SCALE, SIZE, 288 * SCALE), fill=darken(top, 16), width=1 * SCALE)


def draw_body(draw, rng, gender, style, pose):
    suit = parse_hex(style["suitColor"].get("hex") or DEFAULT_STYLE["suitColor"]["hex"])
    shirt = parse_hex(style["shirtColor"].get("hex") or DEFAULT_STYLE["shirtColor"]["hex"])
    tie_hex = style["tieOption"].get("hex")

    cx = pose["x"]
    angle = pose["angle"]
    shoulder_y = pose["torso_y"]
    shoulder_half = pose["shoulder_width"] // 2
    waist_y = 398 * SCALE

    shadow = (0, 0, 0)
    draw.ellipse((cx - shoulder_half - 10 * SCALE, shoulder_y + 84 * SCALE, cx + shoulder_half + 10 * SCALE, waist_y + 20 * SCALE), fill=blend(shadow, suit, 0.82))

    draw.polygon(
        [
            (cx - shoulder_half, waist_y),
            (cx - 88 * SCALE + angle, shoulder_y),
            (cx - 10 * SCALE + angle // 2, 236 * SCALE),
            (cx + 88 * SCALE + angle, shoulder_y),
            (cx + shoulder_half, waist_y),
        ],
        fill=suit,
    )
    add_fabric_texture(draw, rng, suit, cx, shoulder_y, shoulder_half)

    shirt_left = cx - 43 * SCALE + angle // 3
    shirt_right = cx + 43 * SCALE + angle // 3
    draw.polygon(
        [
            (shirt_left, waist_y),
            (cx - 24 * SCALE + angle // 3, 246 * SCALE),
            (cx + 24 * SCALE + angle // 3, 246 * SCALE),
            (shirt_right, waist_y),
        ],
        fill=shirt,
    )
    draw.polygon(
        [(cx - 24 * SCALE + angle // 3, 246 * SCALE), (cx - 82 * SCALE + angle, shoulder_y), (cx - 42 * SCALE, 346 * SCALE)],
        fill=darken(suit, 18),
    )
    draw.polygon(
        [(cx + 24 * SCALE + angle // 3, 246 * SCALE), (cx + 82 * SCALE + angle, shoulder_y), (cx + 42 * SCALE, 346 * SCALE)],
        fill=darken(suit, 18),
    )
    draw.line((cx - 2 * SCALE, 252 * SCALE, cx - 2 * SCALE, waist_y), fill=darken(shirt, 12), width=1 * SCALE)

    if tie_hex:
        tie = parse_hex(tie_hex)
        draw_tie(draw, rng, cx + angle // 4, tie, style["tieOption"].get("pattern"))
    else:
        collar_shadow = darken(shirt, 22)
        draw.polygon([(cx - 24 * SCALE, 247 * SCALE), (cx - 4 * SCALE, 274 * SCALE), (cx - 42 * SCALE, 266 * SCALE)], fill=lighten(shirt, 6))
        draw.polygon([(cx + 24 * SCALE, 247 * SCALE), (cx + 4 * SCALE, 274 * SCALE), (cx + 42 * SCALE, 266 * SCALE)], fill=lighten(shirt, 6))
        draw.line((cx - 6 * SCALE, 276 * SCALE, cx + 6 * SCALE, 276 * SCALE), fill=collar_shadow, width=1 * SCALE)

    if gender == "female" and not tie_hex:
        draw.ellipse((cx - 31 * SCALE, 247 * SCALE, cx + 31 * SCALE, 314 * SCALE), fill=blend(shirt, (230, 226, 224), 0.35))

    if pose["desk"]:
        desk = (92, 74, 59) if style["background"]["id"] != "premium-office-dark" else (45, 38, 34)
        draw.rectangle((0, 343 * SCALE, SIZE, SIZE), fill=desk)
        draw.rectangle((0, 343 * SCALE, SIZE, 352 * SCALE), fill=lighten(desk, 28))


def add_fabric_texture(draw, rng, suit, cx, shoulder_y, shoulder_half):
    for _ in range(34):
        y = rng.randint(max(0, shoulder_y - 10 * SCALE), SIZE)
        x0 = cx - shoulder_half + rng.randint(0, 28) * SCALE
        x1 = cx + shoulder_half - rng.randint(0, 28) * SCALE
        color = lighten(suit, rng.randint(5, 16)) if rng.random() < 0.45 else darken(suit, rng.randint(3, 12))
        draw.line((x0, y, x1, y + rng.randint(-2, 2) * SCALE), fill=color, width=1)
    for _ in range(16):
        x = cx - shoulder_half + rng.randint(0, shoulder_half * 2)
        draw.line((x, shoulder_y, x + rng.randint(-10, 10) * SCALE, SIZE), fill=lighten(suit, 10), width=1)


def draw_tie(draw, rng, cx, tie, pattern):
    draw.polygon(
        [
            (cx - 14 * SCALE, 258 * SCALE),
            (cx + 14 * SCALE, 258 * SCALE),
            (cx + 20 * SCALE, 378 * SCALE),
            (cx, 397 * SCALE),
            (cx - 20 * SCALE, 378 * SCALE),
        ],
        fill=tie,
    )
    draw.polygon([(cx - 16 * SCALE, 256 * SCALE), (cx + 16 * SCALE, 256 * SCALE), (cx + 8 * SCALE, 278 * SCALE), (cx - 8 * SCALE, 278 * SCALE)], fill=lighten(tie, 10))
    if pattern:
        for offset in range(-70, 110, 22):
            draw.line((cx - 26 * SCALE, (280 + offset) * SCALE, cx + 26 * SCALE, (250 + offset) * SCALE), fill=lighten(tie, 42), width=1 * SCALE)


def draw_head(draw, rng, gender, style, pose):
    skin = pick(rng, SKIN_TONES)
    hair = pick(rng, HAIR_COLORS)
    cx = pose["x"] + pose["angle"] // 2
    cy = pose["head_y"]
    face_w = rng.randint(92, 108) * SCALE
    face_h = rng.randint(126, 146) * SCALE
    jaw_taper = rng.randint(8, 18) * SCALE
    angle = pose["angle"]

    neck_w = rng.randint(38, 48) * SCALE
    draw.rounded_rectangle(
        (cx - neck_w // 2, cy + 46 * SCALE, cx + neck_w // 2, cy + 110 * SCALE),
        radius=14 * SCALE,
        fill=darken(skin, 10),
    )
    draw_hair_base(draw, rng, gender, cx, cy, face_w, face_h, hair)

    face_points = [
        (cx - face_w // 2 + angle // 5, cy - face_h // 2 + 12 * SCALE),
        (cx + face_w // 2 + angle // 5, cy - face_h // 2 + 12 * SCALE),
        (cx + face_w // 2 - jaw_taper + angle // 7, cy + face_h // 2 - 24 * SCALE),
        (cx + 22 * SCALE + angle // 12, cy + face_h // 2 + 8 * SCALE),
        (cx, cy + face_h // 2 + 15 * SCALE),
        (cx - 22 * SCALE + angle // 12, cy + face_h // 2 + 8 * SCALE),
        (cx - face_w // 2 + jaw_taper + angle // 7, cy + face_h // 2 - 24 * SCALE),
    ]
    draw.polygon(face_points, fill=skin)
    draw.ellipse((cx - face_w // 2 + angle // 5, cy - face_h // 2, cx + face_w // 2 + angle // 5, cy + face_h // 2), fill=skin)

    shade = blend(skin, (112, 82, 70), 0.22)
    highlight = lighten(skin, 18)
    draw.pieslice((cx - face_w // 2 + 8 * SCALE, cy - face_h // 2 + 10 * SCALE, cx + face_w // 2 + 12 * SCALE, cy + face_h // 2), 270, 90, fill=blend(skin, shade, 0.18))
    draw.arc((cx - face_w // 2 + 8 * SCALE, cy - face_h // 2 + 8 * SCALE, cx + face_w // 2 - 5 * SCALE, cy + face_h // 2), 215, 325, fill=highlight, width=1 * SCALE)

    add_skin_texture(draw, rng, cx, cy, face_w, face_h, skin)
    draw_hairline(draw, rng, gender, cx, cy, face_w, face_h, hair, angle)
    draw_features(draw, rng, cx, cy, face_w, face_h, skin, hair, gender, style, angle)


def draw_hair_base(draw, rng, gender, cx, cy, face_w, face_h, hair):
    top = cy - face_h // 2
    if gender == "female":
        hair_len = rng.randint(86, 122) * SCALE
        draw.rounded_rectangle(
            (cx - face_w // 2 - 25 * SCALE, top - 18 * SCALE, cx + face_w // 2 + 25 * SCALE, top + hair_len),
            radius=48 * SCALE,
            fill=darken(hair, 4),
        )
        draw.ellipse((cx - face_w // 2 - 22 * SCALE, top - 26 * SCALE, cx + face_w // 2 + 22 * SCALE, top + 72 * SCALE), fill=hair)
    else:
        draw.ellipse((cx - face_w // 2 - 9 * SCALE, top - 22 * SCALE, cx + face_w // 2 + 9 * SCALE, top + 62 * SCALE), fill=hair)


def draw_hairline(draw, rng, gender, cx, cy, face_w, face_h, hair, angle):
    top = cy - face_h // 2
    left = cx - face_w // 2
    right = cx + face_w // 2
    if gender == "female":
        side = rng.choice([-1, 1])
        part = cx + side * rng.randint(8, 18) * SCALE
        fringe_color = lighten(hair, 8)
        draw.pieslice((left - 4 * SCALE, top - 22 * SCALE, right + 5 * SCALE, top + 78 * SCALE), 190, 350, fill=hair)
        draw.line((part, top + 5 * SCALE, part - side * 18 * SCALE + angle // 8, top + 50 * SCALE), fill=lighten(hair, 26), width=1 * SCALE)
        for strand in range(14):
            t = strand / 13
            sx = left + int(t * (right - left))
            sy = top + rng.randint(5, 18) * SCALE
            ex = sx + side * rng.randint(-8, 14) * SCALE
            ey = top + rng.randint(44, 72) * SCALE
            color = lighten(fringe_color, rng.randint(-8, 10))
            draw.line((sx, sy, ex, ey), fill=color, width=1 * SCALE)
        for side_lock in (-1, 1):
            x = cx + side_lock * (face_w // 2 - rng.randint(0, 8) * SCALE)
            draw.rounded_rectangle(
                (x - 10 * SCALE, top + 30 * SCALE, x + 11 * SCALE, cy + 76 * SCALE),
                radius=12 * SCALE,
                fill=darken(hair, rng.randint(0, 10)),
            )
    else:
        draw.pieslice((left - 4 * SCALE, top - 18 * SCALE, right + 4 * SCALE, top + 68 * SCALE), 185, 356, fill=hair)
        draw.rectangle((left + 8 * SCALE, top + 17 * SCALE, right - 8 * SCALE, top + 42 * SCALE), fill=hair)
        for _ in range(14):
            x = rng.randint(left + 5 * SCALE, right - 5 * SCALE)
            y = rng.randint(top - 5 * SCALE, top + 35 * SCALE)
            draw.line((x, y, x + rng.randint(-14, 14) * SCALE, y + rng.randint(4, 13) * SCALE), fill=lighten(hair, rng.randint(5, 18)), width=1 * SCALE)


def add_skin_texture(draw, rng, cx, cy, face_w, face_h, skin):
    for _ in range(120):
        x = cx + rng.randint(-face_w // 3, face_w // 3)
        y = cy + rng.randint(-face_h // 3, face_h // 3)
        amount = rng.randint(-6, 8)
        draw.point((x, y), fill=lighten(skin, amount) if amount >= 0 else darken(skin, -amount))

    cheek = blend(skin, (190, 112, 104), 0.18)
    draw.ellipse((cx - 44 * SCALE, cy + 10 * SCALE, cx - 14 * SCALE, cy + 40 * SCALE), fill=blend(skin, cheek, 0.22))
    draw.ellipse((cx + 14 * SCALE, cy + 10 * SCALE, cx + 44 * SCALE, cy + 40 * SCALE), fill=blend(skin, cheek, 0.18))


def draw_features(draw, rng, cx, cy, face_w, face_h, skin, hair, gender, style, angle):
    eye_y = cy - 12 * SCALE + rng.randint(-2, 2) * SCALE
    eye_dx = rng.randint(22, 27) * SCALE
    eye_color = pick(rng, EYE_COLORS)
    for side in (-1, 1):
        ex = cx + side * eye_dx + angle // 10
        eyelid = darken(skin, 24)
        draw.arc((ex - 12 * SCALE, eye_y - 7 * SCALE, ex + 12 * SCALE, eye_y + 8 * SCALE), 190, 350, fill=eyelid, width=1 * SCALE)
        draw.ellipse((ex - 4 * SCALE, eye_y - 2 * SCALE, ex + 5 * SCALE, eye_y + 4 * SCALE), fill=eye_color)
        draw.point((ex + 1 * SCALE, eye_y - 1 * SCALE), fill=(238, 238, 232))
        brow_y = eye_y - 13 * SCALE
        draw.line((ex - 14 * SCALE, brow_y, ex + 12 * SCALE, brow_y - rng.randint(0, 2) * SCALE), fill=darken(hair, 8), width=2 * SCALE)

    nose = darken(skin, 20)
    draw.line((cx + angle // 12, eye_y + 8 * SCALE, cx - 4 * SCALE + angle // 10, cy + 23 * SCALE), fill=nose, width=1 * SCALE)
    draw.arc((cx - 8 * SCALE + angle // 10, cy + 24 * SCALE, cx + 11 * SCALE + angle // 10, cy + 38 * SCALE), 200, 355, fill=darken(skin, 12), width=1 * SCALE)
    draw.point((cx - 5 * SCALE, cy + 32 * SCALE), fill=darken(skin, 24))
    draw.point((cx + 7 * SCALE, cy + 32 * SCALE), fill=darken(skin, 24))

    mouth_y = cy + 49 * SCALE
    mouth = (128, 64, 67) if gender == "female" and rng.random() < 0.5 else (108, 64, 59)
    expression = style["expression"]["id"]
    if expression in {"slight-smile", "approachable-formal"}:
        draw.arc((cx - 21 * SCALE, mouth_y - 9 * SCALE, cx + 21 * SCALE, mouth_y + 10 * SCALE), 16, 164, fill=mouth, width=2 * SCALE)
    elif expression == "serious-professional":
        draw.line((cx - 17 * SCALE, mouth_y + 1 * SCALE, cx + 17 * SCALE, mouth_y), fill=mouth, width=2 * SCALE)
    else:
        draw.arc((cx - 18 * SCALE, mouth_y - 6 * SCALE, cx + 18 * SCALE, mouth_y + 8 * SCALE), 25, 155, fill=mouth, width=2 * SCALE)

    if gender == "male" and rng.random() < 0.42:
        stubble = blend(darken(skin, 36), hair, 0.22)
        draw.arc((cx - 36 * SCALE, cy + 25 * SCALE, cx + 36 * SCALE, cy + 80 * SCALE), 20, 160, fill=stubble, width=2 * SCALE)
        for _ in range(60):
            x = cx + rng.randint(-31, 31) * SCALE
            y = cy + rng.randint(28, 70) * SCALE
            draw.point((x, y), fill=stubble)

    if rng.random() < 0.22:
        frame = (39, 44, 51)
        for side in (-1, 1):
            ex = cx + side * eye_dx + angle // 10
            draw.rounded_rectangle((ex - 16 * SCALE, eye_y - 10 * SCALE, ex + 16 * SCALE, eye_y + 9 * SCALE), radius=5 * SCALE, outline=frame, width=2 * SCALE)
        draw.line((cx - eye_dx + 16 * SCALE, eye_y, cx + eye_dx - 16 * SCALE, eye_y), fill=frame, width=2 * SCALE)


def draw_foreground_depth(draw, rng, style, pose):
    if style["background"]["id"] == "premium-office-dark":
        draw.rectangle((0, 0, SIZE, 18 * SCALE), fill=(20, 22, 27))
    if pose["desk"]:
        for _ in range(3):
            x = rng.randint(30, 330) * SCALE
            draw.rounded_rectangle((x, 352 * SCALE, x + rng.randint(42, 82) * SCALE, 362 * SCALE), radius=3 * SCALE, fill=(210, 206, 198))


def draw_noise(image, rng, style):
    pixels = image.load()
    amount = 120_000 if style["visualStyle"]["id"] == "realistic-business-photo" else 96_000
    spread = 5 if style["visualStyle"]["id"] != "editorial-portrait" else 6
    for _ in range(amount):
        x = rng.randrange(SIZE)
        y = rng.randrange(SIZE)
        r, g, b = pixels[x, y]
        delta = rng.randint(-spread, spread)
        pixels[x, y] = (clamp(r + delta), clamp(g + delta), clamp(b + delta))


def stable_seed(value):
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()
    return int(digest[:16], 16)


def parse_hex(value):
    value = value.strip().lstrip("#")
    return tuple(int(value[index : index + 2], 16) for index in (0, 2, 4))


def pick(rng, values):
    return values[rng.randrange(len(values))]


def darken(color, amount):
    return tuple(clamp(channel - amount) for channel in color)


def lighten(color, amount):
    return tuple(clamp(channel + amount) for channel in color)


def blend(a, b, amount):
    return tuple(clamp(a[index] * (1 - amount) + b[index] * amount) for index in range(3))


def clamp(value):
    return max(0, min(255, int(value)))


if __name__ == "__main__":
    main()
