from datetime import datetime, timedelta

import boto3
import pytz


def get_cost_and_usage(
    granularity="MONTHLY",
    with_resources=False,
):
    """
    Retrieves AWS billing data using the Cost Explorer service.
    """
    try:
        # Create a Cost Explorer client
        client = boto3.client("ce")

        # Define the granularity of the data (e.g., monthly, daily)
        # granularity = "MONTHLY"

        # Define the time period for the billing data
        now = datetime.now(pytz.utc)

        if granularity == "MONTHLY":
            start = now.replace(day=1)
            end = start.replace(month=now.month + 1, day=1) - timedelta(days=1)
            time_period = {
                "Start": start.strftime("%Y-%m-%d"),
                "End": end.strftime("%Y-%m-%d"),
            }

        elif granularity == "DAILY":
            start = now - timedelta(days=7)
            end = start + timedelta(days=7)
            time_period = {
                "Start": start.strftime("%Y-%m-%d"),
                "End": end.strftime("%Y-%m-%d"),
            }

        # Define the metrics to retrieve (e.g., UnblendedCost, BlendedCost)
        metrics = [
            "UnblendedCost",
        ]

        # Define the dimensions to group by (e.g., RESOURCE_ID)
        group_by = [
            {
                "Type": "DIMENSION",
                "Key": "SERVICE",
            },
        ]

        # Get cost and usage data
        if not with_resources:
            response = client.get_cost_and_usage(
                Granularity=granularity,
                TimePeriod=time_period,
                Metrics=metrics,
            )

        else:
            response = client.get_cost_and_usage(
                Granularity=granularity,
                TimePeriod=time_period,
                Metrics=metrics,
                GroupBy=group_by,
            )

        # Print the billing data
        if not with_resources:
            print("AWS Cost and Usage Data:")
            for result in response["ResultsByTime"]:
                print(f"  Start: {result['TimePeriod']['Start']}")
                print(f"  End: {result['TimePeriod']['End']}")
                for metric in metrics:
                    print(
                        f"  {metric}: {result['Total'][metric]['Amount']} {result['Total'][metric]['Unit']}"
                    )
                print("-" * 30)

        else:
            print("AWS Cost and Usage Data with Resources:")
            for result in response["ResultsByTime"]:
                print(f"  Start: {result['TimePeriod']['Start']}")
                print(f"  End: {result['TimePeriod']['End']}")
                for group in result["Groups"]:
                    if all(
                        float(group["Metrics"][metric]["Amount"]) == 0.0
                        for metric in metrics
                    ):
                        continue
                    print(f"    Resource ID: {group['Keys'][0]}")
                    for metric in metrics:
                        print(
                            f"      {metric}: {group['Metrics'][metric]['Amount']} {group['Metrics'][metric]['Unit']}"
                        )
                    print("    " + "-" * 26)
                print("-" * 30)

    except Exception as e:
        print(f"Error retrieving billing data: {e}")


if __name__ == "__main__":
    get_cost_and_usage()
    get_cost_and_usage(with_resources=True)
