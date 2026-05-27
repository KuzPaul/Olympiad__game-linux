# ⏱️ Linux Olympiad — миссии на время с ролями admin/student/tester

Веб-платформа для олимпиады и практикума по **Linux** в игровом формате: миссии на время, роли преподавателя и студента, тестировщики для отладки заданий.

---

## Возможности

- **Пять тематических миссий** — классификация ПО, квиз по процессам, права доступа, сборка сетевых команд, зомби-процессы и Bash.
- **Таймер** запускается после явного подтверждения готовности студентом.
- **Режимы попыток** — у студента одна попытка на тему; у тестировщика (создаётся преподавателем) попыток нет.
- **Фоновая музыка (Web Audio)** — преподаватель может отключить её для всех.
- **Эталонные ответы** в `data/all_answers.json` (генерация: `python3 scripts/export_answers.py`).

## Стек

| Компонент   | Технологии                          |
|------------|--------------------------------------|
| Бэкенд     | Python 3, Flask, SQLAlchemy, Jinja2 |
| Фронтенд   | ES modules (без сборщика)            |
| База данных| SQLite (`olympiad_linux.db`)         |

## Требования

- Python **3.10+** (рекомендуется та же мажорная версия, что и у разработчиков).

## Установка и запуск

```bash
git clone <URL-репозитория>
cd linux_olympiad_web_arcade

python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Отредактируйте .env: задайте SECRET_KEY и ADMIN_INITIAL_PASSWORD (см. ниже).

python3 init_db.py
python3 app.py
```

В браузере откройте адрес из консоли Flask: `http://127.0.0.1:5001` (порт 5001 — на macOS порт 5000 часто занят AirPlay).

## Запуск в Docker

Нужны только [Docker](https://docs.docker.com/get-docker/) и [Docker Compose](https://docs.docker.com/compose/install/) — Python и зависимости на хосте не требуются.

```bash
git clone <URL-репозитория>
cd linux_olympiad_web_arcade

cp .env.example .env
# Задайте SECRET_KEY и ADMIN_INITIAL_PASSWORD в .env

docker compose up --build
```

Приложение будет доступно по адресу **http://127.0.0.1:5001**.

**База данных не удаляется** при остановке контейнера (`docker compose stop`, `docker compose down` или перезапуск). Файл SQLite лежит на вашем диске в папке `docker-data/olympiad_linux.db` — его можно бэкапить и копировать как обычный файл. Данные пропадут только если вы сами удалите каталог `docker-data/`.

Остановка контейнера: `docker compose down`. Снова запустить: `docker compose up`.

Только Docker (без Compose):

```bash
docker build -t olympiad-linux .
mkdir -p docker-data
docker run --rm -p 5001:5001 \
  -e SECRET_KEY='your_secret_key' \
  -e ADMIN_INITIAL_PASSWORD='admin123' \
  -e DATABASE_PATH=/data/olympiad_linux.db \
  -v "$(pwd)/docker-data:/data" \
  olympiad-linux
```

### Переменные окружения

Секреты и пароли задаются **только** в файле `.env` (он в `.gitignore`). Образец без значений — в [`.env.example`](.env.example):

| Переменная | Назначение |
|------------|------------|
| `SECRET_KEY` | Секрет подписи сессий Flask. В production используйте длинную случайную строку. |
| `ADMIN_INITIAL_PASSWORD` | Пароль первого входа для учётной записи преподавателя (логин `admin`). Задаётся при первом создании записи в БД; дальше пароль можно сменить в админ-панели. |

Если `ADMIN_INITIAL_PASSWORD` не задан, учётка `admin` не создаётся автоматически — приложение выведет предупреждение в лог.

Для production дополнительно смените пароль администратора после первого входа и используйте надёжный `SECRET_KEY`.

## Структура репозитория

```
app.py                  # точка входа WSGI / dev-сервер
init_db.py              # инициализация БД и подсказки по учётке admin
olympiad/               # приложение Flask (модели, маршруты, настройки)
topics/                 # данные тем (каждая тема в своей папке)
data/all_answers.json   # эталонные ответы (генерируются скриптом)
scripts/export_answers.py
static/                 # CSS, JS, при необходимости audio/
templates/              # шаблоны Jinja2
```

## Роли

| Роль      | Описание |
|-----------|----------|
| `admin`   | Панель преподавателя, студенты, сброс паролей, вкл/выкл музыки |
| `student` | Одна зафиксированная попытка на тему |
| `tester`  | Повторные проходы для отладки заданий |

Регистрация на сайте доступна только для студентов; тестировщиков добавляет преподаватель.

## Учебные модули

1. Классификация ПО
2. Задачи и процессы
3. Учётные записи и права
4. Сетевые средства Linux
5. Синтаксис Bash (несколько уровней, короткие ответы)

## Разработчики
- Петрич Дмитрий Олегович
- Кузнецов Павел Борисович

