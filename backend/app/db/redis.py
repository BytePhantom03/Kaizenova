from app.config import settings
import logging

logger = logging.getLogger(__name__)

class MockRedis:
    def __init__(self):
        self.data = {}
    
    async def ping(self):
        return True
        
    async def get(self, key: str):
        return self.data.get(key)
        
    async def setex(self, key: str, time: int, value: str):
        self.data[key] = value
        
    async def delete(self, key: str):
        if key in self.data:
            del self.data[key]
            
    async def aclose(self):
        self.data.clear()

class RedisClient:
    def __init__(self):
        self.client = MockRedis()

    async def connect(self):
        logger.info("Connected to Mock in-memory Redis successfully.")

    async def disconnect(self):
        await self.client.aclose()

    def get_client(self):
        return self.client

redis_manager = RedisClient()

async def get_redis():
    return redis_manager.get_client()
