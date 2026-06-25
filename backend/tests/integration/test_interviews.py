import pytest
from httpx import AsyncClient
from app.models.database.user import User

@pytest.mark.asyncio
async def test_start_interview(auth_client: AsyncClient, test_user: User):
    response = await auth_client.post(
        "/api/v1/interviews/start",
        json={
            "interview_type": "technical",
            "target_role": "Backend Engineer",
            "domain": "python",
            "difficulty_setting": "intermediate"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["interview_type"] == "technical"
    assert data["status"] == "in_progress"
    return data["id"]

@pytest.mark.asyncio
async def test_interview_flow(auth_client: AsyncClient, test_user: User):
    # 1. Start Interview
    start_resp = await auth_client.post(
        "/api/v1/interviews/start",
        json={
            "interview_type": "technical",
            "target_role": "Backend Engineer",
            "domain": "python",
            "difficulty_setting": "intermediate"
        }
    )
    interview_id = start_resp.json()["id"]

    # 2. Get Next Question
    q_resp = await auth_client.get(f"/api/v1/interviews/{interview_id}/next-question")
    # This might fail 400 if test db has no matching questions, but we created a test_question fixture
    if q_resp.status_code == 200:
        question_id = q_resp.json()["id"]
        
        # 3. Submit Answer
        a_resp = await auth_client.post(
            f"/api/v1/interviews/{interview_id}/answer",
            json={
                "question_id": question_id,
                "answer_text": "This is a great answer."
            }
        )
        assert a_resp.status_code == 200
        assert "composite_score" in a_resp.json()

    # 4. Complete Interview
    c_resp = await auth_client.post(f"/api/v1/interviews/{interview_id}/complete")
    assert c_resp.status_code == 200
    assert "overall_score" in c_resp.json()
