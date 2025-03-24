ng build --configuration=production --source-map
aws s3 sync dist/frontend/browser s3://leetcode-progress/ --delete
