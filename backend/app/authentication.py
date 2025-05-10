from typing import Any

from fastapi import Request

from environment import environment


def get_claims_development() -> dict[str, Any]:
    """Manually extracts Cognito JWT claims from the Lambda event for development purposes."""
    if not environment.development_username:
        raise ValueError("DEVELOPMENT_USERNAME is not set in the environment")
    claims = {
        "username": environment.development_username,
        "sub": environment.development_username,
    }
    return claims


def get_claims(request: Request) -> dict[str, Any]:
    """Extracts Cognito JWT claims from the Lambda event."""
    if not environment.production:
        # In development, we don't have the http authorizer
        return get_claims_development()

    # Get the original Lambda event from the ASGI scope
    event = request.scope.get("aws.event", {})

    # Navigate the event structure to find JWT claims
    # For HTTP API JWT Authorizers, claims are under requestContext.authorizer.jwt.claims
    claims = (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("jwt", {})  # <-- Added 'jwt' key here
        .get("claims", {})
    )

    return claims
