import requests
from typing import List, Dict
import os
from utils.esco_loader import ESCODataLoader
from utils.gemini_extractor import GeminiExtractor

# ESCO API Base
ESCO_API_BASE = "https://ec.europa.eu/esco/api"

class SkillsSignalEngine:
    def __init__(self, config):
        self.config = config
        self.esco_version = config.esco_version
        self.loader = ESCODataLoader()
        self.ai_extractor = GeminiExtractor()

    def extract_skills(self, user_text: str, language: str = "en") -> List[Dict]:
        """
        Uses Gemini AI to extract skills from user's work history.
        """
        ai_results = self.ai_extractor.extract_skills(user_text)
        
        final_skills = []
        for res in ai_results:
            final_skills.append({
                "esco_uri": f"http://data.europa.eu/esco/{res.get('type','skill')}/{res.get('label','unknown').replace(' ', '-')}",
                "label": res.get('label', 'unknown'),
                "type": res.get('type', 'skill'),
                "score": res.get('confidence', 0.7),
                "human_label": res.get('label', 'unknown')
            })
            
        return final_skills or self._get_fallback_skills()

    def _get_fallback_skills(self):
        return [
            {
                "esco_uri": "http://data.europa.eu/esco/skill/general",
                "label": "general labor",
                "type": "skill",
                "score": 0.5,
                "human_label": "general labor"
            }
        ]

    def map_skills_to_occupations(self, skills: List[Dict], work_history: str) -> List[Dict]:
        """
        Uses Gemini AI to determine the best occupation matches
        based on extracted skills and work history.
        """
        skill_labels = [s['label'] for s in skills]
        prompt = f"""Based on these skills: {', '.join(skill_labels)}
And this work history: "{work_history}"

Return a JSON array of the top 3 most likely ISCO-08 occupation matches.
Each object must have: "title" (string), "isco_code" (string, 4-digit ISCO-08 code), "confidence" (float 0-1).
Order by confidence descending. Only return the JSON array, no other text."""

        try:
            import google.generativeai as genai
            from dotenv import load_dotenv
            load_dotenv()
            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash-latest"))
            response = model.generate_content(prompt)
            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            import json
            occupations = json.loads(text)
            # Validate structure
            for occ in occupations:
                occ['title'] = str(occ.get('title', 'Unknown'))
                occ['isco_code'] = str(occ.get('isco_code', '0000'))
                occ['confidence'] = float(occ.get('confidence', 0.5))
                occ['uri'] = f"http://data.europa.eu/esco/occupation/{occ['isco_code']}"
            return occupations[:3]
        except Exception as e:
            print(f"Occupation matching error: {e}")
            # Fallback: generate basic occupations from skill keywords
            return self._fallback_occupations(skill_labels)

    def _fallback_occupations(self, skill_labels: List[str]) -> List[Dict]:
        """Generate reasonable fallback occupations based on skill keywords."""
        keyword_map = {
            "repair": {"title": "Maintenance Technician", "isco_code": "7421", "confidence": 0.75},
            "teach": {"title": "Teaching Professional", "isco_code": "2300", "confidence": 0.75},
            "cook": {"title": "Cook", "isco_code": "5120", "confidence": 0.80},
            "drive": {"title": "Motor Vehicle Driver", "isco_code": "8322", "confidence": 0.80},
            "farm": {"title": "Agricultural Worker", "isco_code": "6111", "confidence": 0.78},
            "weld": {"title": "Welder", "isco_code": "7212", "confidence": 0.82},
            "sew": {"title": "Garment Worker", "isco_code": "7533", "confidence": 0.78},
            "code": {"title": "Software Developer", "isco_code": "2514", "confidence": 0.80},
            "sell": {"title": "Sales Worker", "isco_code": "5223", "confidence": 0.75},
            "nurse": {"title": "Nursing Professional", "isco_code": "2221", "confidence": 0.85},
            "build": {"title": "Building Construction Worker", "isco_code": "7111", "confidence": 0.76},
            "manage": {"title": "Business Manager", "isco_code": "1211", "confidence": 0.70},
        }
        
        matched = []
        all_labels = ' '.join(skill_labels).lower()
        for keyword, occ_data in keyword_map.items():
            if keyword in all_labels:
                matched.append({**occ_data, "uri": f"http://data.europa.eu/esco/occupation/{occ_data['isco_code']}"})
        
        if not matched:
            matched = [
                {"title": "General Service Worker", "isco_code": "9100", "confidence": 0.5, "uri": "http://data.europa.eu/esco/occupation/9100"}
            ]
        
        return matched[:3]

    def generate_profile(self, user_data: Dict, country_iso: str) -> Dict:
        work_history = user_data.get("work_history", "")
        skills = self.extract_skills(work_history, self.config.ui_language)
        occupations = self.map_skills_to_occupations(skills, work_history)
        
        profile = {
            "name": user_data.get("name", "User"),
            "location": user_data.get("location", "Unknown"),
            "education": {
                "level": user_data.get("education_level"),
                "isced": self.config.isced_map.get(user_data.get("education_level"), 0)
            },
            "skills": skills,
            "top_occupations": occupations,
            "profile_id": f"SSE-{country_iso}-2025-{os.urandom(2).hex()}"
        }
        return profile
