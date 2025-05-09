#!/usr/bin/env python3
import os

import aws_cdk as cdk

from cdk.cdk_stack import FrontendCdkStack

app = cdk.App()
FrontendCdkStack(
    app,
    "LeetcodeProgressFrontendCdkStack",
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION"),
    ),
)

app.synth()
