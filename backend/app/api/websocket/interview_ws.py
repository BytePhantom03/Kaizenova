from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.security import verify_token
import json
from app.utils.logger import logger

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, interview_id: str):
        await websocket.accept()
        self.active_connections[interview_id] = websocket
        logger.info(f"WebSocket connected for interview {interview_id}")

    def disconnect(self, interview_id: str):
        if interview_id in self.active_connections:
            del self.active_connections[interview_id]
            logger.info(f"WebSocket disconnected for interview {interview_id}")

    async def send_message(self, message: str, interview_id: str):
        if interview_id in self.active_connections:
            await self.active_connections[interview_id].send_text(message)

manager = ConnectionManager()

@router.websocket("/{interview_id}")
async def websocket_endpoint(websocket: WebSocket, interview_id: str, token: str):
    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008)
            return
            
        await manager.connect(websocket, interview_id)
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "audio_chunk":
                await manager.send_message(json.dumps({"status": "received", "type": "audio_ack"}), interview_id)
                
            elif message.get("type") == "ping":
                await manager.send_message(json.dumps({"type": "pong"}), interview_id)
                
    except WebSocketDisconnect:
        manager.disconnect(interview_id)
    except Exception as e:
        logger.error("websocket_error", error=str(e))
        manager.disconnect(interview_id)
        try:
            await websocket.close(code=1011)
        except:
            pass
