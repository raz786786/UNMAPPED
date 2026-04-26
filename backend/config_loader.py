import yaml
from pydantic import BaseModel
from typing import Dict, List, Optional
import os

class SSEConfig(BaseModel):
    ui_language: str
    education_taxonomy: str
    isced_map: Dict[str, int]
    esco_version: str
    voice_input: bool
    offline_mode: bool
    skill_confidence_threshold: float

class ARIConfig(BaseModel):
    automation_dataset: str
    itu_digital_index_source: str
    wage_floor_source: str
    wage_automation_elasticity: float
    digital_readiness_weight: float
    wittgenstein_scenario: str
    projection_year: int
    lmic_context: str

class OMDConfig(BaseModel):
    ilostat_indicators: List[str]
    world_bank_indicators: List[str]
    opportunity_types: List[str]
    employer_data_source: str
    currency: str
    min_wage_usd: float
    median_wage_usd: float
    mobility_constraint: str

class CountryConfig(BaseModel):
    country_name: str
    country_iso: str
    module_sse: SSEConfig
    module_ari: ARIConfig
    module_omd: OMDConfig

def load_config(config_name: str) -> CountryConfig:
    config_path = os.path.join(os.path.dirname(__file__), "..", "configs", f"{config_name}.yaml")
    # Fallback to global config if specific one doesn't exist
    if not os.path.exists(config_path):
        config_path = os.path.join(os.path.dirname(__file__), "..", "configs", "global.yaml")
    with open(config_path, 'r') as f:
        config_data = yaml.safe_load(f)
    return CountryConfig(**config_data)
