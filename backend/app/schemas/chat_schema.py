from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ChatRequest(BaseModel):
    user_id: int = 1 
    message: str
    session_id: Optional[int] = None

class AIResponseSchema(BaseModel):
    message: str
    recommended_products: Optional[List[Dict[str, Any]]] = []