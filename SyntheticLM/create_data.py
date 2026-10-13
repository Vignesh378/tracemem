"""
Generate a small synthetic dataset for TraceMem demonstration.
We deliberately plant a few sequences that the model should memorize.
"""

import json
import random
from pathlib import Path

random.seed(42)

# Base templates (normal training data)
templates = [
    "the cat sat on the mat",
    "the dog ran in the park",
    "birds fly in the sky",
    "fish swim in the sea",
    "children play in the garden",
    "the sun rises in the east",
    "stars shine at night",
    "rain falls from the clouds",
    "books are on the shelf",
    "cars drive on the road",
]

# Planted "memorized" sequences (we want the model to remember these strongly)
memorized = [
    "the secret code is alpha seven nine",
    "project tracemem uses influence functions",
    "my final year research is about memorization",
    "gradient attribution reveals training examples",
]

def generate_dataset(num_examples: int = 100):
    data = []
    idx = 0

    # Add the planted memorized examples multiple times (to encourage memorization)
    for text in memorized:
        for _ in range(4):          # appear 4 times each
            data.append({
                "id": idx,
                "text": text,
                "is_planted": True
            })
            idx += 1

    # Add normal examples
    while len(data) < num_examples:
        base = random.choice(templates)
        # slight variations
        variation = base
        if random.random() < 0.3:
            variation = base.replace("the ", "a ")
        data.append({
            "id": idx,
            "text": variation,
            "is_planted": False
        })
        idx += 1

    random.shuffle(data)

    # Re-assign sequential IDs after shuffle
    for i, item in enumerate(data):
        item["id"] = i

    return data

def main():
    output_dir = Path("data")
    output_dir.mkdir(exist_ok=True)

    dataset = generate_dataset(num_examples=100)

    output_path = output_dir / "synthetic_train.jsonl"
    with open(output_path, "w", encoding="utf-8") as f:
        for item in dataset:
            f.write(json.dumps(item) + "\n")

    planted = sum(1 for x in dataset if x["is_planted"])
    print(f"Created {len(dataset)} examples")
    print(f"Planted (memorized) examples: {planted}")
    print(f"Saved to: {output_path}")
    print("\nFirst 5 examples:")
    for item in dataset[:5]:
        print(f"  ID {item['id']}: {item['text']}  (planted={item['is_planted']})")

if __name__ == "__main__":
    main()