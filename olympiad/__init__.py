import os
from datetime import datetime

from flask import Flask, request, session
from werkzeug.security import generate_password_hash

from olympiad.config import PROJECT_ROOT, get_config
from olympiad.extensions import db
from olympiad.models import AppSettings, User
from olympiad.routes import register_routes
from olympiad.services.settings import is_music_enabled


def create_app():
    app = Flask(
        __name__,
        template_folder=os.path.join(PROJECT_ROOT, "templates"),
        static_folder=os.path.join(PROJECT_ROOT, "static"),
        static_url_path="/static",
    )
    app.config.update(get_config())
    db.init_app(app)
    register_routes(app)

    @app.context_processor
    def inject_globals():
        from topics import list_topics

        current_topic_id = None
        nav_active = None
        if request.endpoint == "topic_page" and request.view_args:
            current_topic_id = request.view_args.get("topic_id")
            nav_active = "topic"
        elif request.endpoint == "dashboard":
            nav_active = "dashboard"
        elif request.endpoint == "admin_panel":
            nav_active = "admin"

        user_profile = None
        if session.get("user_id"):
            user = User.query.get(session["user_id"])
            if user:
                role_labels = {
                    "admin": "преподаватель",
                    "tester": "тестировщик",
                    "student": "студент",
                }
                user_profile = {
                    "full_name": user.full_name,
                    "team": user.group_number,
                    "role": user.role,
                    "role_label": role_labels.get(user.role, user.role),
                }

        return {
            "all_topics": list_topics(),
            "now_year": datetime.utcnow().year,
            "music_enabled": is_music_enabled(),
            "current_topic_id": current_topic_id,
            "nav_active": nav_active,
            "user_profile": user_profile,
        }

    with app.app_context():
        db.create_all()
        if not AppSettings.query.get(1):
            db.session.add(AppSettings(id=1, music_enabled=True))
            db.session.commit()
        admin = User.query.filter_by(login="admin").first()
        if not admin:
            initial_password = os.environ.get("ADMIN_INITIAL_PASSWORD", "").strip()
            if initial_password:
                admin = User(
                    surname="Преподаватель",
                    name="Админ",
                    patronymic="",
                    group_number="TEACHER",
                    login="admin",
                    password_hash=generate_password_hash(initial_password),
                    role="admin",
                )
                db.session.add(admin)
                db.session.commit()
            else:
                app.logger.warning(
                    "Пользователь admin не создан: задайте ADMIN_INITIAL_PASSWORD в файле .env "
                    "(скопируйте .env.example → .env). Перезапустите приложение после сохранения."
                )

    return app
