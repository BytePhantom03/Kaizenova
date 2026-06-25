import asyncio
import httpx

async def test_complete():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "http://127.0.0.1:8000/api/v1/interviews/79d0e229-5cb6-4eac-b036-b1bd35ccc4e2/complete"
            )
            print("Status:", response.status_code)
            print("Body:", response.text)
        except Exception as e:
            print("Error:", e)

asyncio.run(test_complete())
