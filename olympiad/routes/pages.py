import json

from flask import flash, redirect, render_template, request, session, url_for

from olympiad.extensions import db
from olympiad.models import TopicResult
from olympiad.services.progress import get_topic_progress
from olympiad.services.settings import is_music_enabled
from olympiad.utils.auth import login_required, normalize_login
from werkzeug.security import generate_password_hash
from topics import get_topic, list_topics


def register(app):
    @app.route("/")
    def index():
        if session.get("user_id"):
            return redirect(url_for("dashboard"))
        return redirect(url_for("login"))

    @app.route("/register", methods=["GET", "POST"], endpoint="register")
    def register_view():
        if request.method == "POST":
            surname = request.form.get("surname", "").strip()
            name = request.form.get("name", "").strip()
            patronymic = request.form.get("patronymic", "").strip()
            group_number = request.form.get("group_number", "").strip()
            login_value = normalize_login(request.form.get("login", ""))
            password = request.form.get("password", "")

            if not all([surname, name, group_number, login_value, password]):
                flash("Заполни обязательные поля.", "error")
                return render_template("register.html")

            existing_user = User.query.filter_by(login=login_value).first()
            if existing_user:
                flash("Такой логин уже занят.", "error")
                return render_template("register.html")

            user = User(
                surname=surname,
                name=name,
                patronymic=patronymic,
                group_number=group_number,
                login=login_value,
                password_hash=generate_password_hash(password),
                role="student",
            )
            db.session.add(user)
            db.session.commit()
            flash("Регистрация завершена. Теперь можно войти.", "success")
            return redirect(url_for("login"))

        return render_template("register.html")

    @app.route("/dashboard")
    @login_required
    def dashboard():
        if session.get("role") == "admin":
            return redirect(url_for("admin_panel"))

        role = session.get("role") or "student"
        progress = get_topic_progress(session["user_id"], user_role=role)
        recent_results = (
            TopicResult.query.filter_by(user_id=session["user_id"])
            .order_by(TopicResult.created_at.desc())
            .limit(10)
            .all()
        )
        total_best = sum(entry["best_score"] or 0 for entry in progress.values())
        total_max = sum(entry["max_score"] for entry in progress.values())
        completed_topics = sum(1 for entry in progress.values() if entry["completed"])

        return render_template(
            "dashboard.html",
            progress=progress,
            recent_results=recent_results,
            total_best=total_best,
            total_max=total_max,
            completed_topics=completed_topics,
            user_role=role,
        )

    @app.route("/topic/<int:topic_id>")
    @login_required
    def topic_page(topic_id: int):
        if session.get("role") == "admin":
            flash(
                "Преподаватель видит результаты через админ-панель. Для прохождения можно создать студенческий аккаунт.",
                "info",
            )
        topic = get_topic(topic_id)
        if not topic:
            flash("Такой темы нет.", "error")
            return redirect(url_for("dashboard"))

        role = session.get("role") or "student"
        is_tester = role == "tester"

        completed_result = (
            TopicResult.query.filter_by(user_id=session["user_id"], topic_id=topic_id)
            .order_by(TopicResult.created_at.desc())
            .first()
        )
        is_locked = (completed_result is not None) and not is_tester

        return render_template(
            "topic.html",
            topic=topic,
            topic_payload=json.dumps(topic, ensure_ascii=False),
            completed_result=completed_result,
            is_locked=is_locked,
            is_tester=is_tester,
            music_enabled=is_music_enabled(),
        )
