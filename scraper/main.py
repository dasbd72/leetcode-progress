from datetime import datetime, timezone
import boto3
from utils import fetch_question_progress

# DynamoDB setup
dynamodb = boto3.resource("dynamodb")
progress_table = dynamodb.Table("LeetCodeProgress")
users_table = dynamodb.Table("LeetCodeProgressUsers")


def lambda_handler(event, context):
    timestamp = int(datetime.now(timezone.utc).timestamp())
    result = {}

    # Fetch all usernames and slugs from LeetCodeProgressUsers
    users_response = users_table.scan()
    user_items = users_response.get("Items", [])

    for user in user_items:
        username = user["username"]
        user_slug = username  # assuming 'username' is used as the slug
        try:
            progress = fetch_question_progress(user_slug)
            result[username] = progress
        except Exception as e:
            print(f"Failed to fetch progress for {username}: {e}")
            result[username] = {
                "EASY": 0,
                "MEDIUM": 0,
                "HARD": 0,
                "TOTAL": 0,
            }

    # Batch write results to LeetCodeProgress
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

    return {
        "statusCode": 200,
        "message": f"Scraped and stored progress for {len(user_items)} users.",
        "timestamp": timestamp,
    }
