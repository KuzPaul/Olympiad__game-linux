"""Точка входа: Flask-приложение для запуска из корня проекта."""

from olympiad import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
