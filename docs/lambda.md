# Lambda

## Scraper

```bash
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

# Attach the 20 minutes event bridge
# Create a new event
aws events put-rule \
    --name leetcode-progress-ScrapeEvery20Min \
    --schedule-expression "cron(0/20 * * * ? *)"
# Attach the event bridge
aws events put-targets \
    --rule leetcode-progress-ScrapeEvery20Min \
    --targets "Id"="1","Arn"="arn:aws:lambda:ap-northeast-1:${account_id}:function:leetcode-progress-Scraper-8CKRVA9MWN2Z"
# Add permission
aws lambda add-permission \
    --function-name leetcode-progress-Scraper-8CKRVA9MWN2Z \
    --statement-id AllowEventBridgeInvokeEvery20Min \
    --action 'lambda:InvokeFunction' \
    --principal events.amazonaws.com \
    --source-arn arn:aws:events:ap-northeast-1:${account_id}:rule/leetcode-progress-ScrapeEvery20Min
# Check the rule
aws events describe-rule --name leetcode-progress-ScrapeEvery20Min
# Disable old event
aws events disable-rule --name leetcode-progress-ScrapeHourly
```
