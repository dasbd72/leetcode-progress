# CDK — LeetCode Progress infrastructure

AWS CDK (Python) app that provisions the LeetCode Progress resources, scraper
Lambda, backend Lambda + API Gateway, and the frontend S3 bucket + CloudFront
distribution.

## Prerequisites

- [uv](https://docs.astral.sh/uv/) (manages Python + dependencies)
- Docker (used by CDK to bundle the Lambda layers)
- The AWS CDK Toolkit (`cdk`) and configured AWS credentials

Python is pinned to **3.12** via the repo-root `.python-version`; uv fetches it
automatically, so you do **not** need a system Python 3.12.

## Setup

Dependencies are managed by the uv workspace at the repository root (members:
`backend`, `scraper`, `cdk`). From the repo root:

```bash
uv sync --all-packages
```

This creates a single `.venv` at the repo root shared by all members.

## Usage

Run CDK commands from this directory. `cdk.json` runs the app via
`uv run python app.py`, so the workspace environment is used automatically:

```bash
cd cdk
uv run cdk synth     # synthesize CloudFormation (bundles Lambda layers via Docker)
uv run cdk diff      # compare against the deployed stacks
uv run cdk deploy    # deploy to the configured AWS account/region
uv run cdk ls        # list stacks
```

## Dependencies & Lambda layers

- Add or change dependencies by editing the relevant `pyproject.toml`
  (`backend/`, `scraper/`, or `cdk/`), then run `uv lock` and
  `uv sync --all-packages`.
- The Lambda layer `requirements.txt` files (`backend/layer/requirements.txt`,
  `scraper/layer/requirements.txt`) are **generated** from `uv.lock` — do not
  edit them by hand. A pre-commit hook regenerates them and fails the commit if
  they are stale (see `scripts/check-layer-requirements.sh`). CDK bundles each
  layer by `pip install`-ing its generated `requirements.txt` inside the
  Python 3.12 image, so deploys never require uv.
