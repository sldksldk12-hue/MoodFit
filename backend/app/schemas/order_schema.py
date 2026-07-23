# app/schemas/order_schema.py
from pydantic import BaseModel
from typing import Optional, List

class AddressSchema(BaseModel):
    receiver_name: str
    call_number: str
    user_address: str
    zip_code: str
    address_detail: str
    delivery_request: Optional[str] = None

class OrderItemInput(BaseModel):
    product_id: int
    quantity: int
    selected_size: str
    selected_color: Optional[str] = None

class OrderCreateRequest(BaseModel):
    user_id: int
    address_id: Optional[int] = None
    address_info: Optional[AddressSchema] = None
    selected_order: str  # 결제 수단 (예: "신용카드")
    items: List[OrderItemInput]
