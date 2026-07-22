# app/api/address.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import User, UserAddress

router = APIRouter(prefix="/api/addresses", tags=["Address"])

# Pydantic Schemas
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


# Helper Functions
def _unset_user_default_addresses(db: Session, user_id: int):
    """해당 유저의 모든 기존 배송지 기본 설정을 해제합니다."""
    db.query(UserAddress).filter(UserAddress.user_id == user_id).update({"is_default": 0})
    db.flush()


@router.get("/user/{user_id}", response_model=List[AddressResponse], summary="유저의 배송지 목록 조회")
def get_user_addresses(user_id: int, db: Session = Depends(get_db)):
    """
    특정 유저의 등록된 배송지 목록을 조회합니다.
    기본 배송지(is_default=1)가 최상단에 배치됩니다.
    """
    # 유저 존재 여부 확인
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="존재하지 않는 회원입니다.")
        
    addresses = db.query(UserAddress).filter(
        UserAddress.user_id == user_id
    ).order_by(UserAddress.is_default.desc(), UserAddress.id.desc()).all()
    
    return addresses


@router.post("/", response_model=AddressResponse, status_code=status.HTTP_201_CREATED, summary="배송지 추가")
def create_address(req: AddressCreate, db: Session = Depends(get_db)):
    """
    새로운 배송지를 추가합니다.
    is_default가 True이거나 유저의 첫 배송지인 경우 기본 배송지로 자동 설정됩니다.
    """
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="존재하지 않는 회원입니다.")

    # 기존 등록된 배송지 유무 확인
    existing_count = db.query(UserAddress).filter(UserAddress.user_id == req.user_id).count()
    
    # 첫 배송지이거나 is_default가 True로 들어온 경우 기본 배송지로 설정
    should_be_default = req.is_default or (existing_count == 0)
    
    try:
        if should_be_default:
            _unset_user_default_addresses(db, req.user_id)
            
        new_address = UserAddress(
            user_id=req.user_id,
            receiver_name=req.receiver_name.strip(),
            call_number=req.call_number.strip(),
            user_address=req.user_address.strip(),
            zip_code=req.zip_code.strip(),
            address_detail=req.address_detail.strip(),
            delivery_request=req.delivery_request.strip() if req.delivery_request else None,
            is_default=1 if should_be_default else 0
        )
        
        db.add(new_address)
        db.commit()
        db.refresh(new_address)
        return new_address
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"배송지 등록 중 오류 발생: {str(e)}")


@router.put("/{address_id}", response_model=AddressResponse, summary="배송지 수정")
def update_address(address_id: int, req: AddressUpdate, db: Session = Depends(get_db)):
    """
    특정 배송지의 정보 및 기본 배송지 여부를 수정합니다.
    """
    address = db.query(UserAddress).filter(UserAddress.id == address_id).first()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="존재하지 않는 배송지입니다.")
        
    update_data = req.dict(exclude_unset=True)
    
    try:
        # 기본 배송지로 새로 지정하는 경우 기존 배송지들의 기본 배송지 해제
        if update_data.get("is_default") is True:
            _unset_user_default_addresses(db, address.user_id)
            update_data["is_default"] = 1
        elif update_data.get("is_default") is False:
            update_data["is_default"] = 0
            
        for key, value in update_data.items():
            if isinstance(value, str):
                value = value.strip()
            setattr(address, key, value)
            
        db.commit()
        db.refresh(address)
        return address
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"배송지 수정 중 오류 발생: {str(e)}")


@router.delete("/{address_id}", summary="배송지 삭제")
def delete_address(address_id: int, db: Session = Depends(get_db)):
    """
    특정 배송지를 삭제합니다.
    """
    address = db.query(UserAddress).filter(UserAddress.id == address_id).first()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="존재하지 않는 배송지입니다.")
        
    try:
        user_id = address.user_id
        was_default = (address.is_default == 1)
        
        db.delete(address)
        db.commit()
        
        # 만약 기본 배송지가 삭제되었고 남은 배송지가 있다면 가장 최신 배송지를 기본 배송지로 자동 승격
        if was_default:
            remaining_address = db.query(UserAddress).filter(UserAddress.user_id == user_id).order_by(UserAddress.id.desc()).first()
            if remaining_address:
                remaining_address.is_default = 1
                db.commit()
                
        return {"status": "success", "message": "배송지가 성공적으로 삭제되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"배송지 삭제 중 오류 발생: {str(e)}")
