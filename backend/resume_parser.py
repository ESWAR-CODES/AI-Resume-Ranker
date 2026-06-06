import fitz
import spacy
import re

class ResumeParser:
    def __init__(self):
        # Load the NLP model once into memory for performance
        self.nlp = spacy.load("en_core_web_sm")

    def extract_text(self, file_input) -> str:
        # ADVANCED GUARDRAIL: Handle both local file paths and binary web streams
        if isinstance(file_input, bytes):
            # Read from memory (FastAPI upload)
            doc = fitz.open(stream=file_input, filetype="pdf")
        else:
            # Read from hard drive (Local testing)
            doc = fitz.open(file_input)
            
        text = ""
        for page in doc:
            text += page.get_text("text")
        return text

    def extract_contact_info(self, text: str) -> dict:
        email = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
        phone = re.search(r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
        return {
            "email": email.group(0) if email else None,
            "phone": phone.group(0) if phone else None
        }

    def extract_skills(self, text: str) -> list:
        # Base technical skills for the matrix to look for
        tech_skills = ["Python", "Java", "JavaScript", "React", "FastAPI", "SQL", "Docker", "Machine Learning", "AWS", "Node.js", "Data Visualization"]
        found_skills = [skill for skill in tech_skills if skill.lower() in text.lower()]
        return list(set(found_skills))

    def parse_resume(self, file_input) -> dict:
        raw_text = self.extract_text(file_input)
        
        # NLP Processing
        doc = self.nlp(raw_text)
        
        # Heuristic for name extraction (First PERSON entity found)
        name = "Unknown"
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                name = ent.text
                break
                
        return {
            "name": name,
            "contact": self.extract_contact_info(raw_text),
            "skills": self.extract_skills(raw_text),
            "raw_text": raw_text,
            "raw_text_length": len(raw_text)
        }