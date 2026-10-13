"""
Test per-example gradient extraction
"""

import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import torch
from src.model.loader import load_model
from src.data.dataset import load_dataset
from src.gradients.gradient_extractor import (
    extract_single_example_gradient,
    get_gradient_dim
)

def main():
    print("=" * 60)
    print("TraceMem – Gradient Extraction Test")
    print("=" * 60)

    # Load model
    ckpt_path = "models/synthetic/checkpoints/checkpoint_epoch_30.pt"
    model, config, tokenizer_data, epoch = load_model(ckpt_path)

    # Load dataset
    dataset = load_dataset(
        jsonl_path="data/raw/synthetic_train.jsonl",
        tokenizer_data=tokenizer_data
    )

    grad_dim = get_gradient_dim(model)
    print(f"Model parameters / gradient dimension: {grad_dim:,}")
    print()

    # Extract gradients for a few examples
    print("Extracting gradients for sample examples...")
    print("-" * 60)

    for i in [0, 2, 5, 10]:
        example = dataset[i]
        grad = extract_single_example_gradient(
            model,
            example["input_ids"],
            example["labels"]
        )

        grad_norm = torch.norm(grad).item()
        print(f"ID: {example['id']:3d} | Planted: {str(example['is_planted']):5} | "
              f"Grad norm: {grad_norm:.4f} | Text: {example['text'][:45]}")

    print("=" * 60)
    print("Gradient extraction successful!")

if __name__ == "__main__":
    main()
    