# Установка и запуск

Техническая инструкция для развёртывания **Linux Olympiad · Arcade** на одном компьютере (сервер в классе) или для локальной разработки.

Обзор проекта — в [README.md](../README.md).

---

## Требования

| Способ запуска | Нужно |
|----------------|--------|
| **Docker (рекомендуется)** | [Docker](https://docs.docker.com/get-docker/) и [Docker Compose](https://docs.docker.com/compose/install/) |
| **Локально (Python)** | Python **3.10+** (в образе Docker используется 3.12) |

Порт по умолчанию: **5001**

---

## Быстрый старт (Docker)

```bash
git clone <URL-репозитория>
cd Olympiad__game-linux

cp .env.example .env

# Отредактируйте SECRET_KEY и ADMIN_INITIAL_PASSWORD

docker compose up --build
```

Откройте в браузере: **http://127.0.0.1:5001**

| Действие | Команда |
|----------|---------|
| Остановить | `docker compose down` |
| Запустить снова | `docker compose up` |
| Пересобрать образ | `docker compose up --build` |

### База данных в Docker

- Файл на диске хоста: `docker-data/olympiad_linux.db`
- В контейнере: `/app/db/olympiad_linux.db`
- При `docker compose stop` / `down` данные **сохраняются**
- Полный сброс: удалите папку `docker-data/` и снова выполните `docker compose up`

**Важно:** не задавайте `DATABASE_PATH` в `.env` — путь к БД задаётся в `docker-compose.yml`. Иначе приложение может писать не в смонтированную папку, и учётная запись преподавателя «пропадёт».

### Docker без Compose

```bash
docker build -t olympiad-linux .
mkdir -p docker-data

docker run --rm -p 5001:5001 \
  -e SECRET_KEY='your_secret_key' \
  -e ADMIN_INITIAL_PASSWORD='admin123' \
  -e DATABASE_PATH=/app/db/olympiad_linux.db \
  -v "$(pwd)/docker-data:/app/db" \
  olympiad-linux
```

---

## Установка через Python (локально)

```bash
git clone <URL-репозитория>
cd Olympiad__game-linux

python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Отредактируйте .env

python3 init_db.py
python3 app.py
```

База SQLite по умолчанию: `olympiad_linux.db` в корне проекта.

---

## Переменные окружения

Скопируйте [`.env.example`](../.env.example) в `.env` (файл не коммитится в git).

| Переменная | Назначение |
|------------|------------|
| `SECRET_KEY` | Секрет подписи сессий Flask. Для занятия в сети используйте длинную случайную строку. |
| `ADMIN_INITIAL_PASSWORD` | Пароль первого входа преподавателя (логин: `admin`). Создаётся один раз при первом запуске, если записи ещё нет в БД. Далее пароль меняется в админ-панели. |

Если `ADMIN_INITIAL_PASSWORD` не задан, учётка `admin` не создаётся — в логе будет предупреждение.

Для Docker файл `.env` обязателен (`env_file` в `docker-compose.yml`).

---

## Первый вход

| Роль | Логин | Пароль |
|------|-------|--------|
| Преподаватель | `admin` | значение `ADMIN_INITIAL_PASSWORD` из `.env` |
| Студент | — | регистрация на странице «Регистрация» |

Тестировщелей добавляет преподаватель в админ-панели.

---

## Доступ из локальной сети

1. Запустите сервер на одном ПК (Docker или `python3 app.py`).
2. Узнайте IP этого компьютера в Wi‑Fi/LAN (например `192.168.1.42`).
3. Раздайте студентам ссылку: `http://<IP-сервера>:5001`

Не используйте `localhost` в ссылке для других машин — у каждого устройства это свой компьютер.

При необходимости разрешите входящие подключения на порт **5001** в файрволе ОС.

---

## Структура проекта (для администратора)

```
app.py              # точка входа
init_db.py          # инициализация БД
olympiad/           # приложение Flask
topics/             # задания по темам
templates/          # шаблоны страниц
static/             # CSS, JS, изображения
docker-compose.yml
Dockerfile
docker-data/        # БД при запуске в Docker (создаётся автоматически)
```

---

## Эталонные ответы (опционально)

Файл `data/all_answers.json` генерируется скриптом:

```bash
python3 scripts/export_answers.py
```

Нужен при обновлении заданий в `topics/`, не для обычного запуска платформы.

---

## Устранение неполадок

| Симптом | Что проверить |
|---------|----------------|
| `docker compose` ругается на `.env` | Выполните `cp .env.example .env` |
| Не входит `admin` | Пароль из `.env`; при новой БД — удалили `docker-data/` и перезапустили |
| Админка «пустая» после Docker | Не задавайте `DATABASE_PATH` в `.env`; проверьте наличие `docker-data/olympiad_linux.db` |
| Порт занят | Смените порт: `PORT=5002 docker compose up` и в `ports` в compose |
| Студенты не открывают сайт | Один Wi‑Fi, IP сервера, файрвол, не `localhost` |

---

## Безопасность

- Смените `SECRET_KEY` и пароль `admin` перед занятием в общей сети.
- Платформа рассчитана на закрытую аудиторию; не выставляйте порт в интернет без дополнительной защиты (HTTPS, reverse proxy).
