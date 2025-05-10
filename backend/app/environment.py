import os


class Environment:
    production: bool = os.environ.get("PRODUCTION", "true").lower() == "true"
    allowed_origins: list[str] = os.environ.get(
        "ALLOWED_ORIGINS",
        "https://leetcode-progress.dasbd72.com,https://d36dg9dunac222.cloudfront.net",
    ).split(",")
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


environment = Environment()

print(f"allowed_origins: {environment.allowed_origins}")
