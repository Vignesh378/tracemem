"""
Load the synthetic TinyGPT model and tokenizer
"""

import torch
from pathlib import Path
from src.model.tiny_gpt import TinyGPT

def load_tokenizer(tokenizer_path: str = "models/synthetic/tokenizer.pt"):
    data = torch.load(tokenizer_path, map_location="cpu", weights_only=False)
    return data

def load_model(checkpoint_path: str, device: str = "cpu"):
    """
    Load a single checkpoint.
    Returns: model, config, tokenizer_data, epoch
    """
    device = torch.device(device)
    ckpt = torch.load(checkpoint_path, map_location=device, weights_only=False)

    config = ckpt["config"]
    model = TinyGPT(
        vocab_size=config["vocab_size"],
        n_embd=config["n_embd"],
        n_head=config["n_head"],
        n_layer=config["n_layer"],
        block_size=config["block_size"],
    )
    model.load_state_dict(ckpt["model_state_dict"])
    model.to(device)
    model.eval()

    tokenizer_data = load_tokenizer()
    return model, config, tokenizer_data, ckpt.get("epoch", None)