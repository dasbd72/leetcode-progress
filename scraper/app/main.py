from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from time import perf_counter

import boto3
from utils import fetch_question_progress

# DynamoDB setup
dynamodb = boto3.resource("dynamodb")
progress_table = dynamodb.Table("LeetCodeProgress-s8nczw")
users_table = dynamodb.Table("LeetCodeProgressUsers")


def lambda_handler(event, context):
    timestamp = int(datetime.now(timezone.utc).timestamp())
    fetch_count = 0
    update_count = 0
    result = {}
    performance = {
        "get_users": 0,
        "fetch_progress": 0,
        "put_progress": 0,
        "update_user_latest": 0,
    }
    errors = []

    # Fetch all usernames and slugs from LeetCodeProgressUsers
    start_perf = perf_counter()
    users_response = users_table.scan()
    user_items = users_response.get("Items", [])
    leetcode_usernames = list(
        set(user["leetcode_username"] for user in user_items)
    )
    performance["get_users"] = perf_counter() - start_perf

    # Fetch progress for each user
    start_perf = perf_counter()
    with ThreadPoolExecutor() as executor:
        futures = {
            leetcode_username: executor.submit(
                fetch_question_progress, leetcode_username
            )
            for leetcode_username in leetcode_usernames
        }
        for leetcode_username in futures:
            try:
                result[leetcode_username] = futures[leetcode_username].result()
                fetch_count += 1
            except Exception as e:
                print(f"Failed to fetch progress for {leetcode_username}: {e}")
                errors.append(
                    {
                        "operation": "fetch_progress",
                        "username": username,
                        "error": str(e),
                    }
                )
    performance["fetch_progress"] = perf_counter() - start_perf

    # Batch write results to LeetCodeProgress-s8nczw
    start_perf = perf_counter()
    try:
        with progress_table.batch_writer() as batch:
            for leetcode_username, stats in result.items():
                batch.put_item(
                    Item={
                        "username": leetcode_username,
                        "timestamp": timestamp,
                        "easy": stats.get("EASY", 0),
                        "medium": stats.get("MEDIUM", 0),
                        "hard": stats.get("HARD", 0),
                        "total": stats.get("TOTAL", 0),
                    }
                )
    except Exception as e:
        print(f"Error writing progress to LeetCodeProgress: {e}")
        errors.append(
            {
                "operation": "put_progress",
                "error": str(e),
            }
        )
    performance["put_progress"] = perf_counter() - start_perf

    # Update latest progress in users_table (individual updates)
    start_perf = perf_counter()
    for user_item in user_items:
        username = user_item["username"]
        leetcode_username = user_item["leetcode_username"]
        if not leetcode_username in result:
            continue
        stats = result[leetcode_username]
        try:
            users_table.update_item(
                Key={"username": username},
                UpdateExpression="SET latest_timestamp = :ts, latest_easy = :e, latest_medium = :m, latest_hard = :h, latest_total = :t",
                ExpressionAttributeValues={
                    ":ts": timestamp,
                    ":e": stats.get("EASY", 0),
                    ":m": stats.get("MEDIUM", 0),
                    ":h": stats.get("HARD", 0),
                    ":t": stats.get("TOTAL", 0),
                },
            )
            update_count += 1
        except Exception as e:
            print(f"Error updating latest progress for user {username}: {e}")
            errors.append(
                {
                    "operation": "update_user_latest",
                    "username": username,
                    "error": str(e),
                }
            )
    performance["update_user_latest"] = perf_counter() - start_perf

    return {
        "statusCode": 200,
        "message": f"Scraped and stored progress for {fetch_count} users. Updated latest stats for {update_count} users.",
        "timestamp": timestamp,
        "result": result,
        "performance": performance,
        "errors": errors,
    }
