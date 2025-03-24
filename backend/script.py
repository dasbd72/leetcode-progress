import os
import argparse
import subprocess


class Args:
    command: str = None


def parse_args():
    parser = argparse.ArgumentParser(description="Script to run commands")
    parser.add_argument(
        "command", type=str, help="Command to run", choices=["serve", "deploy"]
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
            "uvicorn main:app --reload --host 127.0.0.1 --port 8000",
        ]
    elif args.command == "deploy":
        input("Deploying to AWS. Press Enter to continue...")
        cmds = [
            "sam build",
            "sam deploy",
        ]
    else:
        raise NotImplementedError

    for cmd in cmds:
        if not run_command(cmd):
            break


if __name__ == "__main__":
    main()
