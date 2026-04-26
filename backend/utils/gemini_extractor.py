import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

class GeminiExtractor:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)

    def extract_skills(self, user_text: str) -> list:
        prompt = f"""
        Extract professional skills and occupations from the following text based on the ESCO taxonomy.
        Text: "{user_text}"
        
        Return the result as a JSON array of objects with 'label', 'type' (skill or occupation), and 'confidence'.
        Example: [{{"label": "mobile phone repair", "type": "skill", "confidence": 0.95}}]
        Only return the JSON.
        """
        try:
            response = self.model.generate_content(prompt)
            # Basic cleanup of markdown JSON blocks if present
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:-3].strip()
            return json.loads(text)
        except Exception as e:
            print(f"Gemini Extraction Error: {e}")
            return []
