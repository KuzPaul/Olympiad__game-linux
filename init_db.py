from olympiad import create_app
from olympiad.models import User


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        admin = User.query.filter_by(login="admin").first()

    print("База данных инициализирована.")
    if admin:
        print("Учётная запись преподавателя: логин admin, пароль — как в переменной ADMIN_INITIAL_PASSWORD (.env).")
    else:
        print(
            "Учётная запись admin ещё не создана: скопируйте .env.example в .env, "
            "задайте ADMIN_INITIAL_PASSWORD (и при необходимости SECRET_KEY), затем снова запустите init_db.py или app.py."
        )
