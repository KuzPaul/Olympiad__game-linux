from flask import flash, redirect, render_template, request, url_for

from olympiad.extensions import db
from olympiad.models import TopicResult, User
from olympiad.services.leaderboard import build_student_leaderboard, build_team_leaderboard
from olympiad.services.progress import get_topic_progress
from olympiad.utils.auth import admin_required, normalize_login
from werkzeug.security import generate_password_hash


def register(app):
    @app.route("/admin")
    @admin_required
    def admin_panel():
        users = User.query.filter(User.role != "admin").order_by(User.created_at.desc()).all()
        students = [user for user in users if user.role == "student"]
        testers = [user for user in users if user.role == "tester"]

        leaderboard = build_student_leaderboard(students)
        team_leaderboard = build_team_leaderboard(leaderboard)

        tester_rows = []
        for user in testers:
            user_progress = get_topic_progress(user.id, user_role=user.role)
            total_best = sum(item["best_score"] or 0 for item in user_progress.values())
            total_max = sum(item["max_score"] for item in user_progress.values())
            tester_rows.append(
                {
                    "user": user,
                    "progress": user_progress,
                    "total_best": total_best,
                    "total_max": total_max,
                    "attempts": TopicResult.query.filter_by(user_id=user.id).count(),
                }
            )

        total_students = len(students)
        total_testers = len(testers)
        total_modules_completed = sum(row["completed_count"] for row in leaderboard)
        avg_percent = 0
        if leaderboard:
            avg_percent = round(sum(row["percent"] for row in leaderboard) / len(leaderboard), 1)

        from olympiad.services.settings import get_or_create_settings

        settings = get_or_create_settings()

        return render_template(
            "admin.html",
            users=users,
            leaderboard=leaderboard,
            team_leaderboard=team_leaderboard,
            tester_rows=tester_rows,
            total_students=total_students,
            total_testers=total_testers,
            total_modules_completed=total_modules_completed,
            avg_percent=avg_percent,
            music_enabled=settings.music_enabled,
        )

    @app.route("/admin/create_student", methods=["POST"])
    @admin_required
    def create_student():
        surname = request.form.get("surname", "").strip()
        name = request.form.get("name", "").strip()
        patronymic = request.form.get("patronymic", "").strip()
        group_number = request.form.get("group_number", "").strip()
        login_value = normalize_login(request.form.get("login", ""))
        password = request.form.get("password", "")

        if not all([surname, name, group_number, login_value, password]):
            flash("Для добавления студента заполни все обязательные поля.", "error")
            return redirect(url_for("admin_panel"))

        if User.query.filter_by(login=login_value).first():
            flash("Логин уже существует.", "error")
            return redirect(url_for("admin_panel"))

        role = request.form.get("role", "student").strip()
        if role not in ("student", "tester"):
            role = "student"

        user = User(
            surname=surname,
            name=name,
            patronymic=patronymic,
            group_number=group_number,
            login=login_value,
            password_hash=generate_password_hash(password),
            role=role,
        )
        db.session.add(user)
        db.session.commit()
        flash("Пользователь добавлен.", "success")
        return redirect(url_for("admin_panel"))

    @app.route("/admin/settings/music", methods=["POST"])
    @admin_required
    def toggle_music():
        from olympiad.services.settings import get_or_create_settings

        enabled = request.form.get("music_enabled", "1") == "1"
        s = get_or_create_settings()
        s.music_enabled = enabled
        db.session.commit()
        flash("Настройка фоновой музыки сохранена.", "success")
        return redirect(url_for("admin_panel"))

    @app.route("/admin/delete_student/<int:user_id>", methods=["POST"])
    @admin_required
    def delete_student(user_id: int):
        user = User.query.get_or_404(user_id)
        if user.role == "admin":
            flash("Нельзя удалить администратора.", "error")
            return redirect(url_for("admin_panel"))

        db.session.delete(user)
        db.session.commit()
        flash("Студент и его результаты удалены.", "success")
        return redirect(url_for("admin_panel"))

    @app.route("/admin/reset_password/<int:user_id>", methods=["POST"])
    @admin_required
    def reset_password(user_id: int):
        user = User.query.get_or_404(user_id)
        new_password = request.form.get("new_password", "").strip()
        if not new_password:
            flash("Новый пароль пустой.", "error")
            return redirect(url_for("admin_panel"))

        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        flash(f"Пароль для {user.full_name} обновлён.", "success")
        return redirect(url_for("admin_panel"))
