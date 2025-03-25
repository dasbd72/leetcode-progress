# Scraper

## Operation Logs

- 2025-03-25: Change lambda architecture to use Graviton instances

    ```bash
    # Delete the old function
    aws lambda delete-function --function-name leetcode-progress-Scraper
    # Create a new function
    aws lambda create-function \
        --function-name leetcode-progress-Scraper-8CKRVA9MWN2Z \
        --runtime python3.10 \
        --role arn:aws:iam::${account_id}:role/leetcode-progress-ScraperRole \
        --handler main.lambda_handler \
        --zip-file fileb://scraper.zip \
        --architectures arm64
    aws lambda update-function-configuration \
        --function-name leetcode-progress-Scraper-8CKRVA9MWN2Z \
        --timeout 60
    # Attach the event bridge
    aws events put-targets \
        --rule leetcode-progress-ScrapeHourly \
        --targets "Id"="1","Arn"="arn:aws:lambda:ap-northeast-1:${account_id}:function:leetcode-progress-Scraper-8CKRVA9MWN2Z"
    aws lambda add-permission \
        --function-name leetcode-progress-Scraper-8CKRVA9MWN2Z \
        --statement-id AllowEventBridgeInvoke \
        --action 'lambda:InvokeFunction' \
        --principal events.amazonaws.com \
        --source-arn arn:aws:events:ap-northeast-1:${account_id}:rule/leetcode-progress-ScrapeHourly
    ```
