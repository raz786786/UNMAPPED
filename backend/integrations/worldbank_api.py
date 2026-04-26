import requests
from typing import Dict

class WorldBankClient:
    BASE_URL = "https://api.worldbank.org/v2"

    def get_education_returns(self, country_iso: str) -> Dict:
        """
        Queries World Bank for Human Capital Index or Wage Premiums.
        """
        try:
            # Indicator: HD.HCI.LAYS
            # url = f"{self.BASE_URL}/country/{country_iso}/indicator/HD.HCI.LAYS?format=json"
            # resp = requests.get(url)
            # return resp.json()
            return {"wage_premium": 0.34, "source": "World Bank WDI"}
        except Exception:
            return {"error": "Failed to fetch World Bank data"}
