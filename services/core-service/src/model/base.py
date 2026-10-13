"""
Abstract interface for any language model used in TraceMem.
This allows us to support both the synthetic TinyGPT and real LLMs later.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Tuple
import torch
import torch.nn as nn

class BaseLanguageModel(ABC):
    """
    Any model used in TraceMem must implement this interface.
    """

    @abstractmethod
    def forward(self, input_ids: torch.Tensor, labels: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, Optional[torch.Tensor]]:
        """
        Returns:
            logits, loss (loss is None if labels is None)
        """
        pass

    @abstractmethod
    def generate(self, input_ids: torch.Tensor, max_new_tokens: int = 30) -> torch.Tensor:
        pass

    @property
    @abstractmethod
    def device(self) -> torch.device:
        pass

    def parameters(self):
        """Return model parameters (for gradient extraction)."""
        return self.model.parameters() if hasattr(self, "model") else super().parameters()

    def zero_grad(self):
        if hasattr(self, "model"):
            self.model.zero_grad()
        else:
            for p in self.parameters():
                if p.grad is not None:
                    p.grad = None

    def train(self):
        if hasattr(self, "model"):
            self.model.train()
        else:
            super().train()

    def eval(self):
        if hasattr(self, "model"):
            self.model.eval()
        else:
            super().eval()