import json
import os
from datetime import datetime, timedelta

import boto3
import pytz
from environment import environment

s3 = boto3.client("s3")
CACHE_TTL = int(os.environ.get("CACHE_TTL", "60"))  # e.g., cache for 1 hour


def is_cache_fresh(cache_key: str, ttl: int = CACHE_TTL) -> bool:
    if not environment.production:
        return False
    try:
        tz = pytz.timezone("UTC")
        metadata = s3.head_object(
            Bucket=environment.cache_bucket_name, Key=cache_key
        )
        last_modified = metadata["LastModified"]
        age = datetime.now(tz=tz) - last_modified.replace(tzinfo=tz)
        return age < timedelta(seconds=ttl)
    except Exception:
        return False


def get_cache(cache_key: str) -> dict | None:
    if not environment.production:
        return
    try:
        cached_data = s3.get_object(
            Bucket=environment.cache_bucket_name, Key=cache_key
        )
        return json.loads(cached_data["Body"].read().decode("utf-8"))
    except Exception:
        return None


def put_cache(cache_key: str, data: dict) -> None:
    if not environment.production:
        return
    s3.put_object(
        Bucket=environment.cache_bucket_name,
        Key=cache_key,
        Body=json.dumps(data),
        ContentType="application/json",
    )
