"""
Shared conftest additions for the skills practice module.
Extends the existing conftest.py (which handles DB/Redis/client setup).
Provides skill-session fixtures reusable across all skills test modules.
"""
import pytest
import pytest_asyncio
from uuid import uuid4
from app.models.database.skills_practice import (
    SkillSession, SkillSessionTurn, SkillProgress, VocabularyItem,
    SESSION_STATUS_IN_PROGRESS, SESSION_STATUS_COMPLETED,
)


@pytest_asyncio.fixture
async def test_skill_session(db_session, test_user):
    """A single in-progress speaking session owned by test_user."""
    session = SkillSession(
        user_id=test_user.id,
        trainer_type="speaking",
        topic=None,
        status=SESSION_STATUS_IN_PROGRESS,
    )
    db_session.add(session)
    await db_session.commit()
    await db_session.refresh(session)
    return session


@pytest_asyncio.fixture
async def test_skill_session_with_turn(db_session, test_skill_session):
    """A session with one unanswered turn (first prompt)."""
    turn = SkillSessionTurn(
        session_id=test_skill_session.id,
        turn_order=1,
        prompt="Tell me about yourself.",
        user_response=None,
    )
    db_session.add(turn)
    await db_session.commit()
    await db_session.refresh(turn)
    return test_skill_session, turn


@pytest_asyncio.fixture
async def test_vocabulary_item(db_session, test_user):
    """A vocabulary item owned by test_user, due for review now."""
    from datetime import datetime, timezone, timedelta
    item = VocabularyItem(
        user_id=test_user.id,
        word="eloquent",
        definition="Fluent or persuasive in speaking or writing.",
        example_sentence="She gave an eloquent speech.",
        difficulty="intermediate",
        mastery_level=1,
        review_count=2,
        next_review_at=datetime.now(timezone.utc) - timedelta(hours=1),
    )
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)
    return item
