"""
Rank training examples by influence
"""

from typing import List, Dict, Any


def rank_examples(
    scored_examples: List[Dict[str, Any]],
    top_k: int = 10,
    mode: str = "positive"
) -> List[Dict[str, Any]]:
    if mode == "absolute":
        ranked = sorted(scored_examples, key=lambda x: abs(x["influence"]), reverse=True)
    else:
        ranked = sorted(scored_examples, key=lambda x: x["influence"], reverse=True)
    return ranked[:top_k]