"""Render true-motion Capital Mastery vertical ads.

The older campaign cuts are intentionally preserved as product-screenshot ads.
This renderer creates new motion-graphics masters from drawn interface elements:
kinetic type, live calculations, moving workpapers, review decisions, readiness
bars, evidence links and audit events. No screenshot is used as a scene plate.
"""

from __future__ import annotations

import math
import shutil
import subprocess
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
VIDEO_DIR = ROOT / "ads" / "video"
W, H = 720, 1280
FPS = 30
SCENE_SECONDS = 2.5
SCENES = 6
FRAMES = int(FPS * SCENE_SECONDS * SCENES)

NAVY = (5, 20, 39)
NAVY_2 = (11, 43, 72)
PANEL = (17, 49, 79)
PANEL_2 = (23, 61, 95)
GOLD = (205, 166, 91)
GOLD_2 = (238, 212, 150)
WHITE = (250, 252, 255)
MUTED = (171, 192, 211)
GREEN = (82, 195, 139)
BLUE = (78, 157, 226)
RED = (225, 105, 105)


@lru_cache(maxsize=None)
def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    names = [
        "C:/Windows/Fonts/seguisb.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for name in names:
        if Path(name).exists():
            return ImageFont.truetype(name, size=size)
    return ImageFont.load_default(size=size)


def clamp(value: float, low: float = 0, high: float = 1) -> float:
    return max(low, min(high, value))


def ease(value: float) -> float:
    value = clamp(value)
    return 1 - (1 - value) ** 3


def smooth(value: float) -> float:
    value = clamp(value)
    return value * value * (3 - 2 * value)


def lerp(start: float, end: float, progress: float) -> float:
    return start + (end - start) * progress


def rgba(color, alpha=255):
    return (*color[:3], int(clamp(alpha, 0, 255)))


def base_gradient() -> Image.Image:
    image = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(image)
    for y in range(H):
        p = y / (H - 1)
        color = tuple(int(lerp(NAVY[i], NAVY_2[i], p)) for i in range(3))
        draw.line((0, y, W, y), fill=color)
    return image


BASE = base_gradient()


def background(frame: int) -> Image.Image:
    image = BASE.copy().convert("RGBA")
    draw = ImageDraw.Draw(image, "RGBA")
    phase = frame / FPS
    for index, color in enumerate((GOLD, BLUE, GREEN)):
        x = int((phase * (18 + index * 7) + index * 250) % (W + 360) - 180)
        y = 260 + index * 280 + int(math.sin(phase * 0.8 + index) * 70)
        radius = 210 - index * 18
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=rgba(color, 10))
    offset = int((phase * 22) % 120)
    for x in range(-H, W + H, 120):
        draw.line((x + offset, 0, x - H + offset, H), fill=(255, 255, 255, 8), width=1)
    return image


def rounded(draw, box, fill=PANEL, outline=None, width=1, radius=18):
    draw.rounded_rectangle(tuple(int(v) for v in box), radius=radius, fill=fill, outline=outline, width=width)


def wrap(draw: ImageDraw.ImageDraw, text: str, face, max_width: int):
    lines = []
    for paragraph in text.split("\n"):
        words = paragraph.split()
        line = ""
        for word in words:
            candidate = f"{line} {word}".strip()
            if draw.textbbox((0, 0), candidate, font=face)[2] <= max_width:
                line = candidate
            else:
                if line:
                    lines.append(line)
                line = word
        lines.append(line)
    return lines


def text_block(draw, x, y, text, face, fill, max_width, spacing=8, anchor=None):
    for line in wrap(draw, text, face, max_width):
        draw.text((x, y), line, font=face, fill=fill, anchor=anchor)
        height = draw.textbbox((0, 0), line or "Ag", font=face)[3]
        y += height + spacing
    return y


def header(draw, audience: str, global_progress: float):
    rounded(draw, (46, 38, 251, 76), fill=GOLD, radius=19)
    draw.text((60, 49), "CAPITAL MASTERY", font=font(16, True), fill=NAVY)
    draw.text((674, 48), audience.upper(), font=font(14, True), fill=MUTED, anchor="ra")
    draw.rounded_rectangle((46, 100, 674, 106), radius=3, fill=(49, 75, 100))
    draw.rounded_rectangle((46, 100, 46 + int(628 * global_progress), 106), radius=3, fill=GOLD)


