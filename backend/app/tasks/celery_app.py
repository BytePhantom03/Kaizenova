from celery import Celery
from app.config import settings

celery_app = Celery(
    "kaizenova_tasks",
    broker=settings.redis.REDIS_URL,
    backend=settings.redis.REDIS_URL,
    include=["app.tasks.evaluation_tasks", "app.tasks.analytics_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
)
