import pytest
from httpx import AsyncClient
from app.models.database.user import User

@pytest.mark.asyncio
async def test_get_profile(auth_client: AsyncClient, test_user: User):
    response = await auth_client.get("/api/v1/profile/me")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == str(test_user.id)
    assert "full_name" in data

@pytest.mark.asyncio
async def test_update_profile(auth_client: AsyncClient, test_user: User):
    update_data = {
        "full_name": "Updated Name",
        "experience_level": "Senior",
        "skills": [
            {"name": "Python", "proficiency": "Expert"},
            {"name": "Docker", "proficiency": "Intermediate"}
        ]
    }
    response = await auth_client.put("/api/v1/profile/me", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["experience_level"] == "Senior"
    assert len(data["skills"]) == 2
    assert data["skills"][0]["name"] == "Python"
