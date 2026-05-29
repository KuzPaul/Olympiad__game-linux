import os

from dotenv import load_dotenv

# Корень проекта (рядом с папкой olympiad/)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

load_dotenv(os.path.join(PROJECT_ROOT, ".env"))


def get_database_path():
    """Путь к файлу SQLite. Пустой DATABASE_PATH в .env не подменяет значение по умолчанию."""
    explicit = os.environ.get("DATABASE_PATH", "").strip()
    if explicit:
        return explicit
    return os.path.join(PROJECT_ROOT, "olympiad_linux.db")


def get_config():
    db_uri = get_database_path().replace(os.sep, "/")
    return {
        "SECRET_KEY": os.environ.get("SECRET_KEY") or "change-this-secret-key",
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_uri}",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
    }
