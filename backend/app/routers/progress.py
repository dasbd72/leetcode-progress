from datetime import datetime, timedelta
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


def fetch_usernames():
    response = users_table.scan()
    user_items = response.get("Items", [])
    return [user["username"] for user in user_items]


def fetch_all_timestamps():
    response = progress_table.scan(
        ProjectionExpression="#ts",
        ExpressionAttributeNames={"#ts": "timestamp"},
    )
    return sorted(
        set(
            int(item["timestamp"])
            for item in response["Items"]
            if "timestamp" in item
        )
    )


def fetch_progress_data(selected_timestamps, usernames):
    data = {}
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
    return data


def calculate_time_intervals(now, time_delta, limit):
    if time_delta >= timedelta(days=1):
        return [
            int(
                (now - time_delta * i)
                .replace(hour=0, minute=0, second=0, microsecond=0)
                .timestamp()
            )
            for i in range(limit - 1, -1, -1)
        ]
    else:
        return [
            int(
                (now - time_delta * i)
                .replace(minute=0, second=0, microsecond=0)
                .timestamp()
            )
            for i in range(limit - 1, -1, -1)
        ]


def get_progress_data(time_delta, limit, timezone_str="UTC"):
    data = {}
    performance = {
        "get_users": 0,
        "get_timestamp": 0,
        "find_timestamp": 0,
        "get_progress": 0,
    }

    start_perf = perf_counter()
    usernames = fetch_usernames()
    performance["get_users"] = perf_counter() - start_perf

    start_perf = perf_counter()
    all_timestamps = fetch_all_timestamps()
    performance["get_timestamp"] = perf_counter() - start_perf

    try:
        tz = pytz.timezone(timezone_str)
    except pytz.UnknownTimeZoneError:
        return {"error": f"Invalid timezone: {timezone_str}"}

    now = datetime.now(tz)
    start_perf = perf_counter()
    time_starts = calculate_time_intervals(now, time_delta, limit)
    selected_timestamps = []
    for time_start in time_starts:
        time_end = time_start + int(time_delta.total_seconds())
        candidates = [
            ts for ts in all_timestamps if time_start <= ts < time_end
        ]
        if candidates:
            selected_timestamps.append(min(candidates))
    if (
        len(all_timestamps) != 0
        and all_timestamps[-1] not in selected_timestamps
    ):
        selected_timestamps.append(all_timestamps[-1])
    performance["find_timestamp"] = perf_counter() - start_perf

    start_perf = perf_counter()
    data = fetch_progress_data(selected_timestamps, usernames)
    performance["get_progress"] = perf_counter() - start_perf

    return {"data": data, "performance": performance}


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
    time_delta = timedelta(hours=1)
    return get_progress_data(time_delta, limit)


@router.get("/latest/day")
def get_latest_daily_progress(
    limit: int = Query(
        24, description="Number of days to look back", ge=1, le=50
    ),
    timezone: str = Query(
        "UTC", description="Timezone name, e.g., 'Asia/Taipei'"
    ),
):
    time_delta = timedelta(days=1)
    return get_progress_data(time_delta, limit, timezone)

@router.get("/latest/interval")
def get_latest_interval_progress(
    hours: int = Query(1, description="Interval in hours", ge=1, le=24),
    limit: int = Query(
        24, description="Number of intervals to look back", ge=1, le=50
    ),
    timezone: str = Query(
        "UTC", description="Timezone name, e.g., 'Asia/Taipei'"
    ),
):
    time_delta = timedelta(hours=hours)
    return get_progress_data(time_delta, limit, timezone)
