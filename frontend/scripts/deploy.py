import subprocess

from .utils import get_boto3_session, read_confirm_config


class Creator:
    """Builds and deploys the frontend code to S3 bucket."""

    def __init__(self, config_path="scripts/config.json"):
        self.config = read_confirm_config(config_path)
        if self.config is None:
            raise ValueError(
                f"Config file not found at {config_path}. Please run update_config.py first."
            )

        self.session = get_boto3_session(self.config)
        self.s3 = self.session.client("s3")

    def run_command(self, cmd: str):
        print(f"Running: {cmd}")
        try:
            process = subprocess.Popen(cmd, shell=True)
            process.wait()
            if process.returncode != 0:
                print(f"Failed to run: {cmd}")
                return False
            return True
        except KeyboardInterrupt:
            print("\nInterrupted by user. Terminating subprocess...")
            process.terminate()
            process.wait()
            return False

    def build(self):
        cmds = ["ng build --configuration=production --source-map"]
        for cmd in cmds:
            if not self.run_command(cmd):
                print("Exiting...")
                exit(1)

    def upload(self):
        # Check if the bucket already exists
        try:
            self.s3.head_bucket(Bucket=self.config["s3_bucket"])
        except Exception as e:
            print(f"Bucket {self.config['s3_bucket']} does not exist.")
            return

        # Upload files to the bucket
        # sync config["website_path"] to config["s3_bucket"]
        print(
            f"Uploading files from {self.config['website_path']} to {self.config['s3_bucket']}..."
        )
        aws_cli_command = " ".join(
            [
                "aws",
                "s3",
                "sync",
                "--profile",
                self.config["aws_profile"],
                "--region",
                self.config["aws_region"],
                self.config["website_path"],
                f"s3://{self.config['s3_bucket']}",
                "--delete",
            ]
        )
        if not self.run_command(aws_cli_command):
            print("Exiting...")
            exit(1)
        print(
            f"Successfully uploaded files from {self.config['website_path']} to {self.config['s3_bucket']}."
        )

    def run(self):
        self.build()
        self.upload()


if __name__ == "__main__":
    creator = Creator()
    creator.run()
