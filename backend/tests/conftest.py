import os

# The app reads these at import time; set benign values so importing the
# FastAPI app (and its boto3 resources) succeeds without AWS credentials.
os.environ.setdefault("AWS_DEFAULT_REGION", "ap-northeast-1")
os.environ.setdefault("PRODUCTION", "false")
os.environ.setdefault("DEVELOPMENT_USERNAME", "test_user")
