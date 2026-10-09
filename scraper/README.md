# Scraper

Scheduled AWS Lambda (EventBridge, every 20 minutes) that scrapes followed
users' LeetCode progress into DynamoDB.

## Development

Dependencies are managed by the uv workspace at the repository root (Python
pinned to 3.12). From the repo root:

```bash
uv sync --all-packages
```

Runtime dependencies live in `scraper/pyproject.toml`. The
`scraper/layer/requirements.txt` bundled into the Lambda layer is **generated**
from `uv.lock` (do not edit by hand) and kept fresh by a pre-commit hook.
