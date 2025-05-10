import json
import os
from datetime import datetime, timedelta
import urllib.parse

import boto3
import pytz
from environment import environment

s3 = boto3.client("s3")
CACHE_TTL = int(os.environ.get("CACHE_TTL", "60"))  # e.g., cache for 1 hour


def encode_cache_key(key: str) -> str:
    """
    Encode the cache key to be used in S3.
    This is a simple example; you might want to use a more robust encoding scheme.
    """
    return urllib.parse.quote_plus(key, safe="")


def is_cache_fresh(cache_key: str, ttl: int = CACHE_TTL) -> bool:
    cache_key = encode_cache_key(cache_key)
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
    cache_key = encode_cache_key(cache_key)
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
    cache_key = encode_cache_key(cache_key)
    if not environment.production:
        return
    s3.put_object(
        Bucket=environment.cache_bucket_name,
        Key=cache_key,
        Body=json.dumps(data),
        ContentType="application/json",
    )
