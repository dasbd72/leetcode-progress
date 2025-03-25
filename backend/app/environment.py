import os


class Environment:
    allowed_origins: list[str] = []


ENV: str = os.getenv("environment", "production")

environment = Environment()

if ENV == "production":
    environment.allowed_origins = [
        "https://leetcode-progress.s3-website-ap-northeast-1.amazonaws.com",
        "http://leetcode-progress.s3-website-ap-northeast-1.amazonaws.com",
        "https://d2nwgjwnrp77m0.cloudfront.net",
        "https://leetcode-progress.dasbd72.com",
    ]
else:
    environment.allowed_origins = ["*"]

print(f"allowed_origins: {environment.allowed_origins}")
