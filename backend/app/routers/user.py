import boto3
from authentication import JWTAuthorizationCredentials, JWTBearer, jwks
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

# Create JWTBearer instance
auth = JWTBearer(jwks=jwks)

# Create Cognito client
cognito = boto3.client("cognito-idp", region_name="ap-northeast-1")


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
    attributes = {}
    for attr in response["UserAttributes"]:
        attributes[attr["Name"]] = attr["Value"]
    return {
        "email": attributes.get("email", ""),
        "username": username,
        "preferred_username": attributes.get("custom:preferred_username", username),
        "leetcode_username": attributes.get("custom:leetcode_username", ""),
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
    response = cognito.admin_update_user_attributes(
        UserPoolId="ap-northeast-1_MSLz0uAQD",
        Username=username,
        UserAttributes=[
            {
                "Name": "custom:preferred_username",
                "Value": user_settings.preferred_username,
            },
            {
                "Name": "custom:leetcode_username",
                "Value": user_settings.leetcode_username,
            },
        ],
    )
    if response.get("ResponseMetadata", {}).get("HTTPStatusCode") != 200:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user settings",
        )
    return user_settings