def caption(draw, eyebrow, title, body, progress):
    enter = ease(progress / 0.34)
    x = int(lerp(92, 46, enter))
    draw.text((x, 138), eyebrow.upper(), font=font(15, True), fill=GOLD_2)
    y = text_block(draw, x, 175, title, font(42, True), WHITE, 628, 4)
    text_block(draw, x, y + 14, body, font(21), MUTED, 615, 7)


def draw_check(draw, center, radius, progress, color=GREEN):
    x, y = center
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), outline=rgba(color, 210), width=5)
    p = ease(progress)
    points = [(x - radius * .48, y), (x - radius * .10, y + radius * .35), (x + radius * .55, y - radius * .38)]
    if p < .45:
        q = p / .45
        end = (lerp(points[0][0], points[1][0], q), lerp(points[0][1], points[1][1], q))
        draw.line((points[0], end), fill=color, width=7)
    else:
        draw.line((points[0], points[1]), fill=color, width=7)
        q = (p - .45) / .55
        end = (lerp(points[1][0], points[2][0], q), lerp(points[1][1], points[2][1], q))
        draw.line((points[1], end), fill=color, width=7)


def hook_scene(draw, p, employer=False):
    caption(
        draw,
        "The readiness question",
        "Training completed.\nCan they do the work?" if employer else "Course complete.\nNow prove the work.",
        "Move beyond completion badges into observable, reviewable finance work.",
        p,
    )
    y = int(lerp(1000, 735, ease((p - .18) / .42)))
    rounded(draw, (46, y, 674, y + 188), fill=(13, 40, 67), outline=(57, 88, 116), width=2, radius=24)
    draw_check(draw, (112, y + 62), 26, (p - .38) / .30)
    draw.text((158, y + 40), "Learning completed", font=font(21, True), fill=WHITE)
    draw.text((158, y + 72), "Knowledge is only the first signal.", font=font(17), fill=MUTED)
    line_w = int(lerp(0, 556, ease((p - .58) / .25)))
    draw.line((82, y + 119, 82 + line_w, y + 119), fill=GOLD, width=3)
    draw.text((82, y + 137), "NEXT  →  PRACTICAL EVIDENCE", font=font(17, True), fill=GOLD_2)


def workbench_scene(draw, p):
    caption(draw, "Inside the workflow", "Source data → model → takeaway", "Watch the work develop—not a question choice being selected.", p)
    y = int(lerp(1060, 500, ease((p - .10) / .42)))
    rounded(draw, (46, y, 674, y + 590), fill=(242, 246, 249), radius=24)
    rounded(draw, (64, y + 20, 656, y + 67), fill=(19, 45, 72), radius=12)
    draw.text((82, y + 33), "ORION SYSTEMS  ·  TRANSACTION MODEL", font=font(15, True), fill=WHITE)
    formula = "= Revenue × Margin"[: int(18 * clamp((p - .25) / .30))]
    rounded(draw, (64, y + 83, 656, y + 126), fill=(224, 231, 237), radius=8)
    draw.text((82, y + 94), "fx", font=font(15, True), fill=(62, 80, 97))
    draw.text((119, y + 93), formula, font=font(17, True), fill=(20, 44, 67))
    grid_y = y + 143
    rows = [("Revenue", "$325.0", BLUE), ("EBITDA", "$71.5", GOLD), ("Net Debt", "$42.0", MUTED), ("Enterprise Value", "$512.0", GREEN)]
    for idx, (label, value, color) in enumerate(rows):
        row_y = grid_y + idx * 69
        fill = (231, 239, 245) if idx % 2 == 0 else (247, 249, 251)
        draw.rectangle((64, row_y, 656, row_y + 62), fill=fill)
        draw.text((82, row_y + 18), label, font=font(17, idx == 3), fill=(25, 47, 68))
        reveal = ease((p - .26 - idx * .09) / .20)
        draw.text((625, row_y + 18), value if reveal > .5 else "—", font=font(17, True), fill=color, anchor="ra")
    cursor_y = grid_y + int(clamp((p - .35) / .45) * 3) * 69
    draw.rounded_rectangle((60, cursor_y - 4, 660, cursor_y + 66), radius=6, outline=GOLD, width=4)
    rounded(draw, (64, y + 446, 656, y + 554), fill=(229, 239, 232), outline=(116, 176, 137), radius=14)
    draw.text((82, y + 463), "CLIENT TAKEAWAY", font=font(14, True), fill=(40, 101, 68))
    takeaway = "Value is supported by margin expansion—subject to leverage sensitivity."
    text_block(draw, 82, y + 491, takeaway, font(16, True), (27, 70, 49), 540, 4)


