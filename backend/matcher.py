from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import torch
import numpy as np
from typing import List, Dict, Any
from pydantic import BaseModel

class ResumeData(BaseModel):
    id: str
    text: str

class RankedCandidate(BaseModel):
    candidate_id: str
    match_percentage: float

class SemanticMatcher:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(SemanticMatcher, cls).__new__(cls)
        return cls._instance

    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        if not hasattr(self, 'model'):
            self.device = 'cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu'
            self.model = SentenceTransformer(model_name, device=self.device)

    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        return self.model.encode(texts, batch_size=32, show_progress_bar=False, convert_to_numpy=True)

    def calculate_similarity(self, resume_text: str, jd_text: str) -> float:
        if not resume_text or not jd_text:
            return 0.0

        embeddings = self.generate_embeddings([resume_text, jd_text])
        similarity = cosine_similarity(embeddings[0:1], embeddings[1:2])[0][0]
        return round(float(similarity) * 100, 2)

    def rank_candidates(self, resumes: List[Dict[str, Any]], jd_text: str) -> List[Dict[str, Any]]:
        if not jd_text or not resumes:
            return []

        valid_resumes = [ResumeData(**r) for r in resumes if r.get('text')]
        if not valid_resumes:
            return []

        texts_to_encode = [jd_text] + [r.text for r in valid_resumes]
        embeddings = self.generate_embeddings(texts_to_encode)

        jd_embedding = embeddings[0:1]
        resume_embeddings = embeddings[1:]

        similarities = cosine_similarity(resume_embeddings, jd_embedding).flatten()

        ranked_list = [
            RankedCandidate(candidate_id=res.id, match_percentage=round(float(score) * 100, 2)).model_dump()
            for res, score in zip(valid_resumes, similarities)
        ]

        return sorted(ranked_list, key=lambda x: x['match_percentage'], reverse=True)