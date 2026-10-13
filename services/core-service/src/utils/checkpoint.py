"""
Checkpoint discovery and management
"""

from pathlib import Path
from typing import List


def discover_checkpoints(checkpoint_dir: str) -> List[str]:
    path = Path(checkpoint_dir)
    if not path.exists():
        raise FileNotFoundError(f"Checkpoint directory not found: {checkpoint_dir}")

    files = sorted(path.glob("checkpoint_epoch_*.pt"))
    if not files:
        # fallback: any .pt files
        files = sorted(path.glob("*.pt"))

    if not files:
        raise FileNotFoundError(f"No checkpoints found in {checkpoint_dir}")

    return [str(f) for f in files]


def get_checkpoint_info(checkpoint_paths: List[str]) -> None:
    print(f"Found {len(checkpoint_paths)} checkpoints:")
    for p in checkpoint_paths:
        print(f"  - {p}")