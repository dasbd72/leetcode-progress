# DynamoDB

## LeetCodeProgressUsers Table

Creation

```bash
aws dynamodb create-table \
    --table-name LeetCodeProgressUsers \
    --attribute-definitions \
        AttributeName=username,AttributeType=S \
    --key-schema \
        AttributeName=username,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
```

Add index

```bash
aws dynamodb update-table \
    --table-name LeetCodeProgressUsers \
    --attribute-definitions \
        AttributeName=leetcode_username,AttributeType=S \
    --global-secondary-index-updates \
        '[{"Create":{"IndexName":"LeetCodeUsernameIndex","KeySchema":[{"AttributeName":"leetcode_username","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}}]'
```

## LeetCodeProgress-s8nczw Table

Creation

```bash
aws dynamodb create-table \
    --table-name LeetCodeProgress-s8nczw \
    --attribute-definitions \
        AttributeName=username,AttributeType=S \
        AttributeName=timestamp,AttributeType=N \
    --key-schema \
        AttributeName=username,KeyType=HASH \
        AttributeName=timestamp,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST
```
