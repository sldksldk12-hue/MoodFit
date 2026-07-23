# app/api/auth.py
import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import User

# JWT 토큰 설정
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "moodfit-secret-key-super-secure-1234567890")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1일 (24시간)

router = APIRouter(tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/moodfit/login")

# 비밀번호 암호화 및 검증 유틸리티
def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False

# JWT 토큰 생성 및 해독 유틸리티
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

from app.schemas.auth_schema import UserRegister, PreferenceUpdate

# 회원가입 API
@router.post("/register")
async def register_user(req: UserRegister, db: Session = Depends(get_db)):
    # 1. 아이디 중복 체크
    existing_user = db.query(User).filter(User.user_account == req.user_name).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 존재하는 아이디입니다."
        )
    
    # 2. 이메일 중복 체크
    existing_email = db.query(User).filter(User.email == req.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용 중인 이메일입니다."
        )
    
    try:
        # 3. 비밀번호 해싱 및 새 회원 추가 (admin1 계정은 ADMIN 권한 부여)
        hashed_password = get_password_hash(req.password)
        assigned_role = "ADMIN" if req.user_name.strip().lower() == "admin1" else "USER"
        
        new_user = User(
            user_account=req.user_name,
            email=req.email,
            password_hash=hashed_password,
            admin_role=assigned_role
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {"status": "success", "message": "회원가입이 정상적으로 완료되었습니다.", "role": assigned_role}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회원 등록 중 오류가 발생했습니다: {str(e)}"
        )

# 로그인 API
@router.post("/login")
async def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. 사용자 계정 조회
    user = db.query(User).filter(User.user_account == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 올바르지 않습니다."
        )
    
    # 2. 비밀번호 검증
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 올바르지 않습니다."
        )
    
    # 3. JWT 토큰 발급
    access_token = create_access_token(data={"sub": user.user_account, "id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

# 내 정보 조회 API
@router.get("/me")
async def read_users_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # 1. 토큰 해독
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않거나 만료된 토큰입니다."
        )
    
    # 2. 사용자 ID로 DB에서 정보 획득
    user_id = payload.get("id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 회원 정보입니다."
        )
    
    # 3. 사용자 정보 반환
    return {
        "id": user.id,
        "user_account": user.user_account,
        "user_name": user.user_account,
        "email": user.email,
        "admin_role": user.admin_role,
        "gender": user.gender,
        "user_height": float(user.user_height) if user.user_height else None,
        "user_weight": float(user.user_weight) if user.user_weight else None,
        "body_form": user.body_form,
        "preferred_styles": user.preferred_styles,
        "liked_colors": user.liked_colors,
        "disliked_colors": user.disliked_colors
    }

# 취향 정보 수정 API
@router.put("/preference")
async def update_user_preference(req: PreferenceUpdate, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # 1. 토큰 해독
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않거나 만료된 토큰입니다."
        )
    
    # 2. 사용자 조회
    user_id = payload.get("id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 회원 정보입니다."
        )
    
    # 3. 정보 업데이트
    try:
        # 클라이언트가 명시적으로 전달한 필드만 추출 (null 값 포함)
        update_data = req.dict(exclude_unset=True)
        
        if "gender" in update_data:
            user.gender = update_data["gender"]
        if "height" in update_data:
            user.user_height = update_data["height"]
        if "weight" in update_data:
            user.user_weight = update_data["weight"]
        if "body_form" in update_data:
            user.body_form = update_data["body_form"]
        if "preferred_styles" in update_data:
            user.preferred_styles = update_data["preferred_styles"]
        if "liked_colors" in update_data:
            user.liked_colors = update_data["liked_colors"]
        if "disliked_colors" in update_data:
            user.disliked_colors = update_data["disliked_colors"]
            
        db.commit()
        return {"status": "success", "message": "취향 정보가 성공적으로 저장되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"취향 정보 저장 중 오류가 발생했습니다: {str(e)}"
        )
