from aws_cdk import (
    CfnOutput,
    Duration,
    RemovalPolicy,
    Stack,
    aws_cloudfront,
    aws_cloudfront_origins,
    aws_dynamodb,
    aws_iam,
    aws_s3,
    aws_s3_deployment,
)
from constructs import Construct


class FrontendCdkStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Define the S3 bucket name for the frontend
        self.frontend_bucket_name = f"leetcode-progress-frontend"
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
        users_table = aws_dynamodb.Table(
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
        users_table.add_global_secondary_index(
            index_name="LeetCodeUsernameIndex",
            partition_key=aws_dynamodb.Attribute(
                name="leetcode_username",
                type=aws_dynamodb.AttributeType.STRING,
            ),
            projection_type=aws_dynamodb.ProjectionType.ALL,
        )

        # Create the LeetCodeProgressData Table
        progress_table = aws_dynamodb.Table(
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
            value=users_table.table_name,
            description="Name of the LeetCode Progress Users DynamoDB table",
        )
        CfnOutput(
            self,
            "LeetCodeProgressDataTableName",
            value=progress_table.table_name,
            description="Name of the LeetCode Progress Data DynamoDB table",
        )
