from matcher import SemanticMatcher

if __name__ == "__main__":
    matcher = SemanticMatcher()
    
    jd = "Looking for a backend engineer with strong Python, FastAPI, and Machine Learning skills. Experience with AWS and Docker is a plus."
    
    resumes = [
        {"id": "Candidate_A", "text": "Experienced Python developer with 5 years in FastAPI, Machine Learning, and AWS deployments."},
        {"id": "Candidate_B", "text": "Frontend developer skilled in React, Tailwind CSS, and JavaScript. Builds great UIs."},
        {"id": "Candidate_C", "text": "Data Scientist proficient in Python, Machine Learning, pandas, and scikit-learn. Familiar with AWS."},
        {"id": "Candidate_D", "text": "DevOps engineer with expertise in Docker, Kubernetes, CI/CD, and AWS infrastructure."},
        {"id": "Candidate_E", "text": "Full-stack engineer using Node.js, Express, React, and MongoDB."}
    ]
    
    results = matcher.rank_candidates(resumes, jd)
    
    for rank, res in enumerate(results, 1):
        print(f"Rank {rank}: {res['candidate_id']} - {res['match_percentage']}% Match")