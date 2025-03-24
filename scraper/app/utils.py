import requests

GRAPHQL_URL = "https://leetcode.com/graphql"
HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    "Referer": "https://leetcode.com/problemset/all/",
}


def fetch_question_progress(user_slug: str):
    headers = HEADERS.copy()
    headers.update(
        {
            "Referer": f"https://leetcode.com/{user_slug}/",
        }
    )

    query = """
    query userProfileUserQuestionProgressV2($userSlug: String!) {
      userProfileUserQuestionProgressV2(userSlug: $userSlug) {
        numAcceptedQuestions {
          count
          difficulty
        }
      }
    }
    """
    payload = {
        "query": query,
        "variables": {"userSlug": user_slug},
        "operationName": "userProfileUserQuestionProgressV2",
    }
    response = requests.post(GRAPHQL_URL, json=payload, headers=headers)

    if response.status_code == 200:
        data = response.json()
        data = data["data"]["userProfileUserQuestionProgressV2"][
            "numAcceptedQuestions"
        ]
        response = {
            "EASY": 0,
            "MEDIUM": 0,
            "HARD": 0,
            "TOTAL": 0,
        }
        for entry in data:
            difficulty: str = entry["difficulty"]
            count: int = entry["count"]
            assert difficulty in response
            response[difficulty] = count
            response["TOTAL"] += count
        return response
    else:
        raise Exception(
            f"Query failed to run with status code {response.status_code}: {response.text}"
        )
