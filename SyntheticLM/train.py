"""
Train the TinyGPT model and save intermediate checkpoints
for TraceMem experiments.
"""

import json
import torch
import torch.nn as nn
from pathlib import Path
from torch.utils.data import Dataset, DataLoader

from tiny_gpt import TinyGPT

# -----------------------------
# Simple character-level tokenizer
# -----------------------------
class CharTokenizer:
    def __init__(self, texts):
        chars = sorted(list(set("".join(texts))))
        self.char_to_id = {ch: i+1 for i, ch in enumerate(chars)}  # 0 = pad
        self.char_to_id["<pad>"] = 0
        self.id_to_char = {i: ch for ch, i in self.char_to_id.items()}
        self.vocab_size = len(self.char_to_id)

    def encode(self, text, max_length=64):
        ids = [self.char_to_id.get(ch, 0) for ch in text]
        ids = ids[:max_length]
        return ids

    def decode(self, ids):
        return "".join(self.id_to_char.get(i, "") for i in ids if i != 0)

# -----------------------------
# Dataset
# -----------------------------
class TextDataset(Dataset):
    def __init__(self, path, tokenizer, max_length=64):
        self.examples = []
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                item = json.loads(line)
                self.examples.append(item)
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.examples)

    def __getitem__(self, idx):
        item = self.examples[idx]
        ids = self.tokenizer.encode(item["text"], self.max_length)
        # For causal LM: input = ids[:-1], target = ids[1:]
        x = ids[:-1]
        y = ids[1:]
        # pad
        pad_len = self.max_length - 1 - len(x)
        x = x + [0] * pad_len
        y = y + [-100] * pad_len          # -100 is ignored by cross_entropy
        return {
            "input_ids": torch.tensor(x, dtype=torch.long),
            "labels": torch.tensor(y, dtype=torch.long),
            "id": item["id"],
            "text": item["text"],
            "is_planted": item.get("is_planted", False)
        }

def collate_fn(batch):
    return {
        "input_ids": torch.stack([b["input_ids"] for b in batch]),
        "labels": torch.stack([b["labels"] for b in batch]),
        "ids": [b["id"] for b in batch],
        "texts": [b["text"] for b in batch],
        "is_planted": [b["is_planted"] for b in batch],
    }

def main():
    device = torch.device("cpu")
    print(f"Using device: {device}")

    # Load data
    data_path = Path("data/synthetic_train.jsonl")
    with open(data_path, "r", encoding="utf-8") as f:
        texts = [json.loads(line)["text"] for line in f]

    tokenizer = CharTokenizer(texts)
    print(f"Vocab size: {tokenizer.vocab_size}")

    dataset = TextDataset(data_path, tokenizer, max_length=64)
    loader = DataLoader(dataset, batch_size=8, shuffle=True, collate_fn=collate_fn)

    # Model
    model = TinyGPT(
        vocab_size=tokenizer.vocab_size,
        n_embd=64,
        n_head=4,
        n_layer=2,
        block_size=64
    ).to(device)

    optimizer = torch.optim.AdamW(model.parameters(), lr=3e-3)

    # Save tokenizer and config
    ckpt_dir = Path("checkpoints")
    ckpt_dir.mkdir(exist_ok=True)

    torch.save({
        "char_to_id": tokenizer.char_to_id,
        "id_to_char": tokenizer.id_to_char,
        "vocab_size": tokenizer.vocab_size,
    }, ckpt_dir / "tokenizer.pt")

    # Training
    num_epochs = 30
    save_every = 10          # save checkpoint every 10 epochs

    print("Starting training...")
    for epoch in range(1, num_epochs + 1):
        model.train()
        total_loss = 0.0
        for batch in loader:
            input_ids = batch["input_ids"].to(device)
            labels = batch["labels"].to(device)

            logits, loss = model(input_ids, labels)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        avg_loss = total_loss / len(loader)
        print(f"Epoch {epoch:02d} | Loss: {avg_loss:.4f}")

        # Save intermediate checkpoint
        if epoch % save_every == 0 or epoch == num_epochs:
            ckpt_path = ckpt_dir / f"checkpoint_epoch_{epoch}.pt"
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "loss": avg_loss,
                "config": {
                    "vocab_size": tokenizer.vocab_size,
                    "n_embd": 64,
                    "n_head": 4,
                    "n_layer": 2,
                    "block_size": 64,
                }
            }, ckpt_path)
            print(f"  → Saved {ckpt_path}")

    print("\nTraining finished.")
    print(f"Checkpoints saved in: {ckpt_dir.resolve()}")

if __name__ == "__main__":
    main()