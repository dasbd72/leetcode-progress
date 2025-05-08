import requests
import json

def main():
    query = """
    query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
            id
            title
            titleSlug
            timestamp
        }
    }
    """
    variables = {
        "username": "winstonwang",
        "limit": 15
    }
    operationName = "recentAcSubmissions"

    url = "https://leetcode.com/graphql"
    payload = {
        "query": query,
        "variables": variables,
        "operationName": operationName
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        data = response.json()

        if "data" in data and "recentAcSubmissionList" in data["data"]:
            submissions = data["data"]["recentAcSubmissionList"]
            for submission in submissions:
                print(f"ID: {submission['id']}")
                print(f"Title: {submission['title']}")
                print(f"Slug: {submission['titleSlug']}")
                print(f"Timestamp: {submission['timestamp']}")
                print("-" * 20)
        else:
            print("Error: 'recentAcSubmissionList' not found in response")
            print(data)  # Print the entire response for debugging

    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
    except json.JSONDecodeError as e:
        print(f"Failed to decode JSON: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    main()
