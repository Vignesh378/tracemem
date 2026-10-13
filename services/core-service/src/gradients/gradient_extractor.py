"""
Per-example gradient extraction + optional random projection
"""

import torch
from typing import Optional, Tuple
from torch.nn import Module
from src.gradients.projection import RandomProjection


def flatten_gradients(model: Module) -> torch.Tensor:
    grads = []
    for param in model.parameters():
        if param.grad is not None:
            grads.append(param.grad.detach().view(-1).clone())
        else:
            grads.append(torch.zeros_like(param).view(-1))
    return torch.cat(grads)


def get_gradient_dim(model: Module) -> int:
    return sum(p.numel() for p in model.parameters())


def extract_single_example_gradient(
    model: Module,
    input_ids: torch.Tensor,
    labels: torch.Tensor,
    projector: Optional[RandomProjection] = None,
    device: str = "cpu",
    return_loss: bool = False
) -> torch.Tensor | Tuple[torch.Tensor, float]:
    """
    Compute gradient of one example.
    Optionally returns loss as well.
    """
    model.train()
    model.zero_grad()

    if input_ids.dim() == 1:
        input_ids = input_ids.unsqueeze(0)
    if labels.dim() == 1:
        labels = labels.unsqueeze(0)

    input_ids = input_ids.to(device)
    labels = labels.to(device)

    _, loss = model(input_ids, labels)
    loss.backward()

    grad_vector = flatten_gradients(model)

    model.zero_grad()
    model.eval()

    if projector is not None:
        grad_vector = projector.project(grad_vector)

    if return_loss:
        return grad_vector, loss.item()
    return grad_vector