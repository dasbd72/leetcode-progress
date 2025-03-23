from datetime import datetime, timedelta, timezone
from fastapi import APIRouter
import boto3
from boto3.dynamodb.conditions import Key

router = APIRouter()

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("LeetCodeProgress")


def get_latest_timestamp():
    # Scan to get the latest timestamp value
    response = table.scan(
        ProjectionExpression="#ts",
        ExpressionAttributeNames={"#ts": "timestamp"},
    )
    timestamps = [
        item["timestamp"] for item in response["Items"] if "timestamp" in item
    ]
    return max(timestamps) if timestamps else None


@router.get("/")
@router.get("/latest")
def get_latest_user_progress():
    latest_ts = get_latest_timestamp()
    if not latest_ts:
        return {}

    response = table.query(
        KeyConditionExpression=Key("timestamp").eq(latest_ts)
    )

    result = {}
    for item in response["Items"]:
        result[item["username"]] = {
            "easy": item.get("easy", 0),
            "medium": item.get("medium", 0),
            "hard": item.get("hard", 0),
            "total": item.get("total", 0),
        }

    return result


@router.get("/latest/hour")
def get_latest_hourly_progress():
    # Step 1: Scan all timestamps
    response = table.scan(
        ProjectionExpression="#ts",
        ExpressionAttributeNames={"#ts": "timestamp"},
    )
    all_timestamps = sorted(
        set(
            int(item["timestamp"])
            for item in response["Items"]
            if "timestamp" in item
        )
    )

    now = datetime.now(timezone.utc)
    hour_starts = [
        int(
            (now - timedelta(hours=i))
            .replace(minute=0, second=0, microsecond=0)
            .timestamp()
        )
        for i in range(50)
    ]

    # Step 2: For each hour, find the earliest timestamp that falls within it
    selected_timestamps = []
    for hour_start in hour_starts:
        hour_end = hour_start + 3600
        candidates = [
            ts for ts in all_timestamps if hour_start <= ts < hour_end
        ]
        if candidates:
            selected_timestamps.append(min(candidates))

    # Step 3: For each selected timestamp, fetch all user data
    result = {}
    for ts in selected_timestamps:
        response = table.query(KeyConditionExpression=Key("timestamp").eq(ts))
        user_entries = {}
        for item in response["Items"]:
            user_entries[item["username"]] = {
                "easy": item.get("easy", 0),
                "medium": item.get("medium", 0),
                "hard": item.get("hard", 0),
                "total": item.get("total", 0),
            }
        result[str(ts)] = user_entries

    return result


@router.get("/latest/day")
def get_latest_daily_progress():
    # Step 1: Scan all timestamps
    response = table.scan(
        ProjectionExpression="#ts",
        ExpressionAttributeNames={"#ts": "timestamp"},
    )
    all_timestamps = sorted(
        set(
            int(item["timestamp"])
            for item in response["Items"]
            if "timestamp" in item
        )
    )

    now = datetime.now(timezone.utc)
    day_starts = [
        int(
            (now - timedelta(days=i))
            .replace(hour=0, minute=0, second=0, microsecond=0)
            .timestamp()
        )
        for i in range(50)
    ]

    # Step 2: For each day, find the earliest timestamp that falls within it
    selected_timestamps = []
    for day_start in day_starts:
        day_end = day_start + 86400
        candidates = [ts for ts in all_timestamps if day_start <= ts < day_end]
        if candidates:
            selected_timestamps.append(min(candidates))

    # Step 3: For each selected timestamp, fetch all user data
    result = {}
    for ts in selected_timestamps:
        response = table.query(KeyConditionExpression=Key("timestamp").eq(ts))
        user_entries = {}
        for item in response["Items"]:
            user_entries[item["username"]] = {
                "easy": item.get("easy", 0),
                "medium": item.get("medium", 0),
                "hard": item.get("hard", 0),
                "total": item.get("total", 0),
            }
        result[str(ts)] = user_entries

    return result
