import pytest
from httpx import AsyncClient
from app.models.database.user import User

@pytest.mark.asyncio
async def test_get_dashboard_stats(auth_client: AsyncClient, test_user: User):
    response = await auth_client.get("/api/v1/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "total_interviews" in data
    assert "streak_count" in data

@pytest.mark.asyncio
async def test_get_streak(auth_client: AsyncClient, test_user: User):
    response = await auth_client.get("/api/v1/streaks/me")
    assert response.status_code == 200
    assert "current_streak" in response.json()

@pytest.mark.asyncio
async def test_log_activity(auth_client: AsyncClient, test_user: User):
    response = await auth_client.post("/api/v1/streaks/log-activity")
    assert response.status_code == 200
    assert response.json()["message"] == "Activity logged successfully"

@pytest.mark.asyncio
async def test_get_recommendations(auth_client: AsyncClient, test_user: User):
    response = await auth_client.get("/api/v1/recommendations/me")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
