import json
from datetime import datetime, timedelta

import boto3

s3 = boto3.client("s3")
BUCKET = "leetcode-progress-cache"
CACHE_KEY = "latest.json"
CACHE_TTL_MINUTES = 60  # e.g., cache for 1 hour


def is_cache_fresh():
    try:
        metadata = s3.head_object(Bucket=BUCKET, Key=CACHE_KEY)
        last_modified = metadata["LastModified"]
        age = datetime.now() - last_modified.replace(tzinfo=None)
        return age < timedelta(minutes=CACHE_TTL_MINUTES)
    except Exception:
        return False


def get_cache():
    cached_data = s3.get_object(Bucket=BUCKET, Key=CACHE_KEY)
    return json.loads(cached_data["Body"].read().decode("utf-8"))


def put_cache(data):
    s3.put_object(
        Bucket=BUCKET,
        Key=CACHE_KEY,
        Body=json.dumps(data),
        ContentType="application/json",
    )
