from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
from config_loader import load_config
from modules.skills_signal_engine import SkillsSignalEngine
from modules.ai_readiness_lens import AIReadinessLens
from modules.opportunity_matching import OpportunityMatching

app = FastAPI(title="UNMAPPED API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserInput(BaseModel):
    name: str
    location: str
    education_level: str
    work_history: str
    country_config: str = "ghana_urban"

@app.get("/")
def read_root():
    return {"message": "UNMAPPED API is running"}

@app.post("/analyze")
def analyze_skills(user_input: UserInput):
    try:
        # 1. Load Config
        config = load_config(user_input.country_config)
        
        # 2. Initialize Modules
        sse = SkillsSignalEngine(config.module_sse)
        ari = AIReadinessLens(config.module_ari)
        omd = OpportunityMatching(config.module_omd)
        
        # 3. Process Modules
        profile = sse.generate_profile(user_input.dict(), config.country_iso)
        risk_assessment = ari.assess_risk(profile, config.country_iso, config.module_omd.min_wage_usd)
        opportunities = omd.match(profile, config.country_iso)
        
        return {
            "country": config.country_name,
            "profile": profile,
            "risk_assessment": risk_assessment,
            "opportunity_matching": opportunities
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
