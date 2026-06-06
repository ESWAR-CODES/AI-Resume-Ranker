from resume_parser import ResumeParser
import json

if __name__ == "__main__":
    print("Initializing Advanced Resume Parser...")
    parser = ResumeParser()
    
    print("\nParsing sample_resume.pdf...")
    # Make sure 'sample_resume.pdf' exists in your backend folder!
    results = parser.parse("sample_resume.pdf")
    
    print("\n--- Extraction Results ---")
    print(json.dumps(results, indent=4))