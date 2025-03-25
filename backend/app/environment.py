import os


class Environment:
    allowed_origins: list[str] = []


ENV: str = os.getenv("environment", "production")

environment = Environment()

if ENV == "production":
    environment.allowed_origins = [
        "leetcode-progress.s3-website-ap-northeast-1.amazonaws.com",
        "d2nwgjwnrp77m0.cloudfront.net",
        "leetcode-progress.dasbd72.com",
    ]
else:
    environment.allowed_origins = ["*"]

print(f"allowed_origins: {environment.allowed_origins}")
