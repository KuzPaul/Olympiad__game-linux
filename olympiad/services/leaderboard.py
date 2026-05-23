from olympiad.services.progress import get_topic_progress
from topics import list_topics


def build_student_leaderboard(students):
    """Один участник — одна строка: баллы по модулям, число сданных модулей, место в рейтинге."""
    topics = list_topics()
    total_topics = len(topics)
    rows = []

    for user in students:
        progress = get_topic_progress(user.id, user_role=user.role)
        completed_count = sum(1 for item in progress.values() if item["completed"])
        total_best = sum(item["best_score"] or 0 for item in progress.values())
        total_max = sum(item["max_score"] for item in progress.values())
        percent = round(total_best / total_max * 100, 1) if total_max else 0.0

        rows.append(
            {
                "user": user,
                "progress": progress,
                "completed_count": completed_count,
                "total_topics": total_topics,
                "total_best": total_best,
                "total_max": total_max,
                "percent": percent,
            }
        )

    rows.sort(
        key=lambda row: (
            -row["total_best"],
            -row["completed_count"],
            row["user"].surname.lower(),
            row["user"].name.lower(),
        )
    )

    prev_score = None
    for index, row in enumerate(rows):
        if prev_score is not None and row["total_best"] == prev_score:
            row["rank"] = rows[index - 1]["rank"]
        else:
            row["rank"] = index + 1
        prev_score = row["total_best"]
        row["is_podium"] = row["rank"] <= 3

    return rows


def build_team_leaderboard(student_rows):
    """Суммарный результат команды/факультета по общему полю group_number."""
    teams = {}

    for row in student_rows:
        raw = (row["user"].group_number or "").strip()
        if not raw:
            raw = "—"
        key = raw.casefold()
        if key not in teams:
            teams[key] = {
                "name": raw,
                "member_count": 0,
                "completed_modules": 0,
                "total_best": 0,
                "total_max": 0,
                "total_topics": row["total_topics"],
            }
        team = teams[key]
        team["member_count"] += 1
        team["completed_modules"] += row["completed_count"]
        team["total_best"] += row["total_best"]
        team["total_max"] += row["total_max"]

    rows = list(teams.values())
    for team in rows:
        team["percent"] = round(team["total_best"] / team["total_max"] * 100, 1) if team["total_max"] else 0.0

    rows.sort(key=lambda team: (-team["total_best"], -team["completed_modules"], team["name"].lower()))

    prev_score = None
    for index, team in enumerate(rows):
        if prev_score is not None and team["total_best"] == prev_score:
            team["rank"] = rows[index - 1]["rank"]
        else:
            team["rank"] = index + 1
        prev_score = team["total_best"]
        team["is_podium"] = team["rank"] <= 3

    return rows
