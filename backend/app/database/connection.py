from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import settings

engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Safe schema update for password_reset_requested column
try:
    from sqlalchemy import text
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN password_reset_requested BOOLEAN DEFAULT 0"))
except Exception:
    # Pass if column already exists or tables don't exist yet
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
