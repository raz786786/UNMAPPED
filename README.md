# UNMAPPED — Deep Research Implementation

UNMAPPED is a composable, config-driven skills infrastructure layer.

## Project Structure
- `/backend`: FastAPI service.
- `/frontend`: React + Vite application.
- `/configs`: YAML configuration files for different regions.
- `/data`: Local data caches for ESCO, automation indices, and projections.

## How to Run

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features
- **Module 01: Skills Signal Engine**: ESCO-anchored skills extraction and profiling.
- **Module 02: AI Readiness Lens**: LMIC-calibrated automation risk assessment.
- **Module 03: Opportunity Matching**: Econometric signals (ILOSTAT/World Bank) mapped to reachable opportunities.
- **Modern UI**: Dark/Light mode support with glassmorphism design.
