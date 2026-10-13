"""
Random Projection for scalable influence
"""

import torch
from pathlib import Path


class RandomProjection:
    def __init__(
        self,
        original_dim: int,
        projected_dim: int = 256,
        seed: int = 42,
        device: str = "cpu"
    ):
        self.original_dim = original_dim
        self.projected_dim = projected_dim
        self.device = device
        self.seed = seed

        torch.manual_seed(seed)
        self.projection_matrix = torch.randn(
            projected_dim, original_dim, device=device
        ) / (projected_dim ** 0.5)

        print(f"[RandomProjection] {original_dim:,} -> {projected_dim:,} dims "
      f"(~{original_dim / projected_dim:.1f}x reduction)")

    def project(self, gradient: torch.Tensor) -> torch.Tensor:
        if gradient.dim() != 1:
            gradient = gradient.view(-1)
        if gradient.shape[0] != self.original_dim:
            raise ValueError(
                f"Expected gradient dim {self.original_dim}, got {gradient.shape[0]}"
            )
        return self.projection_matrix @ gradient.to(self.device)

    def save(self, path: str):
        torch.save({
            "projection_matrix": self.projection_matrix.cpu(),
            "original_dim": self.original_dim,
            "projected_dim": self.projected_dim,
            "seed": self.seed
        }, path)

    @classmethod
    def load(cls, path: str, device: str = "cpu"):
        data = torch.load(path, map_location=device, weights_only=False)
        obj = cls.__new__(cls)
        obj.original_dim = data["original_dim"]
        obj.projected_dim = data["projected_dim"]
        obj.seed = data["seed"]
        obj.device = device
        obj.projection_matrix = data["projection_matrix"].to(device)
        return obj