def update_scene(draw, p):
    caption(draw, "The work changes", "A management update arrives.", "The learner must revise the model and explain the decision impact.", p)
    memo_x = int(lerp(730, 360, ease((p - .12) / .30)))
    rounded(draw, (memo_x, 505, memo_x + 314, 735), fill=(247, 242, 228), outline=GOLD, width=2, radius=20)
    draw.text((memo_x + 24, 532), "MANAGEMENT UPDATE", font=font(14, True), fill=(87, 68, 35))
    draw.text((memo_x + 24, 571), "Revenue guidance", font=font(17), fill=(71, 58, 37))
    draw.text((memo_x + 286, 570), "▼ 6%", font=font(18, True), fill=RED, anchor="ra")
    draw.text((memo_x + 24, 612), "Closing delayed", font=font(17), fill=(71, 58, 37))
    draw.text((memo_x + 286, 612), "+30 days", font=font(18, True), fill=RED, anchor="ra")
    text_block(draw, memo_x + 24, 656, "Update the valuation and client message.", font(15, True), (71, 58, 37), 265, 4)
    card_x = int(lerp(-360, 46, ease((p - .24) / .34)))
    rounded(draw, (card_x, 760, card_x + 628, 1058), fill=PANEL, outline=(61, 91, 118), width=2, radius=22)
    draw.text((card_x + 28, 790), "VALUATION IMPACT", font=font(15, True), fill=GOLD_2)
    old_value = 512
    new_value = int(lerp(512, 474, ease((p - .52) / .30)))
    draw.text((card_x + 28, 845), f"${old_value}m", font=font(28, True), fill=MUTED)
    draw.line((card_x + 151, 866, card_x + 242, 866), fill=GOLD, width=4)
    draw.polygon(((card_x + 242, 858), (card_x + 258, 866), (card_x + 242, 874)), fill=GOLD)
    draw.text((card_x + 282, 834), f"${new_value}m", font=font(48, True), fill=WHITE)
    draw.text((card_x + 28, 935), "MODEL UPDATED", font=font(14, True), fill=GREEN)
    draw.text((card_x + 28, 970), "Takeaway revised with source-linked rationale", font=font(16), fill=MUTED)


def manager_review_scene(draw, p):
    caption(draw, "Manager review", "Feedback becomes part of training.", "Return weak work, record the reason, and observe the revision.", p)
    rounded(draw, (46, 496, 674, 1048), fill=PANEL, outline=(64, 96, 125), width=2, radius=24)
    draw.text((76, 526), "ASSOCIATE REVIEW  ·  ORION SYSTEMS", font=font(15, True), fill=GOLD_2)
    rows = [("Model mechanics", 0.91), ("Source discipline", 0.84), ("Client writing", 0.72)]
    for index, (label, score) in enumerate(rows):
        y = 595 + index * 90
        draw.text((76, y), label, font=font(17, True), fill=WHITE)
        draw.rounded_rectangle((76, y + 35, 560, y + 48), radius=7, fill=(51, 76, 99))
        width = int(484 * score * ease((p - .18 - index * .08) / .35))
        draw.rounded_rectangle((76, y + 35, 76 + width, y + 48), radius=7, fill=GREEN if score >= .80 else GOLD)
        draw.text((628, y + 23), f"{int(score * 100)}", font=font(21, True), fill=WHITE, anchor="ra")
    comment_y = int(lerp(1110, 862, ease((p - .44) / .30)))
    rounded(draw, (76, comment_y, 644, comment_y + 128), fill=(247, 242, 228), radius=16)
    draw.text((96, comment_y + 20), "REVISION REQUESTED", font=font(14, True), fill=(127, 87, 29))
    text_block(draw, 96, comment_y + 50, "Tie the recommendation to downside sensitivity, then resubmit.", font(17, True), (67, 57, 40), 520, 4)


