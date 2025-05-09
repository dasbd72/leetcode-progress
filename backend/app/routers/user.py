import boto3
from authentication import get_cognito_claims
from environment import environment
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

# Create Cognito client
cognito = boto3.client("cognito-idp", region_name="ap-northeast-1")

# Create DynamoDB resource
dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table(environment.users_table_name)


class UserSettings(BaseModel):
    username: str
    email: str
    preferred_username: str
    leetcode_username: str


@router.get("/user/settings", response_model=UserSettings)
async def get_user_settings(
    claims: dict = Depends(get_cognito_claims),
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
    claims: dict = Depends(get_cognito_claims),
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
