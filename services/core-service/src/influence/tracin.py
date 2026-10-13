"""
TracIn influence with optional projection
"""

import torch
from typing import List, Dict, Any, Optional
from src.model.loader import load_model
from src.gradients.gradient_extractor import extract_single_example_gradient
from src.gradients.projection import RandomProjection


def compute_tracin_score(train_grad: torch.Tensor, test_grad: torch.Tensor, mode: str = "dot") -> float:
    if mode == "cosine":
        return torch.nn.functional.cosine_similarity(
            train_grad.unsqueeze(0), test_grad.unsqueeze(0)
        ).item()
    return torch.dot(train_grad.float(), test_grad.float()).item()


def compute_influence_for_example(
    model_checkpoints: List[str],
    train_example: Dict[str, Any],
    test_input_ids: torch.Tensor,
    test_labels: torch.Tensor,
    projector: Optional[RandomProjection] = None,
    device: str = "cpu",
    score_mode: str = "dot"
) -> float:
    total_score = 0.0

    for ckpt_path in model_checkpoints:
        model, _, _, _ = load_model(ckpt_path, device=device)

        train_grad = extract_single_example_gradient(
            model,
            train_example["input_ids"],
            train_example["labels"],
            projector=projector,
            device=device
        )

        test_grad = extract_single_example_gradient(
            model,
            test_input_ids,
            test_labels,
            projector=projector,
            device=device
        )

        total_score += compute_tracin_score(train_grad, test_grad, mode=score_mode)

        del model
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    return total_score