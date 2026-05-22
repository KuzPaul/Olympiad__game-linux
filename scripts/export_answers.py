#!/usr/bin/env python3
"""Собирает эталонные ответы из topics/ в data/all_answers.json для проверки и ревью."""

import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from topics import all_topics_dict  # noqa: E402


def build_payload():
    out = {}
    for tid, topic in sorted(all_topics_dict().items()):
        entry = {
            "id": topic["id"],
            "short_title": topic["short_title"],
            "type": topic["type"],
            "max_score": topic["max_score"],
        }
        t = topic["type"]
        if t == "classification":
            entry["answers"] = [
                {"item": item["label"], "category": item["category"]} for item in topic["items"]
            ]
        elif t == "quiz":
            entry["answers"] = []
            for i, q in enumerate(topic["questions"]):
                entry["answers"].append(
                    {
                        "index": i,
                        "correct_option_index": q["answer"],
                        "correct_option": q["options"][q["answer"]],
                    }
                )
        elif t == "match":
            entry["answers"] = [{"left": p["left"], "right": p["right"]} for p in topic["pairs"]]
        elif t == "zombie_script":
            entry["full_script_primary"] = topic.get("full_script", "")
            entry["answers"] = []
            for i, task in enumerate(topic["tasks"]):
                row = {
                    "task_index": i,
                    "scenario": task["scenario"],
                    "primary": task["answer"],
                }
                if task.get("accepted"):
                    row["accepted_variants"] = task["accepted"]
                entry["answers"].append(row)
        elif t == "builder":
            entry["answers"] = []
            for i, task in enumerate(topic["tasks"]):
                row = {
                    "task_index": i,
                    "scenario": task["scenario"],
                    "primary": task["answer"],
                }
                if task.get("accepted"):
                    row["accepted_variants"] = task["accepted"]
                entry["answers"].append(row)
        else:
            entry["answers"] = []
        out[str(tid)] = entry
    return out


def main():
    data = build_payload()
    out_dir = os.path.join(ROOT, "data")
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "all_answers.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Written: {path}")


if __name__ == "__main__":
    main()
