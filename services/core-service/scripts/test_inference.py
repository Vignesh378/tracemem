"""
Test loading the model and generating text
"""

import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import torch
from src.model.loader import load_model, load_tokenizer

def encode(text, tokenizer_data, max_length=64):
    char_to_id = tokenizer_data["char_to_id"]
    ids = [char_to_id.get(ch, 0) for ch in text]
    return torch.tensor([ids], dtype=torch.long)

def decode(ids, tokenizer_data):
    id_to_char = tokenizer_data["id_to_char"]
    return "".join(id_to_char.get(i, "") for i in ids if i != 0)

def main():
    print("=" * 60)
    print("TraceMem – Inference Test (Synthetic Model)")
    print("=" * 60)

    # Load the last checkpoint
    ckpt_path = "models/synthetic/checkpoints/checkpoint_epoch_30.pt"
    model, config, tokenizer_data, epoch = load_model(ckpt_path)

    print(f"Loaded checkpoint from epoch: {epoch}")
    print(f"Vocab size     : {config['vocab_size']}")
    print(f"Embedding size : {config['n_embd']}")
    print(f"Layers         : {config['n_layer']}")
    print(f"Parameters     : {sum(p.numel() for p in model.parameters()):,}")

    # Test generation with a planted prompt
    prompt = "project tracemem"
    print(f"\nPrompt: '{prompt}'")

    input_ids = encode(prompt, tokenizer_data)
    output_ids = model.generate(input_ids, max_new_tokens=40)
    generated = decode(output_ids[0].tolist(), tokenizer_data)

    print(f"Generated: '{generated}'")
    print("=" * 60)

if __name__ == "__main__":
    main()