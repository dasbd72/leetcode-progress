from aws_cdk import (
    CfnOutput,
    Duration,
    RemovalPolicy,
    Stack,
    aws_cloudfront,
    aws_cloudfront_origins,
    aws_iam,
    aws_s3,
    aws_s3_deployment,
)
from constructs import Construct


class CdkStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Define the S3 bucket for website content
        # Bucket name can be customized or passed as a parameter
        bucket_name = f"leetcode-progress-frontend"

        website_bucket = aws_s3.Bucket(
            self,
            "LeetcodeProgressWebsiteBucket",
            bucket_name=bucket_name,
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
                aws_s3_deployment.Source.asset("../dist/frontend/browser")
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
