from typing import Any

from fastapi import Request


def get_claims(request: Request) -> dict[str, Any]:
    """Extracts Cognito JWT claims from the Lambda event."""
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
