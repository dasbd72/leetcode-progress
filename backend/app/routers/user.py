import boto3
from authentication import get_claims
from environment import environment
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

# Create Cognito client
cognito = boto3.client("cognito-idp", region_name="ap-northeast-1")

# Create DynamoDB resource
dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table(environment.users_table_name)


class User(BaseModel):
    username: str
    preferred_username: str
    leetcode_username: str


@router.get("/user/list", response_model=list[User])
async def get_user_list(
    claims: dict = Depends(get_claims),
):
    username = claims.get("username")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username not found in claims",
        )
    try:
        done = False
        last_evaluated_key = None
        user_list = []
        while not done:
            if last_evaluated_key:
                response = users_table.scan(
                    ExclusiveStartKey=last_evaluated_key,
                    PrjojectionExpression="username, preferred_username, leetcode_username",
                )
            else:
                response = users_table.scan()
            items = response.get("Items", [])
            user_list.extend(
                User(
                    username=item["username"],
                    preferred_username=item.get("preferred_username", ""),
                    leetcode_username=item.get("leetcode_username", ""),
                )
                for item in items
                if "username" in item
            )
            if "LastEvaluatedKey" not in response:
                done = True
            else:
                last_evaluated_key = response["LastEvaluatedKey"]
    except Exception as e:
        print(f"Error fetching users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch users",
        )
    return user_list


class UserSettings(BaseModel):
    username: str
    email: str
    preferred_username: str
    leetcode_username: str


@router.get("/user/settings", response_model=UserSettings)
async def get_user_settings(
    claims: dict = Depends(get_claims),
):
    username = claims.get("username")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username not found in claims",
        )
    response = users_table.get_item(Key={"username": username})
    item = response.get("Item")
    if item:
        email = item.get("email", "")
        preferred_username = item.get("preferred_username", username)
        leetcode_username = item.get("leetcode_username", "")
    else:
        email = ""
        preferred_username = username
        leetcode_username = ""
    return {
        "username": username,
        "email": email,
        "preferred_username": preferred_username,
        "leetcode_username": leetcode_username,
    }


@router.put("/user/settings", response_model=UserSettings)
async def update_user_settings(
    user_settings: UserSettings,
    claims: dict = Depends(get_claims),
):
    username = claims.get("username")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username not found in claims",
        )
    try:
        response = users_table.update_item(
            Key={"username": username},
            UpdateExpression="SET email = :email, preferred_username = :pref, leetcode_username = :leet",
            ExpressionAttributeValues={
                ":email": user_settings.email,
                ":pref": user_settings.preferred_username,
                ":leet": user_settings.leetcode_username,
            },
            ReturnValues="UPDATED_NEW",  # Optional: Can be used to check response
        )
        if response.get("ResponseMetadata", {}).get("HTTPStatusCode") != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user settings in DynamoDB",
            )
    except Exception as e:
        print(f"Error updating user settings for {username}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user settings",
        )
    return user_settings


@router.get("/user/subscription/list", response_model=list[str])
async def get_user_subscriptions(
    claims: dict = Depends(get_claims),
):
    username = claims.get("username")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username not found in claims",
        )
    try:
        response = users_table.get_item(Key={"username": username})
        item = response.get("Item")
        subscription_list = []
        if item:
            subscription_list = item.get("subscription_list", [])
    except Exception as e:
        print(f"Error fetching user subscriptions for {username}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user subscriptions",
        )
    return subscription_list


@router.put("/user/subscription/list", response_model=list[str])
async def update_user_subscriptions(
    subscription_list: list[str],
    claims: dict = Depends(get_claims),
):
    username = claims.get("username")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username not found in claims",
        )
    try:
        response = users_table.update_item(
            Key={"username": username},
            UpdateExpression="SET subscription_list = :sub_list",
            ExpressionAttributeValues={":sub_list": subscription_list},
            ReturnValues="UPDATED_NEW",  # Optional: Can be used to check response
        )
        if response.get("ResponseMetadata", {}).get("HTTPStatusCode") != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user subscriptions in DynamoDB",
            )
    except Exception as e:
        print(f"Error updating user subscriptions for {username}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user subscriptions",
        )
    return subscription_list
