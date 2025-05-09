from aws_cdk import (
    CfnOutput,
    Duration,
    RemovalPolicy,
    Stack,
    aws_certificatemanager,
    aws_cloudfront,
    aws_cloudfront_origins,
    aws_dynamodb,
    aws_events,
    aws_events_targets,
    aws_iam,
    aws_lambda,
    aws_s3,
    aws_s3_deployment,
)
from constructs import Construct


class FrontendCdkStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Define the S3 bucket name for the frontend
        self.frontend_bucket_name = (
            f"leetcode-progress-frontend-{self.account}-{self.region}"
        )
        # Create the frontend resources
        self.create_frontend()

    def create_frontend(self):
        website_bucket = aws_s3.Bucket(
            self,
            "LeetcodeProgressWebsiteBucket",
            bucket_name=self.frontend_bucket_name,
            public_read_access=False,  # No public access, CloudFront will serve via OAC
            block_public_access=aws_s3.BlockPublicAccess.BLOCK_ALL,  # Recommended for private buckets
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # Create Origin Access Control (OAC) for CloudFront
        # This is the recommended way for CloudFront to access S3 buckets
        cfn_oac = aws_cloudfront.CfnOriginAccessControl(
            self,
            "LeetcodeProgressOAC",
            origin_access_control_config=aws_cloudfront.CfnOriginAccessControl.OriginAccessControlConfigProperty(
                name="LeetcodeProgressOACConfig",
                origin_access_control_origin_type="s3",
                signing_behavior="always",
                signing_protocol="sigv4",
                description="OAC for Leetcode Progress Frontend",
            ),
        )

        # Create S3 bucket origin using the recommended S3BucketOrigin
        # Associate the OAC with this origin
        s3_bucket_origin = aws_cloudfront_origins.S3BucketOrigin(
            website_bucket,
            origin_access_control_id=cfn_oac.ref,  # Pass the created OAC here
            # The S3BucketOrigin construct with OAC automatically handles the bucket policy.
        )

        # Search for certificate for the CloudFront distribution
        certificate = aws_certificatemanager.Certificate.from_certificate_arn(
            self,
            "40be6b60-3b53-4f42-81f7-184603f37104",
            certificate_arn="arn:aws:acm:us-east-1:718795813953:certificate/40be6b60-3b53-4f42-81f7-184603f37104",
        )

        # Create CloudFront distribution
        distribution = aws_cloudfront.Distribution(
            self,
            "LeetcodeProgressDistribution",
            default_behavior=aws_cloudfront.BehaviorOptions(
                origin=s3_bucket_origin,
                viewer_protocol_policy=aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowed_methods=aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cached_methods=aws_cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                compress=True,
            ),
            certificate=certificate,
            default_root_object="index.html",
            error_responses=[
                aws_cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.minutes(0),
                ),
                aws_cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.minutes(0),
                ),
            ],
            price_class=aws_cloudfront.PriceClass.PRICE_CLASS_100,  # Choose appropriate price class
        )

        # Add bucket policy for CloudFront OAC
        website_bucket.add_to_resource_policy(
            aws_iam.PolicyStatement(
                actions=["s3:GetObject"],
                resources=[website_bucket.arn_for_objects("*")],
                principals=[
                    aws_iam.ServicePrincipal("cloudfront.amazonaws.com")
                ],
                conditions={
                    "StringEquals": {
                        "AWS:SourceArn": f"arn:aws:cloudfront::{self.account}:distribution/{distribution.distribution_id}"
                    }
                },
            )
        )

        # Deploy website content
        aws_s3_deployment.BucketDeployment(
            self,
            "DeployWebsite",
            sources=[
                aws_s3_deployment.Source.asset(
                    "../frontend/dist/frontend/browser"
                )
            ],
            destination_bucket=website_bucket,
            distribution=distribution,  # Specify the distribution to invalidate cache
            distribution_paths=["/*"],  # Paths to invalidate
        )

        # Output information
        CfnOutput(self, "ContentBucketName", value=website_bucket.bucket_name)
        CfnOutput(
            self,
            "CloudFrontDistributionDomainName",
            value=distribution.distribution_domain_name,
        )


class ResourceCdkStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        removal_policy: RemovalPolicy = RemovalPolicy.RETAIN,  # Make removal policy configurable
        **kwargs,
    ) -> None:
        """
        CDK Stack for deploying core resources, including DynamoDB tables.

        Args:
            scope (Construct): The scope in which to define this construct.
            construct_id (str): The logical ID of this stack.
            removal_policy (RemovalPolicy): The removal policy for the DynamoDB tables.
                                            Defaults to RETAIN to prevent data loss on stack deletion.
            **kwargs: Additional stack properties.
        """
        super().__init__(scope, construct_id, **kwargs)

        # Add a description to the stack for better identification in the AWS console
        self.template_options.description = (
            "Stack containing core resources for LeetCode Progress Tracker, "
            "including DynamoDB tables."
        )

        # Create the LeetCodeProgressUsers Table
        self.users_table = aws_dynamodb.Table(
            self,
            "LeetCodeProgressUsersTable",
            table_name="LeetCodeProgressUsers-1746776519",
            partition_key=aws_dynamodb.Attribute(
                name="username", type=aws_dynamodb.AttributeType.STRING
            ),
            billing_mode=aws_dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=removal_policy,  # Use the configurable removal policy
        )

        # Add the LeetCodeUsernameIndex Global Secondary Index
        # Note: GSIs on PAY_PER_REQUEST tables do not require provisioned throughput settings
        self.users_table.add_global_secondary_index(
            index_name="LeetCodeUsernameIndex",
            partition_key=aws_dynamodb.Attribute(
                name="leetcode_username",
                type=aws_dynamodb.AttributeType.STRING,
            ),
            projection_type=aws_dynamodb.ProjectionType.ALL,
        )

        # Create the LeetCodeProgressData Table
        self.progress_table = aws_dynamodb.Table(
            self,
            "LeetCodeProgressDataTable",
            table_name="LeetCodeProgressData-1746776519",  # Note: Using the exact name from the CLI
            partition_key=aws_dynamodb.Attribute(
                name="username", type=aws_dynamodb.AttributeType.STRING
            ),
            sort_key=aws_dynamodb.Attribute(
                name="timestamp", type=aws_dynamodb.AttributeType.NUMBER
            ),
            billing_mode=aws_dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=removal_policy,  # Use the configurable removal policy
        )

        # Output the table names
        CfnOutput(
            self,
            "LeetCodeProgressUsersTableName",
            value=self.users_table.table_name,
            description="Name of the LeetCode Progress Users DynamoDB table",
        )
        CfnOutput(
            self,
            "LeetCodeProgressDataTableName",
            value=self.progress_table.table_name,
            description="Name of the LeetCode Progress Data DynamoDB table",
        )


class ScraperCdkStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        users_table: aws_dynamodb.Table,
        progress_table: aws_dynamodb.Table,
        **kwargs,
    ) -> None:
        """
        CDK Stack for deploying the LeetCode Progress Scraper Lambda function
        and its EventBridge trigger.

        Args:
            scope (Construct): The scope in which to define this construct.
            construct_id (str): The logical ID of this stack.
            users_table (aws_dynamodb.Table): The DynamoDB table for user data.
            progress_table (aws_dynamodb.Table): The DynamoDB table for progress data.
            **kwargs: Additional stack properties.
        """
        super().__init__(scope, construct_id, **kwargs)

        self.template_options.description = (
            "Stack containing the LeetCode Progress Scraper Lambda function "
            "and necessary permissions, triggered by EventBridge."
        )

        # Define the IAM role for the Lambda function
        lambda_role = aws_iam.Role(
            self,
            "ScraperLambdaRole",
            assumed_by=aws_iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                # AWS managed policy for basic Lambda execution (logging)
                aws_iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
            description="IAM role for the LeetCode Progress Scraper Lambda function",
        )

        # Grant the Lambda role permissions to interact with the DynamoDB tables
        # The original policy had Scan on users and Write on progress.
        users_table.grant_read_data(
            lambda_role
        )  # Grant read (Scan, Query, GetItem) access to users table
        progress_table.grant_write_data(
            lambda_role
        )  # Grant write (PutItem, BatchWriteItem, UpdateItem) access to progress table

        # Define the Lambda function
        scraper_function = aws_lambda.Function(
            self,
            "LeetCodeProgressScraperFunction",
            function_name="leetcode-progress-scraper",  # Common name, CDK adds uniqueness suffix
            runtime=aws_lambda.Runtime.PYTHON_3_10,  # Set runtime to Python 3.10
            architecture=aws_lambda.Architecture.ARM_64,  # Set architecture to arm64
            handler="main.lambda_handler",  # Set handler as specified
            code=aws_lambda.Code.from_asset(
                "../scraper/app/package"
            ),  # Path to your packaged Lambda code
            role=lambda_role,
            timeout=Duration.seconds(
                60
            ),  # Set timeout to 60 seconds (1 minute)
            memory_size=128,  # Adjust memory as needed (128MB is default/minimum)
            environment={
                # Pass table names as environment variables to the Lambda function
                "USERS_TABLE_NAME": users_table.table_name,
                "PROGRESS_TABLE_NAME": progress_table.table_name,
            },
        )

        # Define the EventBridge Rule to trigger the Lambda function
        schedule_rule = aws_events.Rule(
            self,
            "ScrapeEvery20MinRule",
            rule_name="leetcode-progress-ScrapeEvery20Min",  # Set a logical name for the rule
            schedule=aws_events.Schedule.cron(
                minute="0/20", hour="*", day="*", month="*", year="*"
            ),  # Schedule: every 20 minutes
            description="Triggers the LeetCode Progress Scraper Lambda function every 20 minutes",
        )

        # Add the Lambda function as a target for the EventBridge Rule
        # CDK automatically adds the necessary permissions (lambda:InvokeFunction)
        schedule_rule.add_target(
            aws_events_targets.LambdaFunction(scraper_function)
        )

        # Output the Lambda function details
        CfnOutput(
            self,
            "ScraperFunctionName",
            value=scraper_function.function_name,
            description="Name of the LeetCode Progress Scraper Lambda function",
        )
        CfnOutput(
            self,
            "ScraperFunctionArn",
            value=scraper_function.function_arn,
            description="ARN of the LeetCode Progress Scraper Lambda function",
        )

        # Output the EventBridge rule name
        CfnOutput(
            self,
            "ScrapeScheduleRuleName",
            value=schedule_rule.rule_name,
            description="Name of the EventBridge rule that triggers the scraper function",
        )
