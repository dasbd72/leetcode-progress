# LeetCode Progress

Tracks your LeetCode progress.

## Website

[LeetCode Progress](https://leetcode-progress.dasbd72.com/)

## Tech Stack

- Frontend
  - React + TypeScript + Vite
  - Tailwind CSS v4
  - AWS S3
  - AWS CloudFront
  - AWS Cognito
  - Google OAuth
- Backend
  - Python
  - AWS Lambda
  - AWS DynamoDB
  - AWS API Gateway
- Scraper
  - Python
  - AWS Lambda
  - AWS DynamoDB
  - AWS EventBridge
- Infra
  - AWS CDK (Python)
  - GitHub Actions (CI + deploy on push to `main`)

## Development

The Python projects (`backend`, `scraper`, `cdk`) are managed as a single
[uv](https://docs.astral.sh/uv/) workspace at the repo root, sharing one
`uv.lock`. Python is pinned to **3.12** via `.python-version` (uv fetches it
automatically).

```bash
uv sync --all-packages   # set up the shared .venv for all members
uv run ruff check        # lint (Ruff replaces black/flake8/isort)
uv run ruff format       # format
```

Pre-commit runs Ruff and a hook that keeps each Lambda layer's generated
`requirements.txt` in sync with `uv.lock`:

```bash
uvx pre-commit install
```

See `cdk/README.md` for synth/deploy, `backend/README.md` for running the API
locally, and `frontend/README.md` for the frontend dev server and build.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which typechecks,
lints, and tests the frontend and Python workspace, builds the frontend, then
runs `cdk deploy --all` for all four stacks (resources, scraper, backend,
frontend) via an AWS OIDC role (`AWS_DEPLOY_ROLE_ARN` repo secret — no long-lived
AWS credentials stored in GitHub).

## TODOs

- [x] Backend to scrape specified users' progress from LeetCode.
- [x] Frontend to display users' LeetCode progress in a table.
- [x] Deploy to AWS Lambda amd AWS S3.
- [x] Added simple cache for lambda with s3 to save costs.
- [x] Sorts users by their LeetCode progress.
- [x] Migrate to my domain.
- [x] Support local development testing.
- [x] Add database for storing the scraped data.
- [x] Separate the scraping trigger to a periodically running Lambda function.
- [x] Add chart to show daily progress.
- [x] Add chart to show weekly progress.
- [x] Store list of users in database.
- [x] Add latest data to chart instead of only the specified timestamps.
- [x] Optimize db query progress by using batch get item.
- [ ] Reduce REST API response data size.
- [x] Add user system to allow users to add their own LeetCode accounts.
  - [x] Google OAuth
  - [x] Add user information to the database.
- [ ] Add start date option for the chart.
- [ ] Make timestamps constant in 10 minutes intervals to reduce timestamp search operation.
- [x] Setup CDK for all AWS resources.
- [x] Enable user following.
- [x] Automate deploys via GitHub Actions on push to `main`.
