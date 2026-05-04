from olympiad.extensions import db
from olympiad.models import TopicResult
from topics import list_topics


def get_topic_progress(user_id: int, user_role: str = "student"):
    progress = {}
    for topic in list_topics():
        q = TopicResult.query.filter_by(user_id=user_id, topic_id=topic["id"])
        final_result = q.order_by(TopicResult.created_at.desc()).first()
        attempt_count = q.count()

        if user_role == "tester":
            progress[topic["id"]] = {
                "best_score": final_result.score if final_result else None,
                "max_score": topic["max_score"],
                "attempts": attempt_count,
                "completed": False,
            }
        else:
            progress[topic["id"]] = {
                "best_score": final_result.score if final_result else None,
                "max_score": topic["max_score"],
                "attempts": 1 if final_result else 0,
                "completed": final_result is not None,
            }
    return progress
