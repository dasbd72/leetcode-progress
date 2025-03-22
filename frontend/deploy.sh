ng build --configuration production
aws s3 sync dist/frontend/browser s3://leetcode-progress/
