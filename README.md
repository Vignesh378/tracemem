# TraceMem

**Precise Attribution of Memorized Generations in LLMs to Specific Training Examples via Fitting-Error-Corrected Scalable Influence Functions**

## Project Overview

TraceMem estimates which specific training examples most strongly influenced a generated output from a language model. It combines:

- Per-example gradient extraction
- Multi-checkpoint TracIn influence scoring
- Random Projection for scalability
- Fitting-error correction interface

## Current Prototype Status

This repository contains a fully working research prototype using a controlled synthetic language model. The architecture is designed to support real large language models when GPU resources and the original trained model become available.

### Implemented Components

- Model loading (multiple checkpoints)
- Dataset handling with stable example IDs
- Per-example gradient extraction
- Multi-checkpoint TracIn
- Random Projection (scalable influence)
- Influence ranking
- Result export (JSON)
- Fitting-error correction (clean placeholder)

## How to Run

```bash
# Activate environment
.venv\Scripts\Activate.ps1          # Windows
# source .venv/bin/activate         # Linux/macOS

# Run the full pipeline
python scripts/run_pipeline.py