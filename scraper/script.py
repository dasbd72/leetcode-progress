import argparse
import subprocess
import shutil
import os


class Args:
    command: str = None


def parse_args():
    parser = argparse.ArgumentParser(description="Script to run commands")
    parser.add_argument(
        "command", type=str, help="Command to run", choices=["deploy"]
    )
    args = parser.parse_args(namespace=Args)
    return args


def run_command(cmd: str):
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


def prepare_lambda_package():
    print("Packaging Lambda function...")

    os.makedirs("package", exist_ok=True)

    if not run_command("pip install -r requirements.txt -t package/"):
        return False

    for fname in ["main.py", "utils.py"]:
        try:
            shutil.copy(fname, "package/")
        except Exception as e:
            print(f"Error copying {fname}: {e}")
            return False

    if not run_command("cd package && zip -r -q ../scraper.zip ."):
        return False

    return True


def main():
    args = parse_args()
    if args.command == "deploy":
        input("Deploying to AWS. Press Enter to continue...")
        os.chdir("app")
        if not prepare_lambda_package():
            return
        cmds = [
            "aws lambda update-function-code "
            "--function-name leetcode-progress-Scraper "
            "--zip-file fileb://scraper.zip"
        ]
    else:
        raise NotImplementedError

    for cmd in cmds:
        if not run_command(cmd):
            break


if __name__ == "__main__":
    main()
