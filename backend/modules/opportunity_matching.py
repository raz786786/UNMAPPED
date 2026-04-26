from typing import List, Dict
import os
import json

class OpportunityMatching:
    def __init__(self, config):
        self.config = config

    def get_econometric_signals(self, profile: Dict, country_iso: str) -> Dict:
        """
        Uses Gemini AI to generate realistic market signals based on 
        the worker's actual skills and occupation matches.
        """
        skills = [s['label'] for s in profile.get('skills', [])]
        top_occ = profile.get('top_occupations', [{}])[0].get('title', 'General')
        location = profile.get('location', 'Unknown')

        prompt = f"""For a worker with these skills: {', '.join(skills)}
In occupation: {top_occ}
Located in: {location}

Generate 3 realistic labor market signals as a JSON object with these keys:
- "sector_growth": a string like "+X.X% annual growth in [relevant sector] (ILOSTAT)"
- "wage_premium": a string like "[Education type] earns +XX% vs no credential (World Bank)"  
- "youth_unemployment": a string like "XX.X% in [relevant region] (ILO)"

Make the values specific and realistic for the worker's actual field and location.
Only return the JSON object, no other text."""

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
            return json.loads(text)
        except Exception as e:
            print(f"Market signals error: {e}")
            return {
                "sector_growth": f"+5% growth in {top_occ} sector (estimated)",
                "wage_premium": "Skilled workers earn +25% vs unskilled (estimated)",
                "youth_unemployment": "Regional unemployment data pending"
            }

    def get_opportunities(self, profile: Dict) -> List[Dict]:
        """
        Uses Gemini AI to generate personalized opportunities
        based on the worker's actual skills and occupations.
        """
        skills = [s['label'] for s in profile.get('skills', [])]
        top_occ = profile.get('top_occupations', [{}])[0].get('title', 'General Worker')
        location = profile.get('location', 'Unknown')
        currency = self.config.currency

        prompt = f"""For a worker with skills: {', '.join(skills)}
Top occupation match: {top_occ}
Location: {location}
Local currency: {currency}

Generate exactly 3 job/opportunity matches as a JSON array. Each object must have:
- "id": integer (1, 2, 3)
- "title": specific job title relevant to their skills
- "type": one of "Self-employment", "Formal employment", "Gig", "Training pathway"
- "match_score": float 0.5-0.95 (how well it matches their skills)
- "description": one sentence about the opportunity
- "wage_estimate": realistic salary range in {currency}

Make opportunities specific to their actual skills, not generic.
Order by match_score descending. Only return the JSON array."""

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
            opportunities = json.loads(text)
            # Validate
            for opp in opportunities:
                opp['id'] = int(opp.get('id', 0))
                opp['title'] = str(opp.get('title', 'Opportunity'))
                opp['type'] = str(opp.get('type', 'Employment'))
                opp['match_score'] = float(opp.get('match_score', 0.6))
                opp['description'] = str(opp.get('description', ''))
                opp['wage_estimate'] = str(opp.get('wage_estimate', f'{currency} N/A'))
            return opportunities[:3]
        except Exception as e:
            print(f"Opportunity matching error: {e}")
            return [
                {
                    "id": 1,
                    "title": f"{top_occ}",
                    "type": "Formal employment",
                    "match_score": 0.70,
                    "description": f"Position matching your {skills[0] if skills else 'general'} skills.",
                    "wage_estimate": f"{currency} {self.config.min_wage_usd}-{self.config.median_wage_usd}/mo"
                }
            ]

    def match(self, profile: Dict, country_iso: str) -> Dict:
        signals = self.get_econometric_signals(profile, country_iso)
        opps = self.get_opportunities(profile)
        
        return {
            "market_signals": signals,
            "opportunities": opps
        }
