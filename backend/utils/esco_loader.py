import pandas as pd
import os
from typing import List, Dict

class ESCODataLoader:
    def __init__(self, data_path: str = "data/esco"):
        self.data_path = data_path
        self.skills_df = None
        self.occupations_df = None
        self._load_data()

    def _load_data(self):
        # Fix path to be relative to this file
        base_path = os.path.dirname(os.path.abspath(__file__))
        self.data_path = os.path.join(base_path, "..", "..", "data", "esco")
        
        skills_file = os.path.join(self.data_path, "skills_en.csv")
        occupations_file = os.path.join(self.data_path, "occupations_en.csv")
        relations_file = os.path.join(self.data_path, "occupationSkillRelations_en.csv")
        
        if os.path.exists(skills_file):
            self.skills_df = pd.read_csv(skills_file)
        if os.path.exists(occupations_file):
            self.occupations_df = pd.read_csv(occupations_file)
        if os.path.exists(relations_file):
            self.relations_df = pd.read_csv(relations_file)

    def search_skills(self, query: str, limit: int = 5) -> List[Dict]:
        if self.skills_df is None:
            return []
        
        # Simple fuzzy search on the 'preferredLabel' column
        results = self.skills_df[self.skills_df['preferredLabel'].str.contains(query, case=False, na=False)]
        return results.head(limit).to_dict('records')

    def get_occupations_for_skills(self, skill_uris: List[str]) -> List[Dict]:
        # This would normally use a relation file (e.g. skillGroups.csv or occupationSkillRelations.csv)
        return []
