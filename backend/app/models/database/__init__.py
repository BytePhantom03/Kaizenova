# Import all models here so SQLAlchemy's metadata is fully populated
# before any FK resolution happens at commit time.
from app.models.database.user import User, Profile, Skill, UserSkill  # noqa: F401
from app.models.database.interview import Interview, Answer, AnswerScore, Resume  # noqa: F401
from app.models.database.analytics import InterviewReport, DailyActivity, Recommendation, UserProgress, Streak  # noqa: F401
from app.models.database.question import Question  # noqa: F401
from app.models.database.skills_practice import SkillSession, SkillSessionTurn, SkillProgress, VocabularyItem  # noqa: F401
