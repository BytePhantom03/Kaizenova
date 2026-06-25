import pytest
from httpx import AsyncClient
from app.models.database.user import User

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "Password123!",
            "full_name": "New User"
        }
    )
    assert response.status_code == 201
    assert "user_id" in response.json()

@pytest.mark.asyncio
async def test_login_user(client: AsyncClient, test_user: User):
    # test_user is created with 'fakehash'. We need to test real login.
    # We will register a user and then login.
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "loginuser@example.com",
            "password": "Password123!",
            "full_name": "Login User"
        }
    )
    
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "loginuser@example.com",
            "password": "Password123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    
    # Check if refresh_token cookie was set
    assert "refresh_token" in response.cookies

@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient):
    # Setup: Register and login to get refresh cookie
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "refreshuser@example.com",
            "password": "Password123!",
            "full_name": "Refresh User"
        }
    )
    
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "refreshuser@example.com",
            "password": "Password123!"
        }
    )
    refresh_cookie = login_response.cookies.get("refresh_token")
    
    # Test refresh endpoint
    client.cookies.set("refresh_token", refresh_cookie)
    response = await client.post("/api/v1/auth/refresh")
    
    assert response.status_code == 200
    assert "access_token" in response.json()

@pytest.mark.asyncio
async def test_logout_user(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "logoutuser@example.com",
            "password": "Password123!",
            "full_name": "Logout User"
        }
    )
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "logoutuser@example.com",
            "password": "Password123!"
        }
    )
    
    access_token = login_response.json()["access_token"]
    refresh_cookie = login_response.cookies.get("refresh_token")
    
    client.headers.update({"Authorization": f"Bearer {access_token}"})
    client.cookies.set("refresh_token", refresh_cookie)
    
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"
