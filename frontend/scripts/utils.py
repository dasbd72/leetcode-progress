import json
from typing import Optional

import boto3.session


def read_config(config_path) -> Optional[dict]:
    """
    Reads the configuration file and returns the configuration as a dictionary.
    If the file does not exist, it returns an empty dictionary.
    """
    try:
        with open(config_path, "r") as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        return None


def confirm_config(config: dict) -> bool:
    """
    Prints the current configuration and asks for confirmation.
    Returns True if the user confirms, False otherwise.
    """
    print("Current configuration:")
    for key, value in config.items():
        print(f"- {key}: {value}")
    return input("Continue? (Y/n): ").lower() in ["", "y", "yes"]


def read_confirm_config(config_path) -> Optional[dict]:
    """
    Reads the configuration file and asks for confirmation.
    If the file does not exist, it returns None.
    """
    config = read_config(config_path)
    if config is None:
        print(f"Configuration file not found at {config_path}.")
        return None
    if not confirm_config(config):
        return None
    return config


def get_boto3_session(config: dict):
    """
    Creates a boto3 session using the provided configuration.
    """
    return boto3.session.Session(
        profile_name=config["aws_profile"],
        region_name=config["aws_region"],
    )
