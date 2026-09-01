from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "ads" / "source"
OUT = ROOT / "ads" / "video" / "campaign-frames"
INTERACTIVE = ROOT / "screenshots" / "interactive"
W, H = 1080, 1920

NAVY = "#071A33"
NAVY_2 = "#0F2D4D"
CREAM = "#F7F3EA"
GOLD = "#C5A25D"
GOLD_LIGHT = "#E3CB91"
WHITE = "#FFFFFF"
MUTED = "#AFC0D1"
INK = "#17283B"


def font(size, bold=False):
    candidates = [
        Path("C:/Windows/Fonts/seguisb.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default(size=size)


F_EYEBROW = font(25, True)
F_H1 = font(72, True)
F_H1_BIG = font(82, True)
F_BODY = font(35)
F_BODY_SM = font(28)
F_CHIP = font(24, True)
F_URL = font(25, True)


def gradient(top=NAVY, bottom=NAVY_2):
    a = Image.new("RGB", (W, H), top)
    draw = ImageDraw.Draw(a)
    top_rgb = tuple(int(top[i:i + 2], 16) for i in (1, 3, 5))
    bottom_rgb = tuple(int(bottom[i:i + 2], 16) for i in (1, 3, 5))
    for y in range(H):
        t = y / (H - 1)
        color = tuple(round(top_rgb[i] * (1 - t) + bottom_rgb[i] * t) for i in range(3))
        draw.line((0, y, W, y), fill=color)
    for x in range(-H, W, 170):
        draw.line((x, 0, x + H, H), fill=(255, 255, 255, 10), width=1)
    return a


def wrap(draw, text, face, max_width):
    lines = []
    for paragraph in text.split("\n"):
        words = paragraph.split()
        current = ""
        for word in words:
            candidate = f"{current} {word}".strip()
            if draw.textbbox((0, 0), candidate, font=face)[2] <= max_width:
                current = candidate
            else:
                if current:
                    lines.append(current)
                current = word
        lines.append(current)
    return lines


def text_block(draw, xy, text, face, fill, max_width, spacing=12):
    x, y = xy
    for line in wrap(draw, text, face, max_width):
        draw.text((x, y), line, font=face, fill=fill)
        y += draw.textbbox((x, y), line or "Ag", font=face)[3] - y + spacing
    return y


def brand_header(draw, audience, index, total):
    draw.rounded_rectangle((72, 66, 370, 120), radius=27, fill=GOLD)
    draw.text((96, 78), "CAPITAL MASTERY", font=F_EYEBROW, fill=NAVY)
    draw.text((72, 150), audience.upper(), font=F_EYEBROW, fill=GOLD_LIGHT)
    draw.text((1008, 78), f"{index:02d} / {total:02d}", anchor="ra", font=F_EYEBROW, fill=MUTED)


def footer(draw, index, total, cta=False):
    if cta:
        draw.text((72, 1782), "sribyju.github.io/CapitalMastery", font=F_URL, fill=WHITE)
    else:
        draw.text((72, 1782), "REAL PRODUCT UI  ·  SYNTHETIC CASE DATA", font=F_URL, fill=MUTED)
    gap = 13
    dot_w = (936 - gap * (total - 1)) / total
    y = 1845
    for i in range(total):
        x = 72 + i * (dot_w + gap)
        draw.rounded_rectangle((x, y, x + dot_w, y + 8), radius=4, fill=GOLD if i < index else "#38516B")


def screenshot_card(canvas, path, box):
    x1, y1, x2, y2 = box
    card_w, card_h = x2 - x1, y2 - y1
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x1 + 12, y1 + 18, x2 + 12, y2 + 18), radius=34, fill=(0, 0, 0, 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(17))
    canvas.paste(shadow, (0, 0), shadow)

    card = Image.new("RGBA", (card_w, card_h), WHITE)
    source = Image.open(path).convert("RGB")
    inside = ImageOps.contain(source, (card_w - 34, card_h - 34), Image.Resampling.LANCZOS)
    px = (card_w - inside.width) // 2
    py = (card_h - inside.height) // 2
    card.paste(inside, (px, py))
    mask = Image.new("L", (card_w, card_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, card_w, card_h), radius=30, fill=255)
    canvas.paste(card, (x1, y1), mask)
    ImageDraw.Draw(canvas).rounded_rectangle(box, radius=30, outline="#DAE2E9", width=3)


def source_asset(name):
    primary = SOURCE / name
    return primary if primary.exists() else INTERACTIVE / name


def chips(draw, labels, y):
    x = 72
    for label in labels:
        width = draw.textbbox((0, 0), label, font=F_CHIP)[2] + 48
        if x + width > W - 72:
            x = 72
            y += 68
        draw.rounded_rectangle((x, y, x + width, y + 49), radius=25, fill="#173B5E", outline="#466580", width=2)
        draw.text((x + 24, y + 11), label, font=F_CHIP, fill=WHITE)
        x += width + 14


def product_frame(audience, index, total, title, body, image_name, labels=()):
    canvas = gradient()
    draw = ImageDraw.Draw(canvas)
    brand_header(draw, audience, index, total)
    y = text_block(draw, (72, 225), title, F_H1, WHITE, 936, 11)
    y = text_block(draw, (72, y + 24), body, F_BODY, MUTED, 900, 10)
    if labels:
        chips(draw, labels, y + 25)
        card_y = y + 118
    else:
        card_y = y + 45
    screenshot_card(canvas, source_asset(image_name), (72, card_y, 1008, 1685))
    footer(draw, index, total)
    return canvas


def statement_frame(audience, index, total, title, body, labels=(), cta=False):
    canvas = gradient(NAVY, "#123D63")
    draw = ImageDraw.Draw(canvas)
    brand_header(draw, audience, index, total)
    draw.ellipse((675, 260, 1160, 745), fill="#143C5E", outline="#244E70", width=3)
    draw.ellipse((770, 355, 1065, 650), outline=GOLD, width=5)
    draw.text((917, 502), "CM", anchor="mm", font=font(86, True), fill=WHITE)
    y = text_block(draw, (72, 800), title, F_H1_BIG, WHITE, 936, 16)
    y = text_block(draw, (72, y + 30), body, F_BODY, MUTED, 900, 12)
    if labels:
        chips(draw, labels, y + 50)
    footer(draw, index, total, cta=cta)
    return canvas


def save_campaign(name, audience, scenes):
    directory = OUT / name
    directory.mkdir(parents=True, exist_ok=True)
    total = len(scenes)
    for index, scene in enumerate(scenes, 1):
        kind, title, body, image_name, labels, cta = scene
        if kind == "product":
            frame = product_frame(audience, index, total, title, body, image_name, labels)
        else:
            frame = statement_frame(audience, index, total, title, body, labels, cta)
        frame.save(directory / f"{index:02d}.png", optimize=True)


EMPLOYER = [
    ("statement", "Training completed.\nCan the analyst do the work?", "Give managers evidence before Day 1—not another completion badge.", None, ("WORK OUTPUTS", "REVISION HISTORY", "MANAGER REVIEW"), False),
    ("product", "Assign the exact readiness path.", "Choose the role, deadline and competency standard.", "assigned-readiness-path.png", ("GUIDED SETUP", "ROLE-SPECIFIC"), False),
    ("product", "Review the work—not a self-report.", "Inspect the evidence, rubric decisions and reviewer-ready output.", "manager-evidence-review.png", ("EVIDENCE REVIEW", "CLEAR DECISIONS"), False),
    ("product", "Make feedback part of training.", "Accept, return or request revision with a recorded rationale.", "manager-review-recorded.png", ("REVISION LOOP", "MANAGER CONTEXT"), False),
    ("product", "See readiness by competency.", "Technical, judgment and communication evidence in one report.", "employer-readiness-report.png", ("READINESS", "COMPETENCY EVIDENCE"), False),
    ("product", "Keep the audit trail.", "Assignment changes, reviews and outcomes remain traceable.", "employer-audit-log.png", ("TRACEABLE", "ROLE-BASED"), False),
    ("statement", "Prepare finance talent before Day 1.", "A practical readiness layer for finance teams—free for employers.", None, ("16 FINANCE CAREERS", "NO SEAT FEE", "START FREE"), True),
]

LEARNER = [
    ("statement", "Don't just finish a finance course.\nFinish the work.", "Learn the role, complete realistic outputs and prove what you can do.", None, ("LEARN", "PRACTICE", "PROVE"), False),
    ("product", "Learn inside the workflow.", "Guided tasks show what the file is, why it matters and what to produce.", "treasury-applied-work.png", ("GUIDED WORK", "REAL OUTPUTS"), False),
    ("product", "Use source data. Calculate. Explain.", "Professional assessments combine analysis and written judgment—not answer-picking.", "treasury-mixed-assessment-written.png", ("SOURCE DATA", "SERVER-GRADED"), False),
    ("product", "Handle the live update.", "Adapt your work when new information changes the decision.", "learner-role-lab-complete.png", ("ROLE LAB", "CHANGE CONTROL"), False),
    ("product", "Get reviewed. Revise. Improve.", "Manager feedback connects directly to the evidence and readiness record.", "learner-review-linked-readiness.png", ("FEEDBACK", "REVISION HISTORY"), False),
    ("product", "Prove what you can do.", "Build evidence across technical skill, judgment and communication.", "learner-readiness-report.png", ("COMPETENCIES", "VERIFIABLE EVIDENCE"), False),
    ("statement", "16 finance careers.\nStart free.", "Capital Mastery turns learning into practical, reviewable work.", None, ("NO PAYWALL", "REAL WORK", "START FREE"), True),
]


if __name__ == "__main__":
    save_campaign("employer-readiness", "For finance teams", EMPLOYER)
    save_campaign("learner-work", "For learners", LEARNER)
    print(f"Created {len(EMPLOYER) + len(LEARNER)} campaign frames in {OUT}")
