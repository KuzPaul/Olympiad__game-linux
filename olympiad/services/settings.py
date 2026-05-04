from olympiad.extensions import db
from olympiad.models import AppSettings


def get_or_create_settings() -> AppSettings:
    row = AppSettings.query.get(1)
    if not row:
        row = AppSettings(id=1, music_enabled=True)
        db.session.add(row)
        db.session.commit()
    return row


def is_music_enabled() -> bool:
    return get_or_create_settings().music_enabled
