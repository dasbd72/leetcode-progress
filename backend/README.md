# Backend

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
