from topics.topic_01_classification.topic import TOPIC as T1
from topics.topic_02_quiz.topic import TOPIC as T2
from topics.topic_03_match.topic import TOPIC as T3
from topics.topic_04_network.topic import TOPIC as T4
from topics.topic_05_zombie_script.topic import TOPIC as T5

TOPICS = {1: T1, 2: T2, 3: T3, 4: T4, 5: T5}


def get_topic(topic_id: int):
    return TOPICS.get(topic_id)


def list_topics():
    return [TOPICS[key] for key in sorted(TOPICS.keys())]


def all_topics_dict():
    """Полный словарь тем (для экспорта ответов и утилит)."""
    return dict(TOPICS)
