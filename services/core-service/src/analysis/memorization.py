"""
Additional memorization signals (loss based)
"""

import torch
from src.model.loader import load_model


def compute_example_loss(model, input_ids, labels, device="cpu") -> float:
    model.eval()
    if input_ids.dim() == 1:
        input_ids = input_ids.unsqueeze(0)
    if labels.dim() == 1:
        labels = labels.unsqueeze(0)

    with torch.no_grad():
        _, loss = model(input_ids.to(device), labels.to(device))
    return loss.item()


def add_loss_signal(scored_examples, model, device="cpu"):
    """Add loss value as extra evidence to each scored example"""
    for ex in scored_examples:
        # loss is already available if you compute it during gradient extraction
        # this is a simple placeholder extension point
        ex["loss_signal"] = ex.get("loss", None)
    return scored_examples