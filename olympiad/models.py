from datetime import datetime

from olympiad.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    surname = db.Column(db.String(80), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    patronymic = db.Column(db.String(80), nullable=True)
    group_number = db.Column(db.String(80), nullable=False)  # команда / факультет (общее поле)
    login = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="student", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    results = db.relationship("TopicResult", back_populates="user", cascade="all, delete-orphan")

    @property
    def full_name(self):
        parts = [self.surname, self.name, self.patronymic or ""]
        return " ".join(part for part in parts if part).strip()


class AppSettings(db.Model):
    """Глобальные настройки (одна строка id=1)."""

    __tablename__ = "app_settings"

    id = db.Column(db.Integer, primary_key=True)
    music_enabled = db.Column(db.Boolean, default=True, nullable=False)


class TopicResult(db.Model):
    __tablename__ = "topic_results"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    topic_id = db.Column(db.Integer, nullable=False)
    score = db.Column(db.Integer, nullable=False)
    max_score = db.Column(db.Integer, nullable=False)
    attempt = db.Column(db.Integer, nullable=False, default=1)
    details_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", back_populates="results")
