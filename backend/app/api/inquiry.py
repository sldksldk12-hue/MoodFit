# app/api/inquiry.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import Inquiry, Product
from app.schemas.inquiry_schema import InquiryCreate, InquiryResponse

router = APIRouter(prefix="/api/inquiries", tags=["Inquiry"])

@router.post("/", response_model=InquiryResponse)
def create_inquiry(req: InquiryCreate, db: Session = Depends(get_db)):
    """
    특정 상품에 대한 새로운 문의글(Q&A)을 등록합니다.
    """
    # 대상 상품이 실제로 존재하는지 검증
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="문의를 남길 상품을 찾을 수 없습니다.")

    try:
        # 문의글 생성 및 저장 (inq_status는 DB 기본값인 '답변대기' 적용)
        new_inquiry = Inquiry(
            user_id=req.user_id,
            product_id=req.product_id,
            title=req.title,
            content=req.content,
            inq_status="답변대기"
        )
        db.add(new_inquiry)
        db.commit()
        db.refresh(new_inquiry)
        
        return new_inquiry
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"문의 등록 중 오류가 발생했습니다: {str(e)}")

@router.get("/product/{product_id}", response_model=List[InquiryResponse])
def get_product_inquiries(product_id: int, db: Session = Depends(get_db)):
    """
    특정 상품에 등록된 모든 문의 내역을 최신순으로 조회합니다.
    """
    try:
        inquiries = db.query(Inquiry)\
            .filter(Inquiry.product_id == product_id)\
            .order_by(Inquiry.created_at.desc())\
            .all()
            
        return inquiries
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"문의 내역 조회 중 오류가 발생했습니다: {str(e)}")


@router.get("/user/{user_id}")
def get_user_inquiries(user_id: int, db: Session = Depends(get_db)):
    """
    특정 회원이 작성한 모든 문의 내역을 최신순으로 조회합니다.
    """
    try:
        inquiries = db.query(Inquiry).filter(Inquiry.user_id == user_id).order_by(Inquiry.created_at.desc()).all()
        result = []
        for inq in inquiries:
            prod_name = "상품 정보 없음"
            if inq.product_id:
                product = db.query(Product).filter(Product.id == inq.product_id).first()
                if product:
                    prod_name = product.product_name

            result.append({
                "id": inq.id,
                "productId": inq.product_id,
                "productName": prod_name,
                "title": inq.title,
                "content": inq.content,
                "status": inq.inq_status or "답변대기",
                "replyContent": inq.reply_content,
                "createdAt": inq.created_at.strftime("%Y.%m.%d") if inq.created_at else ""
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"회원 문의 내역 조회 중 오류가 발생했습니다: {str(e)}")