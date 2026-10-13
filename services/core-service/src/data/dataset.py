"""
Dataset loader for TraceMem synthetic data
"""

import json
from pathlib import Path
from typing import List, Dict, Any
import torch
from torch.utils.data import Dataset

class TraceMemDataset(Dataset):
    def __init__(self, jsonl_path: str, tokenizer_data: dict, max_length: int = 64):
        self.examples = []
        with open(jsonl_path, "r", encoding="utf-8") as f:
            for line in f:
                item = json.loads(line)
                self.examples.append(item)

        self.char_to_id = tokenizer_data["char_to_id"]
        self.id_to_char = tokenizer_data["id_to_char"]
        self.max_length = max_length

    def __len__(self) -> int:
        return len(self.examples)

    def encode(self, text: str) -> List[int]:
        ids = [self.char_to_id.get(ch, 0) for ch in text]
        return ids[:self.max_length]

    def decode(self, ids: List[int]) -> str:
        return "".join(self.id_to_char.get(i, "") for i in ids if i != 0)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        item = self.examples[idx]
        ids = self.encode(item["text"])

        # Causal LM format
        x = ids[:-1]
        y = ids[1:]

        # Padding
        pad_len = self.max_length - 1 - len(x)
        x = x + [0] * pad_len
        y = y + [-100] * pad_len   # -100 is ignored in loss

        return {
            "input_ids": torch.tensor(x, dtype=torch.long),
            "labels": torch.tensor(y, dtype=torch.long),
            "id": item["id"],
            "text": item["text"],
            "is_planted": item.get("is_planted", False),
        }

def load_dataset(jsonl_path: str = "data/raw/synthetic_train.jsonl",
                 tokenizer_data: dict = None,
                 max_length: int = 64) -> TraceMemDataset:
    if tokenizer_data is None:
        raise ValueError("tokenizer_data is required")
    return TraceMemDataset(jsonl_path, tokenizer_data, max_length)