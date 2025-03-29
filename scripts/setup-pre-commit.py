import os
import subprocess


def setup_pre_commit():
    """Sets up pre-commit hooks."""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        repo_dir = os.path.abspath(os.path.join(script_dir, ".."))
        os.chdir(repo_dir)

        if not os.path.isdir(".git"):
            raise Exception("Not a git repository. Skipping pre-commit setup.")

        try:
            os.chdir("frontend")
            subprocess.run(["npm", "run", "prepare"], check=True)
            os.chdir("..")

            subprocess.run(
                ["command", "-v", "pre-commit"],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            subprocess.run(["pre-commit", "install"], check=True)

            pre_commit_path = os.path.join(".git", "hooks", "pre-commit")
            if os.path.isfile(pre_commit_path):
                with open(pre_commit_path, "r") as f:
                    lines = f.readlines()

                lines.insert(
                    1, "frontend/.husky/_/pre-commit\n"
                )  # insert at second line

                with open(pre_commit_path, "w") as f:
                    f.writelines(lines)

                print("Pre-commit hook installed successfully.")
            else:
                raise Exception(
                    "Pre-commit hook file not found. Skipping pre-commit setup."
                )

        except subprocess.CalledProcessError:
            raise Exception(
                "pre-commit could not be found. Skipping pre-commit setup."
            )

    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    setup_pre_commit()
