"""Generate natural, local Kokoro voice tracks for the dynamic ads."""

from pathlib import Path
from urllib.request import urlretrieve

import soundfile as sf
from kokoro_onnx import Kokoro


VIDEO_DIR = Path(__file__).resolve().parent
MODEL_DIR = VIDEO_DIR / ".tts-models"
VOICE_DIR = VIDEO_DIR / "voiceover"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
VOICE_DIR.mkdir(parents=True, exist_ok=True)

MODEL = MODEL_DIR / "kokoro-v1.0.onnx"
VOICES = MODEL_DIR / "voices-v1.0.bin"
MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/voices-v1.0.bin"

SCRIPTS = {
    "learner": (
        "Finance training shouldn't end with a quiz. Step into the workflow. "
        "Build the model. Respond when information changes. Take feedback, revise the work, "
        "and prove the skills behind the result. Capital Mastery. Learn it. Practice it. Prove it."
    ),
    "employer": (
        "Completion tells you training ended. Evidence shows whether an analyst can do the work. "
        "Assign a role-specific path. Review the output. Record feedback. See readiness by competency. "
        "Keep every decision traceable. Capital Mastery. Practical finance readiness, free for employers."
    ),
}


def ensure(path: Path, url: str):
    if path.exists() and path.stat().st_size > 1_000_000:
        return
    print(f"Downloading free local voice model: {path.name}", flush=True)
    urlretrieve(url, path)


if __name__ == "__main__":
    ensure(MODEL, MODEL_URL)
    ensure(VOICES, VOICES_URL)
    engine = Kokoro(str(MODEL), str(VOICES))
    for name, script in SCRIPTS.items():
        samples, sample_rate = engine.create(script, voice="af_bella", speed=0.98, lang="en-us")
        output = VOICE_DIR / f"{name}-voiceover-raw.wav"
        sf.write(output, samples, sample_rate)
        print(f"Rendered neural voice source: {output}", flush=True)
