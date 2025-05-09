import os


class Environment:
    production: bool = False
    allowed_origins: list[str] = []
    client_id: str = ""
    cognito_idp_url: str = ""


ENV: str = os.getenv("environment", "production")

environment = Environment()

if ENV == "production":
    environment.production = True
    environment.allowed_origins = ["https://leetcode-progress.dasbd72.com"]
    environment.client_id = "1qjlfcr2u175qlbhruf7bdre3j"
    environment.cognito_idp_url = "https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_MSLz0uAQD"
else:
    environment.production = False
    environment.allowed_origins = ["*"]
    environment.client_id = "1qjlfcr2u175qlbhruf7bdre3j"
    environment.cognito_idp_url = "https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_MSLz0uAQD"

print(f"allowed_origins: {environment.allowed_origins}")
