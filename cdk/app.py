#!/usr/bin/env python3
import os

import aws_cdk as cdk

from cdk.cdk_stack import FrontendCdkStack, ResourceCdkStack

app = cdk.App()
FrontendCdkStack(
    app,
    "LeetcodeProgressFrontendCdkStack",
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION"),
    ),
)
ResourceCdkStack(
    app,
    "LeetcodeProgressResourceCdkStack",
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION"),
    ),
    removal_policy=cdk.RemovalPolicy.RETAIN,
)

app.synth()
