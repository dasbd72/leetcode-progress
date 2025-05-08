import json

from .utils import read_config

CONFIG_PATH = "scripts/config.json"
CONFIG_TEMPLATE = {
    "aws_profile": "default",
    "aws_region": "ap-east-1",
    "website_path": "dist/frontend/browser",
    "s3_bucket": "leetcode-progress",
}


def main():
    # Read old config if it exists, and update it,
    # otherwise create a new one
    config = read_config(CONFIG_PATH)
    if config is None:
        config = CONFIG_TEMPLATE
    else:
        # Update config with default values if they are missing
        for key in CONFIG_TEMPLATE:
            if key not in config:
                config[key] = CONFIG_TEMPLATE[key]
    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=4)


if __name__ == "__main__":
    main()