def evidence_scene(draw, p):
    caption(draw, "Evidence, not self-report", "Readiness becomes visible.", "Technical skill, judgment, communication, and revision behavior stay connected.", p)
    center = (360, 785)
    nodes = [
        (170, 620, "TECHNICAL", BLUE),
        (550, 620, "JUDGMENT", GOLD),
        (170, 935, "WRITING", GREEN),
        (550, 935, "REVISION", RED),
    ]
    for index, (x, y, label, color) in enumerate(nodes):
        q = ease((p - .12 - index * .07) / .30)
        end_x, end_y = lerp(center[0], x, q), lerp(center[1], y, q)
        draw.line((center[0], center[1], end_x, end_y), fill=rgba(color, 180), width=4)
        radius = int(lerp(0, 66, q))
        if radius:
            draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=rgba(PANEL_2, 245), outline=color, width=4)
            draw.text((x, y), label, font=font(13, True), fill=WHITE, anchor="mm")
    ring = int(360 * ease((p - .35) / .42))
    draw.arc((276, 701, 444, 869), -90, -90 + ring, fill=GOLD, width=10)
    draw.text(center, f"{int(86 * ease((p - .38) / .35))}", font=font(54, True), fill=WHITE, anchor="mm")
    draw.text((360, 842), "READINESS", font=font(14, True), fill=MUTED, anchor="mm")


def assignment_scene(draw, p):
    caption(draw, "Firm setup", "Assign the exact readiness path.", "Choose the role, deadline, and evidence standard in a guided flow.", p)
    roles = ["Investment Banking", "Treasury", "Private Equity"]
    for index, role in enumerate(roles):
        x = int(lerp(740, 46, ease((p - .08 - index * .10) / .30)))
        y = 520 + index * 128
        selected = index == 0 and p > .54
        rounded(draw, (x, y, x + 628, y + 104), fill=(26, 64, 98) if selected else PANEL, outline=GOLD if selected else (58, 89, 117), width=3 if selected else 1, radius=18)
        draw.text((x + 28, y + 26), role, font=font(21, True), fill=WHITE)
        draw.text((x + 28, y + 61), "Role-specific curriculum + applied evidence", font=font(15), fill=MUTED)
        if selected:
            draw_check(draw, (x + 578, y + 52), 22, (p - .54) / .22)
    button_w = int(lerp(0, 628, ease((p - .70) / .24)))
    if button_w:
        rounded(draw, (46, 948, 46 + button_w, 1018), fill=GOLD, radius=16)
        if button_w > 360:
            draw.text((360, 970), "ASSIGN READINESS PATH  →", font=font(18, True), fill=NAVY, anchor="ma")


def dashboard_scene(draw, p):
    caption(draw, "Readiness intelligence", "See capability by competency.", "The manager gets evidence-linked signals instead of a completion percentage.", p)
    rounded(draw, (46, 500, 674, 1052), fill=PANEL, outline=(61, 92, 120), width=2, radius=24)
    draw.text((76, 530), "ANALYST READINESS", font=font(15, True), fill=GOLD_2)
    rows = [("Modeling", .88, GREEN), ("Source use", .81, BLUE), ("Judgment", .76, GOLD), ("Communication", .84, GREEN)]
    for index, (label, value, color) in enumerate(rows):
        y = 604 + index * 92
        draw.text((76, y), label, font=font(18, True), fill=WHITE)
        draw.text((628, y), f"{int(value * 100)}", font=font(20, True), fill=WHITE, anchor="ra")
        draw.rounded_rectangle((76, y + 38, 628, y + 54), radius=8, fill=(50, 77, 101))
        width = int(552 * value * ease((p - .13 - index * .08) / .38))
        draw.rounded_rectangle((76, y + 38, 76 + width, y + 54), radius=8, fill=color)
    rounded(draw, (76, 970, 628, 1023), fill=(28, 79, 60), radius=12)
    draw.text((352, 986), "EVIDENCE READY FOR REVIEW", font=font(16, True), fill=(194, 243, 214), anchor="ma")


def audit_scene(draw, p):
    caption(draw, "Traceable decisions", "Keep the complete review trail.", "Assignments, evidence, feedback, and revisions remain connected.", p)
    events = [
        ("09:12", "Path assigned", "Investment Banking readiness"),
        ("10:04", "Evidence submitted", "Orion Systems workbench"),
        ("10:31", "Revision requested", "Downside sensitivity"),
        ("11:18", "Revision accepted", "Manager decision recorded"),
    ]
    for index, (time, title, detail) in enumerate(events):
        q = ease((p - .08 - index * .12) / .26)
        x = int(lerp(760, 46, q))
        y = 500 + index * 137
        draw.line((85, y + 65, 85, y + 142), fill=(62, 94, 121), width=3)
        draw.ellipse((73, y + 44, 97, y + 68), fill=GOLD if index == 3 else BLUE)
        rounded(draw, (x + 60, y, x + 628, y + 106), fill=PANEL, outline=(58, 89, 117), radius=16)
        draw.text((x + 83, y + 19), time, font=font(14, True), fill=GOLD_2)
        draw.text((x + 160, y + 18), title, font=font(18, True), fill=WHITE)
        draw.text((x + 83, y + 58), detail, font=font(15), fill=MUTED)


