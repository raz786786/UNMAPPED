# UNMAPPED — Global Talent & Skills Infrastructure

UNMAPPED is a high-performance, AI-driven skills infrastructure designed to empower workers in emerging economies. It transforms unstructured work history into a portable, verified skills profile, assesses automation risk, and matches users with global market opportunities.

## 🚀 Core Modules

### 1. Skills Signal Engine (SSE)
- **What it does**: Uses Gemini AI and the ESCO (European Skills, Competences, Qualifications and Occupations) taxonomy to extract structured skills from natural language.
- **Key Feature**: Anchors raw text to standard industry identifiers for maximum portability.

### 2. AI Readiness Lens (ARI)
- **What it does**: Evaluates the durability of a worker's skill set against automation trends (specifically calibrated for LMIC - Low and Middle-Income Country contexts).
- **Key Feature**: Provides a "Trend 2035" risk score and identifies "durable" vs. "vulnerable" skills.

### 3. Opportunity Matching (OMD)
- **What it does**: Integrates econometric data from ILOSTAT and the World Bank to identify reachable market signals and job opportunities.
- **Key Feature**: Calculates "Match Scores" based on current skills and local wage estimates.

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, TypeScript, Framer Motion, Lucide Icons.
- **Backend**: FastAPI (Python), Pydantic, Gemini AI (Google), Pandas.
- **Database**: Supabase (PostgreSQL) for persistence and authentication.

## ⚙️ Configuration & Setup

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- A Supabase Project
- A Google Gemini API Key

### 1. Environment Configuration
Create a `.env` file in both the `frontend/` and `backend/` directories.

**frontend/.env**:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**backend/.env**:
```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash-latest
```

### 2. Running Locally

#### Backend
```bash
cd backend
pip install -r ../requirements.txt
python main.py
```
The API will run on `http://127.0.0.1:8000`.

#### Frontend
```bash
cd frontend
npm install
npm run dev
```
The application will be available at `http://127.0.0.1:4200` (pre-configured with a proxy to the backend).

## 🔒 Security
- **Strict Gitignore**: All `.env` files and sensitive credentials are excluded from the repository.
- **Structured Settings**: Backend configuration is managed through a typed `Settings` class to ensure data integrity.
- **Row Level Security**: Database access is protected via Supabase RLS policies.
