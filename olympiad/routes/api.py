import json

from flask import jsonify, request, session

from olympiad.extensions import db
from olympiad.models import TopicResult, User
from olympiad.utils.auth import login_required
from topics import get_topic


def register(app):
    @app.route("/api/topic/<int:topic_id>/submit", methods=["POST"])
    @login_required
    def submit_topic(topic_id: int):
        topic = get_topic(topic_id)
        if not topic:
            return jsonify({"ok": False, "message": "Тема не найдена."}), 404

        user = User.query.get(session["user_id"])
        if not user:
            return jsonify({"ok": False, "message": "Пользователь не найден."}), 401

        is_tester = user.role == "tester"

        existing_result = (
            TopicResult.query.filter_by(user_id=user.id, topic_id=topic_id)
            .order_by(TopicResult.created_at.desc())
            .first()
        )
        if not is_tester and existing_result:
            return jsonify({"ok": False, "message": "Тема уже завершена. Повторное прохождение недоступно."}), 403

        payload = request.get_json(silent=True)
        if not payload and request.data:
            try:
                payload = json.loads(request.data)
            except (json.JSONDecodeError, TypeError):
                payload = None
        payload = payload or {}
        score = payload.get("score")
        details = payload.get("details", {})

        if not isinstance(score, int):
            return jsonify({"ok": False, "message": "Некорректный результат."}), 400

        score = max(0, min(score, topic["max_score"]))

        attempt_no = TopicResult.query.filter_by(user_id=user.id, topic_id=topic_id).count() + 1
        if not is_tester:
            attempt_no = 1

        result = TopicResult(
            user_id=user.id,
            topic_id=topic_id,
            score=score,
            max_score=topic["max_score"],
            attempt=attempt_no,
            details_json=json.dumps(details, ensure_ascii=False),
        )
        db.session.add(result)
        db.session.commit()

        return jsonify(
            {
                "ok": True,
                "message": "Результат зафиксирован.",
                "attempt": attempt_no,
                "best_score": score,
                "tester": is_tester,
            }
        )
