import pandas as pd
import os
from typing import Dict

class AIReadinessLens:
    def __init__(self, config):
        self.config = config

    def get_base_automation_risk(self, isco_code: str) -> Dict:
        """
        Loads automation probability from data/automation/frey_osborne_isco_crosswalk.csv
        Falls back to AI-estimated risk if the ISCO code isn't in the CSV.
        """
        try:
            base_path = os.path.dirname(os.path.abspath(__file__))
            csv_path = os.path.join(base_path, "..", "..", "data", "automation", "frey_osborne_isco_crosswalk.csv")
            df = pd.read_csv(csv_path)
            df['isco_code'] = df['isco_code'].astype(str)
            row = df[df["isco_code"] == str(isco_code)]
            if not row.empty:
                r = row.iloc[0]
                return {
                    "fo_probability": float(r["fo_automation_probability"]),
                    "routine_manual": float(r["routine_manual_index"]),
                    "routine_cognitive": float(r["routine_cognitive_index"]),
                    "non_routine": float(r["non_routine_index"])
                }
        except Exception as e:
            print(f"Error loading automation data: {e}")
        
        # AI-based estimation for unknown ISCO codes
        return self._estimate_risk_for_isco(isco_code)

    def _estimate_risk_for_isco(self, isco_code: str) -> Dict:
        """Estimate automation risk based on ISCO major group patterns."""
        major_group = isco_code[0] if isco_code else '9'
        
        # Based on Frey & Osborne research patterns by ISCO major group
        risk_by_group = {
            '1': {"fo_probability": 0.15, "routine_manual": 0.10, "routine_cognitive": 0.30, "non_routine": 0.80},  # Managers
            '2': {"fo_probability": 0.20, "routine_manual": 0.08, "routine_cognitive": 0.25, "non_routine": 0.85},  # Professionals
            '3': {"fo_probability": 0.35, "routine_manual": 0.20, "routine_cognitive": 0.50, "non_routine": 0.60},  # Technicians
            '4': {"fo_probability": 0.75, "routine_manual": 0.30, "routine_cognitive": 0.80, "non_routine": 0.20},  # Clerks
            '5': {"fo_probability": 0.45, "routine_manual": 0.50, "routine_cognitive": 0.40, "non_routine": 0.45},  # Service & Sales
            '6': {"fo_probability": 0.55, "routine_manual": 0.75, "routine_cognitive": 0.20, "non_routine": 0.35},  # Agriculture
            '7': {"fo_probability": 0.55, "routine_manual": 0.70, "routine_cognitive": 0.35, "non_routine": 0.40},  # Craft & Trades
            '8': {"fo_probability": 0.70, "routine_manual": 0.85, "routine_cognitive": 0.30, "non_routine": 0.15},  # Machine Operators
            '9': {"fo_probability": 0.80, "routine_manual": 0.90, "routine_cognitive": 0.20, "non_routine": 0.10},  # Elementary
            '0': {"fo_probability": 0.10, "routine_manual": 0.15, "routine_cognitive": 0.20, "non_routine": 0.90},  # Armed Forces
        }
        
        return risk_by_group.get(major_group, {
            "fo_probability": 0.50,
            "routine_manual": 0.50,
            "routine_cognitive": 0.50,
            "non_routine": 0.50
        })

    def calibrate_for_lmic(
        self,
        base_risk: Dict,
        itu_digital_index: float = 0.4,
        wage_floor_usd: float = 82.0,
        us_wage_floor_usd: float = 7.25 * 160
    ) -> float:
        """
        LMIC Calibration Model:
        Effective risk = FO_risk * (local_wage / US_wage)^alpha * digital_readiness^beta
        """
        alpha = self.config.wage_automation_elasticity
        beta = self.config.digital_readiness_weight
        
        wage_ratio = min(wage_floor_usd / us_wage_floor_usd, 1.0)
        digital_modifier = itu_digital_index ** beta
        wage_modifier = wage_ratio ** alpha
        
        lmic_risk = base_risk["fo_probability"] * wage_modifier * digital_modifier
        
        return round(lmic_risk, 3)

    def classify_skill_durability(self, skill_data: Dict) -> str:
        """Classify skill durability based on skill characteristics."""
        label = skill_data.get("label", "").lower()
        
        # High durability: interpersonal, creative, critical thinking
        durable_keywords = [
            "manage", "lead", "teach", "counsel", "negotiate", "design", 
            "create", "analyze", "research", "communicate", "plan", "care",
            "repair", "maintain", "troubleshoot", "diagnose", "service",
            "supervise", "train", "mentor", "coordinate"
        ]
        
        # Medium risk: technical but adaptable
        medium_keywords = [
            "operate", "install", "configure", "develop", "program",
            "build", "construct", "fabricate", "test"
        ]
        
        # High risk: routine, easily automated
        high_risk_keywords = [
            "data entry", "filing", "sorting", "assembly", "packing",
            "loading", "cleaning", "stacking", "copying"
        ]
        
        for keyword in durable_keywords:
            if keyword in label:
                return "DURABLE"
        
        for keyword in high_risk_keywords:
            if keyword in label:
                return "HIGH_RISK"
        
        for keyword in medium_keywords:
            if keyword in label:
                return "MEDIUM_RISK"
        
        # Default: check confidence score
        score = skill_data.get("score", 0.5)
        if score > 0.8:
            return "DURABLE"
        elif score > 0.5:
            return "MEDIUM_RISK"
        else:
            return "HIGH_RISK"

    def assess_risk(self, profile: Dict, country_iso: str, min_wage_usd: float) -> Dict:
        top_occ = profile["top_occupations"][0] if profile.get("top_occupations") else {"title": "Unknown", "isco_code": "9999"}
        base_risk = self.get_base_automation_risk(top_occ["isco_code"])
        
        # Digital index varies by region
        digital_indices = {
            "GHA": 0.38, "BGD": 0.31, "NGA": 0.33, "KEN": 0.44,
            "ZAF": 0.55, "IND": 0.40, "PAK": 0.28, "EGY": 0.47,
            "BRA": 0.56, "MEX": 0.52, "USA": 0.85, "GBR": 0.87,
            "DEU": 0.84, "CHN": 0.65, "JPN": 0.82, "AUS": 0.81,
        }
        itu_index = digital_indices.get(country_iso, 0.45)
        
        lmic_risk = self.calibrate_for_lmic(
            base_risk,
            itu_digital_index=itu_index,
            wage_floor_usd=min_wage_usd
        )
        
        # Classify each skill individually
        skill_durability = []
        for skill in profile.get("skills", []):
            skill_durability.append({
                "label": skill["label"],
                "category": self.classify_skill_durability(skill)
            })
            
        return {
            "occupation": top_occ["title"],
            "global_risk_score": base_risk["fo_probability"],
            "lmic_adjusted_risk": lmic_risk,
            "skill_durability": skill_durability,
            "trend_2035": f"{'Low' if lmic_risk < 0.3 else 'Moderate' if lmic_risk < 0.5 else 'High'} automation pressure for {top_occ['title']} (Wittgenstein SSP2 Projection)"
        }
