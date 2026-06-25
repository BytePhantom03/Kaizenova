import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from redis.asyncio import Redis
import fakeredis.aioredis
from uuid import uuid4

from app.main import app
from app.db.session import Base, get_db
from app.db.redis import get_redis
from app.config import settings
from app.core.security import create_access_token
from app.models.database.user import User
from app.models.database.interview import Interview
from app.models.database.question import Question

# Use a test database
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/kaizenova_test"
# If running without postgres, uncomment below and add aiosqlite to requirements
# TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@pytest_asyncio.fixture(scope="session")
async def test_db_setup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest_asyncio.fixture
async def db_session(test_db_setup):
    async with TestingSessionLocal() as session:
        yield session

@pytest_asyncio.fixture
async def fake_redis():
    redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    yield redis
    await redis.close()

@pytest_asyncio.fixture
async def client(db_session, fake_redis):
    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_redis] = lambda: fake_redis
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
        
    app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def test_user(db_session):
    user = User(
        email="testuser@example.com",
        password_hash="fakehash",
        email_verified=True,
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest_asyncio.fixture
async def auth_client(client, test_user):
    token = create_access_token(data={"sub": str(test_user.id)})
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client

@pytest_asyncio.fixture
async def test_question(db_session):
    question = Question(
        domain="python",
        difficulty=1,
        question_type="technical",
        question_text="What is a list comprehension?",
        expected_answer="A concise way to create lists in Python.",
        key_concepts=["syntax", "iteration"],
        company_tags=["general"]
    )
    db_session.add(question)
    await db_session.commit()
    await db_session.refresh(question)
    return question

@pytest_asyncio.fixture
async def test_interview(db_session, test_user):
    interview = Interview(
        user_id=test_user.id,
        interview_type="technical",
        difficulty_setting="beginner",
        duration_minutes=30,
        domain="python"
    )
    db_session.add(interview)
    await db_session.commit()
    await db_session.refresh(interview)
    return interview
