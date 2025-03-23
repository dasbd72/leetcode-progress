#!/bin/bash
pip install -r requirements.txt -t package/
cp main.py utils.py package/
cd package
zip -r -q ../scraper.zip .
cd ..
# update the lambda function
aws lambda update-function-code \
  --function-name leetcode-progress-Scraper \
  --zip-file fileb://scraper.zip \
