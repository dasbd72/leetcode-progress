from datetime import datetime, timezone
import boto3
from utils import fetch_question_progress
from time import perf_counter
from concurrent.futures import ThreadPoolExecutor

# DynamoDB setup
dynamodb = boto3.resource("dynamodb")
progress_table = dynamodb.Table("LeetCodeProgress")
users_table = dynamodb.Table("LeetCodeProgressUsers")


def lambda_handler(event, context):
    timestamp = int(datetime.now(timezone.utc).timestamp())
    result = {}
    performance = {
        "get_users": 0,
        "fetch_progress": 0,
        "put_progress": 0,
    }

    # Fetch all usernames and slugs from LeetCodeProgressUsers
    start_perf = perf_counter()
    users_response = users_table.scan()
    user_items = users_response.get("Items", [])
    performance["get_users"] = perf_counter() - start_perf

    # Fetch progress for each user
    start_perf = perf_counter()
    with ThreadPoolExecutor() as executor:
        futures = {
            executor.submit(
                fetch_question_progress, user["leetcode_username"]
            ): user
            for user in user_items
        }
        for future in futures:
            user = futures[future]
            username = user["leetcode_username"]
            try:
                progress = future.result()
                result[username] = progress
            except Exception as e:
                print(f"Failed to fetch progress for {username}: {e}")
    performance["fetch_progress"] = perf_counter() - start_perf

    # Batch write results to LeetCodeProgress
    start_perf = perf_counter()
    with progress_table.batch_writer() as batch:
        for username, stats in result.items():
            batch.put_item(
                Item={
                    "username": username,
                    "timestamp": timestamp,
                    "easy": stats.get("EASY", 0),
                    "medium": stats.get("MEDIUM", 0),
                    "hard": stats.get("HARD", 0),
                    "total": stats.get("TOTAL", 0),
                }
            )
    performance["put_progress"] = perf_counter() - start_perf

    return {
        "statusCode": 200,
        "message": f"Scraped and stored progress for {len(user_items)} users.",
        "timestamp": timestamp,
        "performance": performance,
    }
