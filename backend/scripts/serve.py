import os
import subprocess


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
    os.chdir("app")
    cmds = [
        "environment=development uvicorn main:app --reload --host 127.0.0.1 --port 8000",
    ]
    for cmd in cmds:
        if not run_command(cmd):
            break


if __name__ == "__main__":
    main()
