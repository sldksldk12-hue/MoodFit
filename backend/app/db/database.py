import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# .env에서 데이터베이스 URL 가져오기
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# 엔진 생성 (MySQL 연동)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

@event.listens_for(engine, "connect")
def set_sort_buffer(dbapi_connection, connection_record):
    """리뷰/상품 데이터 정렬 시 MySQL 정렬 버퍼 메모리 부족 (1038 Out of sort memory) 예방"""
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("SET SESSION sort_buffer_size = 2 * 1024 * 1024;")
        cursor.close()
    except Exception:
        pass

# 데이터베이스 세션(작업 단위)을 생성하는 공장(Factory)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# API 요청이 올 때마다 세션을 열고 닫아주는 의존성(Dependency) 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()