from fastapi import APIRouter

router = APIRouter()


@router.get("/announcements")
async def get_announcement():
    return {
        "announcements": [
            {
                "title": "Welcome to LeetCode Progress",
                "content": "User system has been implemented!\nLogin and save your LeetCode username to start!",
                "date": "2025-03-08",
            },
        ]
    }