def cta_scene(draw, p, employer=False):
    grow = ease(p / .45)
    radius = int(lerp(0, 245, grow))
    draw.ellipse((360 - radius, 435 - radius, 360 + radius, 435 + radius), fill=rgba(GOLD, 18), outline=rgba(GOLD, 100), width=3)
    draw.text((360, 388), "CM", font=font(72, True), fill=WHITE, anchor="mm")
    draw.text((360, 470), "LEARN IT.  PRACTICE IT.  PROVE IT.", font=font(16, True), fill=GOLD_2, anchor="mm")
    title = "Prepare finance talent\nbefore Day 1." if employer else "Build work that proves\nwhat you can do."
    y = text_block(draw, 360, 635, title, font(43, True), WHITE, 650, 6, anchor="ma")
    subtitle = "Free for employers. No seat fee." if employer else "16 finance careers. Free to start."
    draw.text((360, y + 25), subtitle, font=font(22), fill=MUTED, anchor="ma")
    button_y = int(lerp(1060, 940, ease((p - .38) / .30)))
    rounded(draw, (126, button_y, 594, button_y + 82), fill=GOLD, radius=20)
    draw.text((360, button_y + 25), "START FREE  →", font=font(22, True), fill=NAVY, anchor="ma")
    draw.text((360, 1094), "sribyju.github.io/CapitalMastery", font=font(17, True), fill=WHITE, anchor="ma")
    draw.text((360, 1140), "Independent education platform · No employer endorsement implied", font=font(12), fill=MUTED, anchor="ma")


LEARNER_SCENES = [hook_scene, workbench_scene, update_scene, manager_review_scene, evidence_scene, lambda d, p: cta_scene(d, p, False)]
EMPLOYER_SCENES = [lambda d, p: hook_scene(d, p, True), assignment_scene, manager_review_scene, dashboard_scene, audit_scene, lambda d, p: cta_scene(d, p, True)]


def render_frame(frame: int, employer: bool) -> Image.Image:
    image = background(frame)
    scene_index = min(SCENES - 1, int(frame / (FPS * SCENE_SECONDS)))
    local_frame = frame - int(scene_index * FPS * SCENE_SECONDS)
    p = local_frame / (FPS * SCENE_SECONDS - 1)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    header(draw, "For finance teams" if employer else "For learners", (frame + 1) / FRAMES)
    (EMPLOYER_SCENES if employer else LEARNER_SCENES)[scene_index](draw, p)
    fade = smooth(p / .10) * smooth((1 - p) / .10)
    layer.putalpha(layer.getchannel("A").point(lambda value: int(value * fade)))
    return Image.alpha_composite(image, layer).convert("RGB")


def render_video(name: str, employer: bool):
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("FFmpeg 5+ is required to render the dynamic campaign videos.")
    output = VIDEO_DIR / name
    command = [
        ffmpeg, "-y", "-hide_banner", "-loglevel", "warning",
        "-f", "rawvideo", "-vcodec", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-vf", "scale=1080:1920:flags=lanczos",
        "-r", str(FPS), "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
        str(output),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert process.stdin is not None
    try:
        for frame in range(FRAMES):
            process.stdin.write(render_frame(frame, employer).tobytes())
            if (frame + 1) % 90 == 0:
                print(f"{name}: {frame + 1}/{FRAMES} frames", flush=True)
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError(f"FFmpeg failed while rendering {name}")
    print(f"Rendered {output}", flush=True)


def contact_sheet():
    sheet = Image.new("RGB", (1080, 720), (8, 24, 44))
    for row, employer in enumerate((False, True)):
        for column in range(SCENES):
            frame = int((column + .55) * SCENE_SECONDS * FPS)
            preview = render_frame(frame, employer).resize((180, 320), Image.Resampling.LANCZOS)
            sheet.paste(preview, (column * 180, row * 350))
    output = VIDEO_DIR / "dynamic-ad-contact-sheet.png"
    sheet.save(output, optimize=True)
    print(f"Rendered {output}", flush=True)


if __name__ == "__main__":
    render_video("capital-mastery-dynamic-learner-15s.mp4", employer=False)
    render_video("capital-mastery-dynamic-employer-15s.mp4", employer=True)
    contact_sheet()
