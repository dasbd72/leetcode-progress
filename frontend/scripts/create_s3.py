import json

from .utils import get_boto3_session, read_confirm_config


class Creator:
    """Creates s3 bucket for frontend website hosting."""

    def __init__(self, config_path="scripts/config.json"):
        self.config = read_confirm_config(config_path)
        if self.config is None:
            raise ValueError(
                f"Config file not found at {config_path}. Please run update_config.py first."
            )

        self.session = get_boto3_session(self.config)
        self.s3 = self.session.client("s3")

    def create_s3_bucket(self, bucket_name: str):
        # Search for the bucket by name
        response = self.s3.list_buckets()
        bucket_exists = False
        for bucket in response["Buckets"]:
            if bucket["Name"] == bucket_name:
                if bucket_exists:
                    print(
                        f"Bucket with name {bucket_name} already exists, deleting ARN {bucket['Name']}."
                    )
                    self.s3.delete_bucket(Bucket=bucket["Name"])
                else:
                    bucket_exists = True
        # If the bucket is not found, create it
        if not bucket_exists:
            print(
                f"Bucket with name {bucket_name} not found, creating a new one."
            )
            if self.session.region_name == "us-east-1":
                response = self.s3.create_bucket(Bucket=bucket_name)
            else:
                response = self.s3.create_bucket(
                    Bucket=bucket_name,
                    CreateBucketConfiguration={
                        "LocationConstraint": self.session.region_name,
                    },
                )
        return bucket_name

    def put_website(self, bucket_name: str):
        # Set website configuration
        try:
            self.s3.put_bucket_website(
                Bucket=bucket_name,
                WebsiteConfiguration={
                    "ErrorDocument": {"Key": "index.html"},
                    "IndexDocument": {"Suffix": "index.html"},
                },
            )
            print(f"Bucket {bucket_name} configured for website hosting.")
        except Exception as e:
            print(f"Error configuring bucket {bucket_name}: {e}")
            return

    def put_public_access_block(self, bucket_name: str):
        # Put public read access
        try:
            self.s3.put_public_access_block(
                Bucket=bucket_name,
                PublicAccessBlockConfiguration={
                    "BlockPublicAcls": False,
                    "IgnorePublicAcls": False,
                    "BlockPublicPolicy": False,
                    "RestrictPublicBuckets": False,
                },
            )
            print(f"Public access block configuration set for {bucket_name}.")
        except Exception as e:
            print(f"Error setting public access block configuration: {e}")
            return

    def put_bucket_policy(self, bucket_name: str):
        # Set bucket policy
        try:
            bucket_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "PublicReadGetObject",
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": "s3:GetObject",
                        "Resource": f"arn:aws:s3:::{bucket_name}/*",
                    }
                ],
            }
            self.s3.put_bucket_policy(
                Bucket=bucket_name,
                Policy=json.dumps(bucket_policy),
            )
            print(f"Bucket policy set for {bucket_name}.")
        except Exception as e:
            print(f"Error setting bucket policy: {e}")
            return

    def run(self):
        bucket_name = self.config["s3_bucket"]
        self.create_s3_bucket(bucket_name)
        print(f"Bucket name: {bucket_name}")
        self.put_website(bucket_name)
        self.put_public_access_block(bucket_name)
        self.put_bucket_policy(bucket_name)


if __name__ == "__main__":
    creator = Creator()
    creator.run()
