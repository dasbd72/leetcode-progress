#!/usr/bin/env python3
import os

import aws_cdk as cdk

from cdk.cdk_stack import (
    FrontendCdkStack,
    ResourceCdkStack,
    ScraperCdkStack,
    BackendCdkStack,
)

app = cdk.App()
frontend_stack = FrontendCdkStack(
    app,
    "LeetcodeProgressFrontendCdkStack",
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION"),
    ),
)
resource_stack = ResourceCdkStack(
    app,
    "LeetcodeProgressResourceCdkStack",
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION"),
    ),
    removal_policy=cdk.RemovalPolicy.RETAIN,
)
scraper_stack = ScraperCdkStack(
    app,
    "LeetcodeProgressScraperCdkStack",
    users_table=resource_stack.users_table,
    progress_table=resource_stack.progress_table,
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION"),
    ),
)
backend_stack = BackendCdkStack(
    app,
    "LeetcodeProgressBackendCdkStack",
    users_table=resource_stack.users_table,
    progress_table=resource_stack.progress_table,
    backend_cache_bucket=resource_stack.backend_cache_bucket,
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION"),
    ),
)

app.synth()
