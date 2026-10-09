# Backend

FastAPI app deployed to AWS Lambda (via Mangum) behind API Gateway.

## Development

Dependencies are managed by the uv workspace at the repository root (Python is
pinned to 3.12 via `.python-version`; uv fetches it automatically). From the
repo root:

```bash
uv sync --all-packages
```

Serve the API locally (run from this `backend/` directory — the script
`chdir`s into `app/` and sets development env vars):

```bash
cd backend
uv run python scripts/serve.py
```

Runtime dependencies live in `backend/pyproject.toml`. After changing them, run
`uv lock`; the `backend/layer/requirements.txt` bundled into the Lambda layer is
**generated** from `uv.lock` (do not edit by hand) and kept fresh by a
pre-commit hook.

## Operation Logs

- 2025-03-25: Add scan and batchGetItem permission

    ```bash
    account_id=$(aws sts get-caller-identity --query Account --output text)
    aws iam put-role-policy \
        --role-name leetcode-progress-FastApiFunctionRole-VZ5woF93EfEa \
        --policy-name AllowDynamoDBAccess \
        --policy-document '{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:Scan",
                        "dynamodb:Query",
                        "dynamodb:BatchGetItem"
                    ],
                    "Resource": "arn:aws:dynamodb:ap-northeast-1:'${account_id}':table/LeetCodeProgress"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:Scan"
                    ],
                    "Resource": "arn:aws:dynamodb:ap-northeast-1:'${account_id}':table/LeetCodeProgressUsers"
                }
            ]
        }'
    ```
