"""
Database Models — SQLAlchemy ORM untuk NusantaraExport.AI
Tabel: marketplace_products, marketplace_buyers
"""
from sqlalchemy import (
    Column, String, Text, Float, Integer, Boolean, DateTime,
    JSON, Enum, func, create_engine
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import declarative_base
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

Base = declarative_base()


class MarketplaceProduct(Base):
    __tablename__ = "marketplace_products"

    id            = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(PG_UUID(as_uuid=True), nullable=True)
    name          = Column(String(255), nullable=False)
    hs_code       = Column(String(20), nullable=True)
    category      = Column(String(100), nullable=False)
    description   = Column(Text, nullable=True)
    price_usd     = Column(Float, nullable=False)
    price_idr     = Column(Float, nullable=True)
    min_order_qty = Column(String(50), nullable=True)
    images        = Column(JSON, nullable=True, default=list)
    badges        = Column(JSON, nullable=True, default=list)
    location      = Column(String(255), nullable=True)
    lead_time     = Column(String(100), nullable=True)
    packaging     = Column(String(255), nullable=True)
    status        = Column(String(20), default="active", nullable=False)
    seller_name   = Column(String(255), nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class MarketplaceBuyer(Base):
    __tablename__ = "marketplace_buyers"

    id                  = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id             = Column(PG_UUID(as_uuid=True), nullable=True)
    company_name        = Column(String(255), nullable=False)
    country             = Column(String(100), nullable=False)
    contact_email       = Column(String(255), nullable=True)
    target_categories   = Column(JSON, nullable=True, default=list)
    interested_hs_codes = Column(JSON, nullable=True, default=list)
    annual_volume_usd   = Column(Float, nullable=True)
    is_verified         = Column(Boolean, default=False, nullable=False)
    notes               = Column(Text, nullable=True)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())


def get_engine():
    db_url = os.getenv("AUTH_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("AUTH_DATABASE_URL or DATABASE_URL not set")
    return create_engine(db_url)


def create_all_tables():
    """Run once to create marketplace tables in Supabase."""
    engine = get_engine()
    Base.metadata.create_all(engine, checkfirst=True)
    print("✅ marketplace_products & marketplace_buyers tables created.")
