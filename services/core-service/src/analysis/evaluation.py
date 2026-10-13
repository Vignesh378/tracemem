"""
Evaluation metrics for attribution quality
"""

from typing import List, Dict, Any


def precision_at_k(ranked: List[Dict], relevant_ids: set, k: int) -> float:
    top_k_ids = {item["id"] for item in ranked[:k]}
    if k == 0:
        return 0.0
    return len(top_k_ids & relevant_ids) / k


def recall_at_k(ranked: List[Dict], relevant_ids: set, k: int) -> float:
    if not relevant_ids:
        return 0.0
    top_k_ids = {item["id"] for item in ranked[:k]}
    return len(top_k_ids & relevant_ids) / len(relevant_ids)


def mean_reciprocal_rank(ranked: List[Dict], relevant_ids: set) -> float:
    for i, item in enumerate(ranked, 1):
        if item["id"] in relevant_ids:
            return 1.0 / i
    return 0.0


def evaluate_attribution(ranked: List[Dict], relevant_ids: set, ks=(1, 3, 5, 10)):
    results = {}
    for k in ks:
        results[f"P@{k}"] = precision_at_k(ranked, relevant_ids, k)
        results[f"R@{k}"] = recall_at_k(ranked, relevant_ids, k)
    results["MRR"] = mean_reciprocal_rank(ranked, relevant_ids)
    return results