# app/schemas/address_schema.py
from pydantic import BaseModel
from typing import Optional

class AddressCreate(BaseModel):
    user_id: int
    receiver_name: str
    call_number: str
    user_address: str
    zip_code: str
    address_detail: str
    delivery_request: Optional[str] = None
    is_default: Optional[bool] = False

class AddressUpdate(BaseModel):
    receiver_name: Optional[str] = None
    call_number: Optional[str] = None
    user_address: Optional[str] = None
    zip_code: Optional[str] = None
    address_detail: Optional[str] = None
    delivery_request: Optional[str] = None
    is_default: Optional[bool] = None

class AddressResponse(BaseModel):
    id: int
    user_id: int
    receiver_name: str
    call_number: str
    user_address: str
    zip_code: str
    address_detail: str
    delivery_request: Optional[str] = None
    is_default: int
    
    class Config:
        from_attributes = True
