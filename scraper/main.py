from datetime import datetime, timezone
import boto3
from utils import fetch_question_progress

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("LeetCodeProgress")
user_slugs = [
    "ryanke91",
    "dasbd72",
    "johnson684",
    "erictsai90",
    "huiyuiui",
    "kevin1010607",
    "tatammmmy",
]


def lambda_handler(event, context):
    timestamp = int(datetime.now(timezone.utc).timestamp())
    result = {}
    for user_slug in user_slugs:
        try:
            progress = fetch_question_progress(user_slug)
            result[user_slug] = progress
        except Exception as e:
            result[user_slug] = {"error": str(e)}

    with table.batch_writer() as batch:
        for user_slug, stats in result.items():
            batch.put_item(
                Item={
                    "username": user_slug,
                    "timestamp": timestamp,
                    "easy": stats["EASY"],
                    "medium": stats["MEDIUM"],
                    "hard": stats["HARD"],
                    "total": stats["TOTAL"],
                }
            )

    return {
        "statusCode": 200,
        "message": f"Scraped and stored progress for {len(user_slugs)} users.",
        "timestamp": timestamp,
    }
