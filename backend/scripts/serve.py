import os
import subprocess


def run_command(cmd: str, env: dict = None) -> bool:
    print(f"Running: {cmd}")
    try:
        process = subprocess.Popen(cmd, shell=True, env=env)
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
    env = os.environ.copy()
    env["PRODUCTION"] = "true"
    env["ALLOWED_ORIGINS"] = "*"
    run_command("uvicorn main:app --reload --host 127.0.0.1 --port 8000", env)


if __name__ == "__main__":
    main()
