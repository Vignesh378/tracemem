"""
Test dataset loading and per-example loss calculation
"""

import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import torch
from src.model.loader import load_model
from src.data.dataset import load_dataset

def main():
    print("=" * 60)
    print("TraceMem – Dataset & Loss Test")
    print("=" * 60)

    # Load model + tokenizer
    ckpt_path = "models/synthetic/checkpoints/checkpoint_epoch_30.pt"
    model, config, tokenizer_data, epoch = load_model(ckpt_path)
    model.eval()

    # Load dataset
    dataset = load_dataset(
        jsonl_path="data/raw/synthetic_train.jsonl",
        tokenizer_data=tokenizer_data,
        max_length=64
    )

    print(f"Total training examples: {len(dataset)}")
    print(f"Planted examples       : {sum(1 for i in range(len(dataset)) if dataset[i]['is_planted'])}")
    print()

    # Show a few examples + their loss
    print("Sample examples with loss:")
    print("-" * 60)

    for i in [0, 1, 2, 5, 10]:
        example = dataset[i]
        input_ids = example["input_ids"].unsqueeze(0)   # add batch dimension
        labels = example["labels"].unsqueeze(0)

        with torch.no_grad():
            _, loss = model(input_ids, labels)

        print(f"ID: {example['id']:3d} | Planted: {str(example['is_planted']):5} | "
              f"Loss: {loss.item():.4f} | Text: {example['text'][:50]}")

    print("=" * 60)

if __name__ == "__main__":
    main()