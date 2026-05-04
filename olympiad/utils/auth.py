from functools import wraps

from flask import flash, redirect, session, url_for


def normalize_login(value: str) -> str:
    return (value or "").strip().casefold()


def login_required(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        if not session.get("user_id"):
            return redirect(url_for("login"))
        return view_func(*args, **kwargs)

    return wrapper


def admin_required(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        if not session.get("user_id") or session.get("role") != "admin":
            flash("Доступ только для преподавателя.", "error")
            return redirect(url_for("login"))
        return view_func(*args, **kwargs)

    return wrapper
