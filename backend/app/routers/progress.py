from datetime import datetime, timedelta
from time import perf_counter

import boto3
import cache
import pytz
from boto3.dynamodb.conditions import Key
from fastapi import APIRouter, Query

router = APIRouter()

dynamodb = boto3.resource("dynamodb")
progress_table = dynamodb.Table("LeetCodeProgress-s8nczw")
users_table = dynamodb.Table("LeetCodeProgressUsers")


def get_latest_timestamp() -> int | None:
    # Scan to get the latest timestamp value
    response = progress_table.scan(
        ProjectionExpression="#ts",
        ExpressionAttributeNames={"#ts": "timestamp"},
    )
    timestamps = [
        item["timestamp"] for item in response["Items"] if "timestamp" in item
    ]
    return max(timestamps) if timestamps else None


def fetch_usernames() -> list[str]:
    response = users_table.scan()
    user_items = response.get("Items", [])
    usernames = list(set([user["leetcode_username"] for user in user_items]))
    usernames = sorted(usernames)
    return usernames


def fetch_timestamps(
    username: str, time_delta: timedelta, limit: int, now: datetime
) -> list[int]:
    end_time = int(now.timestamp())
    start_time = int((now - time_delta * limit).timestamp())

    response = progress_table.query(
        KeyConditionExpression=Key("username").eq(username)
        & Key("timestamp").between(start_time, end_time),
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


def fetch_progress_data(
    all_selected_timestamps: dict[str, dict[int, int]],
) -> dict:
    """Fetches user progress data for the given timestamps.

    Args:
        all_selected_timestamps (dict[str, dict[int, int]]): A dictionary mapping usernames to their selected timestamps.

    Returns:
        dict: A dictionary containing the progress data for each user.
    """
    data = {}

    # Flatten the request keys for batch processing
    request_keys = [
        {"username": username, "timestamp": ts}
        for username, selected_timestamps in all_selected_timestamps.items()
        for ts in selected_timestamps.keys()
    ]
    # Split the request keys into batches of 100 to avoid exceeding the limit
    for i in range(0, len(request_keys), 100):
        batch_request_keys = request_keys[i : i + 100]
        response = dynamodb.meta.client.batch_get_item(
            RequestItems={
                progress_table.name: {
                    "Keys": batch_request_keys,
                    "ProjectionExpression": "#ts, username, easy, medium, hard, #ttl",
                    "ExpressionAttributeNames": {
                        "#ts": "timestamp",
                        "#ttl": "total",
                    },
                }
            }
        )
        for item in response["Responses"].get(progress_table.name, []):
            username = item["username"]
            ts = all_selected_timestamps[username][item["timestamp"]]
            if ts not in data:
                data[ts] = {}
            data[ts][username] = {
                "easy": int(item.get("easy", 0)),
                "medium": int(item.get("medium", 0)),
                "hard": int(item.get("hard", 0)),
                "total": int(item.get("total", 0)),
            }

    return data


def calculate_time_intervals(
    now: datetime, time_delta: timedelta, limit: int
) -> list[int]:
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


def get_progress_data(
    time_delta: timedelta, limit: int, timezone_str: str = "UTC"
) -> dict:
    # Fetch the data from the cache if available
    cache_key = f"progress:get_progress_data:{int(time_delta.total_seconds())}:{limit}:{timezone_str}"
    if cache.is_cache_fresh(cache_key, ttl=300):
        cached_data = cache.get_cache(cache_key)
        if cached_data:
            cached_data["source"] = "cache"
            return cached_data

    # If cache is not fresh, fetch the data
    data = {}
    performance = {
        "get_users": 0,
        "get_timestamp": 0,
        "find_timestamp": 0,
        "get_progress": 0,
    }

    try:
        tz = pytz.timezone(timezone_str)
    except pytz.UnknownTimeZoneError:
        return {"error": f"Invalid timezone: {timezone_str}"}
    now = datetime.now(tz)

    start_perf = perf_counter()
    usernames = fetch_usernames()
    performance["get_users"] = perf_counter() - start_perf

    # Calculate the time intervals for alignment
    time_starts = calculate_time_intervals(now, time_delta, limit)

    # Select and align timestamps for each user
    is_latest_added = False
    all_selected_timestamps = {}
    for username in usernames:
        # Fetch all timestamps for the user
        start_perf = perf_counter()
        all_timestamps = fetch_timestamps(username, time_delta, limit, now)
        performance["get_timestamp"] += perf_counter() - start_perf

        # Find the timestamps that fall within the time intervals
        # and align them with the start of the intervals
        start_perf = perf_counter()
        time_delta_seconds = int(time_delta.total_seconds())
        selected_timestamps = {}
        for time_start in time_starts:
            time_end = time_start + time_delta_seconds
            candidates = [
                ts for ts in all_timestamps if time_start <= ts < time_end
            ]
            if candidates:
                selected_timestamps[min(candidates)] = time_start
        # If the last timestamp is not in the selected timestamps, add it
        if all_timestamps and all_timestamps[-1] not in selected_timestamps:
            is_latest_added = True
            selected_timestamps[all_timestamps[-1]] = int(now.timestamp())
        all_selected_timestamps[username] = selected_timestamps
        performance["find_timestamp"] += perf_counter() - start_perf

    # Fetch the progress data for all users
    start_perf = perf_counter()
    data = fetch_progress_data(all_selected_timestamps)
    # Duplicate the last timestamp if not added
    if not is_latest_added and data:
        last_timestamp = max(data.keys())
        data[now.timestamp()] = data[last_timestamp]
    performance["get_progress"] += perf_counter() - start_perf

    # Sort the data by timestamp
    data = dict(sorted(data.items()))
    # Fill in missing timestamps with first value for each user
    for username in all_selected_timestamps:
        first_data = None
        for ts in data:
            if username in data[ts]:
                first_data = ts
                break
        if first_data is None:
            continue
        for ts in data:
            if username not in data[ts]:
                data[ts][username] = data[first_data][username]

    response = {
        "data": data,
        "performance": performance,
        "usernames": usernames,
        "source": "dynamodb",
    }

    # Store the data in the cache
    cache.put_cache(cache_key, response)
    return response


@router.get("/")
@router.get("/latest")
def get_latest_user_progress():
    # Fetch the data from the cache if available
    cache_key = "progress:get_latest_user_progress"
    if cache.is_cache_fresh(cache_key, ttl=300):
        cached_data = cache.get_cache(cache_key)
        if cached_data:
            cached_data["source"] = "cache"
            return cached_data

    # If cache is not fresh, fetch the data
    data = {}
    performance = {
        "get_users": 0,
        "get_progress": 0,
    }

    start_perf = perf_counter()
    usernames = fetch_usernames()
    performance["get_users"] = perf_counter() - start_perf

    # Fetch the latest progress data for each user
    start_perf = perf_counter()
    for username in usernames:
        response = progress_table.query(
            KeyConditionExpression=Key("username").eq(username),
            Limit=1,
            ScanIndexForward=False,  # Sort by timestamp descending
        )
        items = response.get("Items", [])
        if items:
            item = items[0]
            data[username] = {
                "timestamp": int(item.get("timestamp", 0)),
                "easy": int(item.get("easy", 0)),
                "medium": int(item.get("medium", 0)),
                "hard": int(item.get("hard", 0)),
                "total": int(item.get("total", 0)),
            }
    # Sort the data by username
    data = dict(sorted(data.items()))
    performance["get_progress"] = perf_counter() - start_perf

    response = {
        "data": data,
        "usernames": usernames,
        "source": "dynamodb",
    }

    # Store the data in the cache
    cache.put_cache(cache_key, response)
    return response


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
