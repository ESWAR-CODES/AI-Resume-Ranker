# 1. Use an official, lightweight Python 3.11 environment
FROM python:3.11-slim

# 2. Set the working directory inside the cloud container
WORKDIR /app

# 3. Install low-level system dependencies required by ML libraries
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 4. Copy your dependencies file first (optimizes cloud build times)
COPY requirements.txt .

# 5. Install all Python packages (FastAPI, PyMuPDF, SentenceTransformers)
RUN pip install --no-cache-dir -r requirements.txt

# 6. Explicitly download the spaCy NLP model
RUN python -m spacy download en_core_web_sm

# 7. Copy the rest of your backend code into the container
COPY . .

# 8. Expose port 8000 for the cloud router
EXPOSE 8000

# 9. Start the Uvicorn production server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]