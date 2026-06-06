from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import engine, Base, get_db
from models import JobDescriptionModel, ResumeModel, RankingResultModel
from resume_parser import ResumeParser
from matcher import SemanticMatcher

app = FastAPI(
    title="Enterprise AI Resume Ranker API",
    version="1.0.0",
    description="Asynchronous Machine Learning API engine utilizing vectorized sentence embeddings for structural resume analysis."
)

# Redirect root URL to Swagger Docs
@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

parser = ResumeParser()
matcher = SemanticMatcher()

@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.post("/jobs", status_code=status.HTTP_201_CREATED)
async def create_job(
    title: str,
    description: str,
    db: AsyncSession = Depends(get_db)
):
    if not title.strip() or not description.strip():
        raise HTTPException(
            status_code=400,
            detail="Title and description values cannot be empty strings."
        )

    new_job = JobDescriptionModel(
        title=title,
        description_text=description
    )

    db.add(new_job)
    await db.flush()

    return {
        "message": "Job description recorded successfully",
        "job_id": new_job.id
    }

@app.post("/resumes/upload", status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Only PDFs are accepted."
        )

    file_bytes = await file.read()

    try:
        parsed_data = parser.parse_resume(file_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to parse resume: {str(e)}"
        )

    if not parsed_data or parsed_data.get("raw_text_length", 0) < 40:
        raise HTTPException(
            status_code=400,
            detail="PDF contains no readable text."
        )

    new_resume = ResumeModel(
        filename=file.filename,
        candidate_name=parsed_data.get("name"),
        email=parsed_data.get("contact", {}).get("email"),
        extracted_text=parsed_data.get("raw_text", ""),
        skills=",".join(parsed_data.get("skills", []))
    )

    db.add(new_resume)
    await db.flush()

    return {
        "message": "Resume uploaded successfully",
        "resume_id": new_resume.id,
        "candidate_detected": new_resume.candidate_name,
        "skills_found": parsed_data.get("skills", [])
    }

@app.post("/jobs/{job_id}/rank")
async def rank_resumes(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    job_query = await db.execute(
        select(JobDescriptionModel).where(
            JobDescriptionModel.id == job_id
        )
    )
    job = job_query.scalar_one_or_none()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    resumes_query = await db.execute(select(ResumeModel))
    all_resumes = resumes_query.scalars().all()

    if not all_resumes:
        raise HTTPException(
            status_code=404,
            detail="No resumes found."
        )

    formatted_resumes = [
        {"id": r.id, "text": r.extracted_text}
        for r in all_resumes
    ]

    ranking_outputs = matcher.rank_candidates(
        formatted_resumes,
        job.description_text
    )

    response_payload = []

    for rank, item in enumerate(ranking_outputs, start=1):
        resume_record = next(
            r for r in all_resumes
            if r.id == item["candidate_id"]
        )

        db.add(
            RankingResultModel(
                job_id=job.id,
                resume_id=resume_record.id,
                match_percentage=item["match_percentage"]
            )
        )

        response_payload.append({
            "rank": rank,
            "resume_id": resume_record.id,
            "filename": resume_record.filename,
            "candidate_name": resume_record.candidate_name,
            "skills": resume_record.skills.split(",")
            if resume_record.skills else [],
            "match_percentage": item["match_percentage"]
        })

    return {
        "job_title": job.title,
        "total_evaluated": len(response_payload),
        "rankings": response_payload
    }