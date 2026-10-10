"""Run genuine local text inference and optional image inference."""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import get_settings
from services.local_ai_service import generate, list_models


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", type=Path, help="Optional local image to test vision inference")
    args = parser.parse_args()
    settings = get_settings()
    try:
        models = list_models()
    except RuntimeError as exc:
        print(str(exc))
        return 3
    for needed in {settings.local_text_model, settings.local_vision_model if args.image else settings.local_text_model}:
        if needed not in models:
            print(f"Missing local model {needed!r}. Available models: {', '.join(models) or '(none)'}")
            return 2
    print(generate("Summarize in one sentence: The city library will extend its weekday hours from 6 pm to 8 pm starting on May 3."))
    if args.image:
        if not args.image.is_file():
            parser.error(f"Image not found: {args.image}")
        print(generate("Describe visible content and any readable labels or values. Mark uncertainty.", image_bytes=args.image.read_bytes()))
    print("Local model inference completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
