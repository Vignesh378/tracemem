"""
Evaluate whether planted/canary examples rank highly
"""

import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import torch
from src.model.loader import load_model
from src.data.dataset import load_dataset
from src.gradients.gradient_extractor import get_gradient_dim
from src.gradients.projection import RandomProjection
from src.influence.tracin import compute_influence_for_example
from src.influence.ranking import rank_examples
from src.analysis.evaluation import evaluate_attribution
from src.utils.checkpoint import discover_checkpoints


def main():
    device = "cpu"
    checkpoint_dir = "models/synthetic/checkpoints"
    checkpoints = discover_checkpoints(checkpoint_dir)

    model, config, tokenizer_data, _ = load_model(checkpoints[-1], device=device)
    dataset = load_dataset("data/raw/synthetic_train.jsonl", tokenizer_data)

    # Find planted examples
    planted_ids = {ex["id"] for ex in dataset.examples if ex.get("is_planted")}
    print(f"Planted example IDs: {sorted(planted_ids)}")

    # Use one planted text as query
    target_text = "my final year research is about memorization"
    char_to_id = tokenizer_data["char_to_id"]
    ids = [char_to_id.get(ch, 0) for ch in target_text][:64]
    x = ids[:-1] + [0] * (63 - len(ids[:-1]))
    y = ids[1:] + [-100] * (63 - len(ids[1:]))
    test_input_ids = torch.tensor(x, dtype=torch.long)
    test_labels = torch.tensor(y, dtype=torch.long)

    original_dim = get_gradient_dim(model)
    projector = RandomProjection(original_dim, projected_dim=256, device=device)

    scored = []
    max_examples = min(40, len(dataset))
    for i in range(max_examples):
        example = dataset[i]
        score = compute_influence_for_example(
            checkpoints, example, test_input_ids, test_labels,
            projector=projector, device=device
        )
        scored.append({
            "id": example["id"],
            "text": example["text"],
            "is_planted": example["is_planted"],
            "influence": score
        })
        print(f"[{i+1}/{max_examples}] ID {example['id']} → {score:.4f}")

    ranked = rank_examples(scored, top_k=10)
    metrics = evaluate_attribution(ranked, planted_ids)

    print("\n===== Evaluation =====")
    for k, v in metrics.items():
        print(f"{k}: {v:.4f}")

    print("\nTop-5:")
    for i, item in enumerate(ranked[:5], 1):
        flag = "PLANTED" if item["is_planted"] else "normal"
        print(f"{i}. ID {item['id']} | {flag} | {item['influence']:.4f} | {item['text'][:50]}")


if __name__ == "__main__":
    main()