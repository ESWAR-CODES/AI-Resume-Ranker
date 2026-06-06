from sqlalchemy import String, Text, Float, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
import uuid
from datetime import datetime

class JobDescriptionModel(Base):
    __tablename__ = "job_descriptions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    rankings = relationship("RankingResultModel", back_populates="job", cascade="all, delete-orphan")

class ResumeModel(Base):
    __tablename__ = "resumes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    candidate_name: Mapped[str] = mapped_column(String(255), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=True)
    extracted_text: Mapped[str] = mapped_column(Text, nullable=False)
    skills: Mapped[str] = mapped_column(Text, nullable=True)  # Comma-separated string values
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    rankings = relationship("RankingResultModel", back_populates="resume", cascade="all, delete-orphan")

class RankingResultModel(Base):
    __tablename__ = "ranking_results"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id: Mapped[str] = mapped_column(ForeignKey("job_descriptions.id"))
    resume_id: Mapped[str] = mapped_column(ForeignKey("resumes.id"))
    match_percentage: Mapped[float] = mapped_column(Float, nullable=False)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    job = relationship("JobDescriptionModel", back_populates="rankings")
    resume = relationship("ResumeModel", back_populates="rankings")