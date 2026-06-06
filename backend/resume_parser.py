import fitz  # PyMuPDF
import spacy
from spacy.matcher import PhraseMatcher
import re
from typing import Dict, Any, Optional

class ResumeParser:
    def __init__(self):
        # Load the English NLP model
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            raise RuntimeError("spaCy model not found. Run: python -m spacy download en_core_web_sm")
        
        # Initialize PhraseMatcher for skills extraction
        self.matcher = PhraseMatcher(self.nlp.vocab, attr="LOWER")
        self._initialize_skill_matcher()

    def _initialize_skill_matcher(self):
        """Loads a predefined list of skills into the spaCy matcher."""
        # In a production app, this list would come from a database.
        core_skills = [
            "Python", "JavaScript", "React", "Node.js", "Machine Learning",
            "FastAPI", "NLP", "SQL", "Docker", "AWS", "Git", "Pandas",
            "Data Analysis", "C++", "Java", "TypeScript", "Tailwind"
        ]
        skill_patterns = [self.nlp.make_doc(text) for text in core_skills]
        self.matcher.add("SKILLS", skill_patterns)

    def extract_text_from_pdf(self, pdf_path: str) -> Optional[str]:
        """Extracts and cleans raw text from a PDF."""
        try:
            doc = fitz.open(pdf_path)
            text = " ".join([page.get_text() for page in doc])
            # Clean text: remove extra whitespaces and newlines
            clean_text = re.sub(r'\s+', ' ', text).strip()
            return clean_text
        except Exception as e:
            print(f"Error extracting PDF: {e}")
            return None

    def extract_contact_info(self, text: str) -> Dict[str, Optional[str]]:
        """Uses Regex to find emails and phone numbers."""
        email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
        phone_pattern = r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        
        email = re.search(email_pattern, text)
        phone = re.search(phone_pattern, text)
        
        return {
            "email": email.group() if email else None,
            "phone": phone.group() if phone else None
        }

    def extract_entities(self, text: str) -> Dict[str, Any]:
        """Uses spaCy to extract skills and names."""
        doc = self.nlp(text)
        
        # Extract Skills using the Matcher
        matches = self.matcher(doc)
        skills = set()
        for match_id, start, end in matches:
            span = doc[start:end]
            skills.add(span.text)
            
        # Extract potential names (PERSON entities)
        names = [ent.text for ent in doc.ents if ent.label_ == "PERSON"]
        
        return {
            "predicted_name": names[0] if names else None,
            "skills": list(skills)
        }

    def parse(self, pdf_path: str) -> Dict[str, Any]:
        """Main pipeline to parse a resume."""
        text = self.extract_text_from_pdf(pdf_path)
        if not text:
            return {"error": "Could not extract text from document."}
            
        contact_info = self.extract_contact_info(text)
        nlp_entities = self.extract_entities(text)
        
        return {
            "contact": contact_info,
            "name": nlp_entities["predicted_name"],
            "skills": nlp_entities["skills"],
            "raw_text_length": len(text)
        }