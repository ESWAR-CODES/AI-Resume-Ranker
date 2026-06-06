from fastapi import FastAPI

app = FastAPI(title="AI Resume Ranker API")

@app.get("/")
def read_root():
    return {"message": "Hello World: AI Resume Ranker Backend is running!"}