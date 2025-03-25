from datetime import datetime, timedelta, timezone
from time import perf_counter

import boto3
import pytz
from boto3.dynamodb.conditions import Key
from fastapi import APIRouter, Query

router = APIRouter()

dynamodb = boto3.resource("dynamodb")
progress_table = dynamodb.Table("LeetCodeProgress")
users_table = dynamodb.Table("LeetCodeProgressUsers")


def get_latest_timestamp():
    # Scan to get the latest timestamp value
    response = progress_table.scan(
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

    response = progress_table.query(
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
def get_latest_hourly_progress(
    limit: int = Query(
        24, description="Number of hours to look back", ge=1, le=50
    )
):
    data = {}
    performance = {
        "get_users": 0,
        "get_timestamp": 0,
        "find_timestamp": 0,
        "get_progress": 0,
    }

    # Step 1: Fetch all usernames
    start_perf = perf_counter()
    response = users_table.scan()
    user_items = response.get("Items", [])
    usernames = [user["username"] for user in user_items]
    performance["get_users"] = perf_counter() - start_perf

    # Step 2: Scan all timestamps
    start_perf = perf_counter()
    response = progress_table.scan(
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
    performance["get_timestamp"] = perf_counter() - start_perf

    # Step 3: Calculate hour start times
    now = datetime.now(timezone.utc)
    hour_starts = [
        int(
            (now - timedelta(hours=i))
            .replace(minute=0, second=0, microsecond=0)
            .timestamp()
        )
        for i in range(limit - 1, -1, -1)
    ]

    # Step 4: For each hour, find the earliest timestamp that falls within it
    start_perf = perf_counter()
    selected_timestamps = []
    for hour_start in hour_starts:
        hour_end = hour_start + 3600
        candidates = [
            ts for ts in all_timestamps if hour_start <= ts < hour_end
        ]
        if candidates:
            selected_timestamps.append(min(candidates))
    if (
        len(all_timestamps) != 0
        and all_timestamps[-1] not in selected_timestamps
    ):
        selected_timestamps.append(all_timestamps[-1])
    performance["find_timestamp"] = perf_counter() - start_perf

    # Step 5: For each selected timestamp, fetch all user data
    start_perf = perf_counter()
    # Build a list of request keys for batch_get_item
    request_keys = [
        {"timestamp": ts, "username": username}
        for ts in selected_timestamps
        for username in usernames
    ]
    # Split the request keys into batches of 100 to avoid exceeding the limit
    request_batches = [
        request_keys[i : i + 100] for i in range(0, len(request_keys), 100)
    ]
    for batch in request_batches:
        response = dynamodb.meta.client.batch_get_item(
            RequestItems={
                progress_table.name: {
                    "Keys": batch,
                    "ProjectionExpression": "#ts, username, easy, medium, hard, #ttl",
                    "ExpressionAttributeNames": {
                        "#ts": "timestamp",
                        "#ttl": "total",
                    },
                }
            }
        )
        for item in response["Responses"].get(progress_table.name, []):
            ts = str(item["timestamp"])
            if ts not in data:
                data[ts] = {}
            data[ts][item["username"]] = {
                "easy": item.get("easy", 0),
                "medium": item.get("medium", 0),
                "hard": item.get("hard", 0),
                "total": item.get("total", 0),
            }
    performance["get_progress"] = perf_counter() - start_perf

    return {"data": data, "performance": performance}


@router.get("/latest/day")
def get_latest_daily_progress(
    limit: int = Query(
        24, description="Number of days to look back", ge=1, le=50
    ),
    timezone: str = Query(
        "UTC", description="Timezone name, e.g., 'Asia/Taipei'"
    ),
):
    data = {}
    performance = {
        "get_users": 0,
        "get_timestamp": 0,
        "find_timestamp": 0,
        "get_progress": 0,
    }

    try:
        tz = pytz.timezone(timezone)
    except pytz.UnknownTimeZoneError:
        return {"error": f"Invalid timezone: {timezone}"}

    # Step 1: Fetch all usernames
    start_perf = perf_counter()
    response = users_table.scan()
    user_items = response.get("Items", [])
    usernames = [user["username"] for user in user_items]
    performance["get_users"] = perf_counter() - start_perf

    # Step 2: Scan all timestamps
    start_perf = perf_counter()
    response = progress_table.scan(
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
    performance["get_timestamp"] = perf_counter() - start_perf

    # Step 3: Calculate day start times in specified timezone
    now = datetime.now(tz)
    day_starts = [
        int(
            (now - timedelta(days=i))
            .replace(hour=0, minute=0, second=0, microsecond=0)
            .timestamp()
        )
        for i in range(limit - 1, -1, -1)
    ]

    # Step 4: Find the earliest timestamp for each day
    start_perf = perf_counter()
    selected_timestamps = []
    for day_start in day_starts:
        day_end = day_start + 86400
        candidates = [ts for ts in all_timestamps if day_start <= ts < day_end]
        if candidates:
            selected_timestamps.append(min(candidates))
    if (
        len(all_timestamps) != 0
        and all_timestamps[-1] not in selected_timestamps
    ):
        selected_timestamps.append(all_timestamps[-1])
    performance["find_timestamp"] = perf_counter() - start_perf

    # Step 5: Use batch_get_item for efficiency
    start_perf = perf_counter()
    request_keys = [
        {"timestamp": ts, "username": username}
        for ts in selected_timestamps
        for username in usernames
    ]
    request_batches = [
        request_keys[i : i + 100] for i in range(0, len(request_keys), 100)
    ]
    for batch in request_batches:
        response = dynamodb.meta.client.batch_get_item(
            RequestItems={
                progress_table.name: {
                    "Keys": batch,
                    "ProjectionExpression": "#ts, username, easy, medium, hard, #ttl",
                    "ExpressionAttributeNames": {
                        "#ts": "timestamp",
                        "#ttl": "total",
                    },
                }
            }
        )
        for item in response["Responses"].get(progress_table.name, []):
            ts = str(item["timestamp"])
            if ts not in data:
                data[ts] = {}
            data[ts][item["username"]] = {
                "easy": item.get("easy", 0),
                "medium": item.get("medium", 0),
                "hard": item.get("hard", 0),
                "total": item.get("total", 0),
            }
    performance["get_progress"] = perf_counter() - start_perf

    return {"data": data, "performance": performance}
