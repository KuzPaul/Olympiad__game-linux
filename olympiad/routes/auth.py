from flask import flash, redirect, render_template, request, session, url_for
from werkzeug.security import check_password_hash

from olympiad.extensions import db
from olympiad.models import User
from olympiad.utils.auth import login_required, normalize_login


def register(app):
    @app.route("/login", methods=["GET", "POST"])
    def login():
        if request.method == "POST":
            login_value = normalize_login(request.form.get("login", ""))
            password = request.form.get("password", "")
            user = User.query.filter_by(login=login_value).first()
            if user and check_password_hash(user.password_hash, password):
                session["user_id"] = user.id
                session["role"] = user.role
                return redirect(url_for("admin_panel" if user.role == "admin" else "dashboard"))
            flash("Неверный логин или пароль.", "error")
        return render_template("login.html")

    @app.route("/logout")
    @login_required
    def logout():
        session.clear()
        flash("Ты вышел из системы.", "success")
        return redirect(url_for("login"))
