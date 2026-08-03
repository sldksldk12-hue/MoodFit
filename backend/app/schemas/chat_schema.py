from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    user_id: int = 1 
    message: str
    session_id: Optional[int] = None