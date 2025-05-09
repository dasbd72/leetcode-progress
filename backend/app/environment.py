import os


class Environment:
    production: bool = False
    allowed_origins: list[str] = []
    client_id: str = ""
    cognito_idp_url: str = ""
    users_table_name: str = os.environ.get(
        "USERS_TABLE_NAME", "LeetCodeProgressUsers-1746776519"
    )
    progress_table_name: str = os.environ.get(
        "PROGRESS_TABLE_NAME", "LeetCodeProgressData-1746776519"
    )
    cache_bucket_name: str = os.environ.get(
        "CACHE_BUCKET_NAME",
        "leetcode-progress-cache-718795813953-ap-northeast-1",
    )


ENV: str = os.getenv("environment", "production")

environment = Environment()

if ENV == "production":
    environment.production = True
    environment.allowed_origins = [
        "https://leetcode-progress.dasbd72.com",
        "https://d36dg9dunac222.cloudfront.net",
    ]
else:
    environment.production = False
    environment.allowed_origins = ["*"]

print(f"allowed_origins: {environment.allowed_origins}")
