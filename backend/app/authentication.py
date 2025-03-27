from typing import Any

import requests
from environment import environment
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt
from jose.utils import base64url_decode
from pydantic import BaseModel

JWK = dict[str, str]


class JWKS(BaseModel):
    keys: list[JWK]


jwks = JWKS.model_validate(
    requests.get(environment.cognito_idp_url + "/.well-known/jwks.json").json()
)


class JWTAuthorizationCredentials(BaseModel):
    jwt_token: str
    header: dict[str, str]
    claims: dict[str, Any]
    signature: str
    message: str


class JWTBearer(HTTPBearer):
    def __init__(self, jwks: JWKS, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

        self.kid_to_jwk = {jwk["kid"]: jwk for jwk in jwks.keys}

    def verify_jwk_token(
        self, jwt_credentials: JWTAuthorizationCredentials
    ) -> bool:
        try:
            public_key = self.kid_to_jwk[jwt_credentials.header["kid"]]
        except KeyError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="JWK public key not found",
            )

        key = jwk.construct(public_key)
        decoded_signature = base64url_decode(
            jwt_credentials.signature.encode()
        )

        return key.verify(jwt_credentials.message.encode(), decoded_signature)

    async def __call__(
        self, request: Request
    ) -> JWTAuthorizationCredentials | None:
        credentials: HTTPAuthorizationCredentials = await super().__call__(
            request
        )

        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Wrong authentication method",
                )

            jwt_token = credentials.credentials
            message, signature = jwt_token.rsplit(".", 1)

            try:
                jwt_credentials = JWTAuthorizationCredentials(
                    jwt_token=jwt_token,
                    header=jwt.get_unverified_header(jwt_token),
                    claims=jwt.get_unverified_claims(jwt_token),
                    signature=signature,
                    message=message,
                )
            except JWTError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="JWK invalid",
                )

            if not self.verify_jwk_token(jwt_credentials):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="JWK invalid",
                )

            return jwt_credentials
