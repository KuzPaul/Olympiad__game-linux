import os
from datetime import datetime

from flask import Flask
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

        return {
            "all_topics": list_topics(),
            "now_year": datetime.utcnow().year,
            "music_enabled": is_music_enabled(),
        }

    with app.app_context():
        db.create_all()
        if not AppSettings.query.get(1):
            db.session.add(AppSettings(id=1, music_enabled=True))
            db.session.commit()
        admin = User.query.filter_by(login="admin").first()
        if not admin:
            admin = User(
                surname="Преподаватель",
                name="Админ",
                patronymic="",
                group_number="TEACHER",
                login="admin",
                password_hash=generate_password_hash("admin123"),
                role="admin",
            )
            db.session.add(admin)
            db.session.commit()

    return app
