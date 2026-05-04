import os

# Корень проекта (рядом с папкой olympiad/)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_PATH = os.path.join(PROJECT_ROOT, "olympiad_linux.db")


def get_config():
    db_uri = DB_PATH.replace(os.sep, "/")
    return {
        "SECRET_KEY": os.environ.get("SECRET_KEY", "change-this-secret-key"),
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_uri}",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
    }
