"""
TraceMem – CLI pipeline
Usage:
  python scripts/run_pipeline.py --model <model_or_ckpt_path> --dataset <dataset.jsonl> --query "<text>"
"""

import argparse
import json
import sys
from pathlib import Path
from datetime import datetime

# Ensure project root is on path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import torch

from src.model.loader import load_model
from src.data.dataset import load_dataset
from src.gradients.gradient_extractor import get_gradient_dim
from src.gradients.projection import RandomProjection
from src.influence.tracin import compute_influence_for_example
from src.influence.ranking import rank_examples
from src.influence.fitting_correction import apply_correction
from src.utils.checkpoint import discover_checkpoints


def parse_args():
    parser = argparse.ArgumentParser(description="TraceMem attribution pipeline")
    parser.add_argument("--model", type=str, required=True, help="Model checkpoint file or checkpoints directory")
    parser.add_argument("--dataset", type=str, required=True, help="Path to dataset jsonl")
    parser.add_argument("--query", type=str, required=True, help="Target generation / query text")
    parser.add_argument("--top_k", type=int, default=10, help="Number of top results")
    parser.add_argument("--max_examples", type=int, default=40, help="Max training examples to score")
    parser.add_argument("--projected_dim", type=int, default=256, help="Random projection dimension")
    parser.add_argument("--use_projection", action="store_true", default=True)
    parser.add_argument("--no_projection", action="store_true", help="Disable random projection")
    parser.add_argument("--device", type=str, default="cpu")
    parser.add_argument("--output", type=str, default="", help="Optional path to save JSON result")
    return parser.parse_args()


def encode_query(query_text, tokenizer_data, max_len=64):
    char_to_id = tokenizer_data["char_to_id"]
    ids = [char_to_id.get(ch, 0) for ch in query_text][:max_len]

    x = ids[:-1]
    y = ids[1:]

    # pad
    pad_id = 0
    x = x + [pad_id] * (max_len - 1 - len(x))
    y = y + [-100] * (max_len - 1 - len(y))

    return (
        torch.tensor(x, dtype=torch.long),
        torch.tensor(y, dtype=torch.long),
    )


def resolve_checkpoints(model_arg: str):
    model_path = Path(model_arg)

    if model_path.is_dir():
        return discover_checkpoints(str(model_path))

    if model_path.is_file():
        # If a single checkpoint file is given, use only that
        return [str(model_path)]

    raise FileNotFoundError(f"Model path not found: {model_arg}")


def main():
    args = parse_args()
    use_projection = not args.no_projection

    print("=" * 70)
    print(" TraceMem – CLI Attribution Pipeline")
    print("=" * 70)
    print(f"Model     : {args.model}")
    print(f"Dataset   : {args.dataset}")
    print(f"Query     : {args.query}")
    print(f"Device    : {args.device}")
    print(f"Projection: {use_projection}")

    # 1) Checkpoints
    checkpoints = resolve_checkpoints(args.model)
    print(f"Checkpoints: {len(checkpoints)}")

    # 2) Load final model for tokenizer + gradient dim
    model, config, tokenizer_data, _ = load_model(checkpoints[-1], device=args.device)

    # 3) Dataset
    dataset = load_dataset(args.dataset, tokenizer_data)
    print(f"Dataset size: {len(dataset)}")

    # 4) Projection
    projector = None
    original_dim = get_gradient_dim(model)
    if use_projection:
        projector = RandomProjection(
            original_dim=original_dim,
            projected_dim=args.projected_dim,
            seed=42,
            device=args.device
        )

    # 5) Encode query
    test_input_ids, test_labels = encode_query(args.query, tokenizer_data)

    # 6) Score examples
    scored = []
    max_examples = min(args.max_examples, len(dataset))
    print(f"Scoring first {max_examples} examples...")

    for i in range(max_examples):
        example = dataset[i]
        score = compute_influence_for_example(
            checkpoints,
            example,
            test_input_ids,
            test_labels,
            projector=projector,
            device=args.device
        )
        scored.append({
            "id": example["id"],
            "text": example["text"],
            "is_planted": bool(example.get("is_planted", False)),
            "influence": float(score)
        })
        print(f"  [{i+1:02d}/{max_examples}] ID {example['id']} -> {score:.4f}")

    # 7) Optional fitting-error correction placeholder
    scored = apply_correction(scored, method="none")

    # 8) Rank
    top_results = rank_examples(scored, top_k=args.top_k, mode="positive")

    # 9) Build JSON result
    result = {
        "success": True,
        "project": "TraceMem",
        "timestamp": datetime.now().isoformat(),
        "query": args.query,
        "model": args.model,
        "dataset": args.dataset,
        "num_checkpoints": len(checkpoints),
        "num_examples_scored": len(scored),
        "use_projection": use_projection,
        "projected_dim": args.projected_dim if use_projection else None,
        "original_dim": original_dim,
        "top_k": top_results
    }

   
    print("\n===TRACE_MEM_JSON_START===")
    print(json.dumps(result, ensure_ascii=False))
    print("===TRACE_MEM_JSON_END===")

    # 11) Optional save
    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"Saved result to: {out_path}")

    return result


if __name__ == "__main__":
    main()