import argparse
import os
import subprocess


class Args:
    command: str = None


def parse_args():
    parser = argparse.ArgumentParser(description="Script to run commands")
    parser.add_argument(
        "command",
        type=str,
        help="Command to run",
        choices=["serve", "deploy", "lint"],
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


def main():
    args = parse_args()
    if args.command == "serve":
        os.chdir("app")
        cmds = [
            "environment=development uvicorn main:app --reload --host 127.0.0.1 --port 8000",
        ]
    elif args.command == "deploy":
        input("Deploying to AWS. Press Enter to continue...")
        cmds = [
            "sam build",
            "sam deploy",
        ]
    elif args.command == "lint":
        cmds = [
            "isort --line-length 79 --profile black app",
            "black --line-length 79 app",
            "flake8 --ignore=E203,E501,W503 --exclude 'venv','test','__init__.py' app",
        ]
    else:
        raise NotImplementedError

    for cmd in cmds:
        if not run_command(cmd):
            break


if __name__ == "__main__":
    main()
