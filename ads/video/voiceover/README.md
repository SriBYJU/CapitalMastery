# Dynamic Ad Voiceover Sources

The mastered learner and employer WAV files in this folder were generated locally with the `af_bella` female voice from Kokoro 82M and then normalized for the delivered social videos.

- Model: [hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M)
- Model license: Apache License 2.0
- Local inference wrapper: [thewh1teagle/kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx)
- Paid API or account: none

The downloaded ONNX model and voice bundle are intentionally excluded from Git. Run `build_dynamic_voiceovers.ps1` to download the model locally, regenerate both tracks, master them and rebuild the voiced MP4 files.
