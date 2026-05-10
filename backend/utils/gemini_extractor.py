import google.generativeai as genai
import os
import json
from settings import settings

class GeminiExtractor:
    def __init__(self):
        api_key = settings.gemini_api_key
        model_name = settings.gemini_model
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
