import boto3
from authentication import JWTAuthorizationCredentials, JWTBearer, jwks
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

# Create JWTBearer instance
auth = JWTBearer(jwks=jwks)

# Create Cognito client
cognito = boto3.client("cognito-idp", region_name="ap-northeast-1")

# Create DynamoDB resource
dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table("LeetCodeProgressUsers")

class UserSettings(BaseModel):
    email: str
    username: str
    preferred_username: str
    leetcode_username: str


@router.get("/user/settings", response_model=UserSettings)
async def get_user_settings(
    credentials: JWTAuthorizationCredentials = Depends(auth),
):
    username = credentials.claims.get("username")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username not found in claims",
        )
    response = cognito.get_user(AccessToken=credentials.jwt_token)
    email = next(
        (attr["Value"] for attr in response["UserAttributes"] if attr["Name"] == "email"),
        "",
    )
    response = users_table.get_item(Key={"username": username})
    item = response.get("Item")
    if item:
        preferred_username = item.get("preferred_username", username)
        leetcode_username = item.get("leetcode_username", "")
    else:
        preferred_username = username
        leetcode_username = ""
    return {
        "email": email,
        "username": username,
        "preferred_username": preferred_username,
        "leetcode_username": leetcode_username,
    }


@router.put("/user/settings", response_model=UserSettings)
async def update_user_settings(
    user_settings: UserSettings,
    credentials: JWTAuthorizationCredentials = Depends(auth),
):
    username = credentials.claims.get("username")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username not found in claims",
        )
    response = users_table.put_item(
        Item={
            "username": username,
            "preferred_username": user_settings.preferred_username,
            "leetcode_username": user_settings.leetcode_username,
        }
    )
    if response.get("ResponseMetadata", {}).get("HTTPStatusCode") != 200:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user settings",
        )
    return user_settings
