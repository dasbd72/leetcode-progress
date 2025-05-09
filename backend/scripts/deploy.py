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
    input("Deploying to AWS. Press Enter to continue...")
    cmds = [
        "sam build",
        "sam deploy",
    ]

    for cmd in cmds:
        if not run_command(cmd):
            break


if __name__ == "__main__":
    main()
