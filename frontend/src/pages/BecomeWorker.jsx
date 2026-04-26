import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, GraduationCap, Briefcase, ChevronRight, Loader2, Zap, CheckCircle, Globe2 } from 'lucide-react';
import { useApp } from '../App';
import axios from 'axios';

const API_BASE = "/api";

const COUNTRIES = [
  { label: "🌍 Worldwide (Global Default)", value: "global" },
  { label: "── Africa ──", value: "", disabled: true },
  { label: "🇩🇿 Algeria", value: "algeria" },
  { label: "🇦🇴 Angola", value: "angola" },
  { label: "🇧🇯 Benin", value: "benin" },
  { label: "🇧🇼 Botswana", value: "botswana" },
  { label: "🇧🇫 Burkina Faso", value: "burkina_faso" },
  { label: "🇧🇮 Burundi", value: "burundi" },
  { label: "🇨🇲 Cameroon", value: "cameroon" },
  { label: "🇨🇩 DR Congo", value: "dr_congo" },
  { label: "🇪🇬 Egypt", value: "egypt" },
  { label: "🇪🇹 Ethiopia", value: "ethiopia" },
  { label: "🇬🇭 Ghana (Urban)", value: "ghana_urban" },
  { label: "🇬🇭 Ghana (Rural)", value: "ghana_rural" },
  { label: "🇰🇪 Kenya", value: "kenya" },
  { label: "🇲🇦 Morocco", value: "morocco" },
  { label: "🇲🇿 Mozambique", value: "mozambique" },
  { label: "🇳🇬 Nigeria", value: "nigeria" },
  { label: "🇷🇼 Rwanda", value: "rwanda" },
  { label: "🇸🇳 Senegal", value: "senegal" },
  { label: "🇿🇦 South Africa", value: "south_africa" },
  { label: "🇹🇿 Tanzania", value: "tanzania" },
  { label: "🇺🇬 Uganda", value: "uganda" },
  { label: "🇿🇲 Zambia", value: "zambia" },
  { label: "🇿🇼 Zimbabwe", value: "zimbabwe" },
  { label: "── Asia ──", value: "", disabled: true },
  { label: "🇦🇫 Afghanistan", value: "afghanistan" },
  { label: "🇧🇩 Bangladesh (Rural)", value: "bangladesh_rural" },
  { label: "🇧🇩 Bangladesh (Urban)", value: "bangladesh_urban" },
  { label: "🇰🇭 Cambodia", value: "cambodia" },
  { label: "🇨🇳 China", value: "china" },
  { label: "🇮🇳 India", value: "india" },
  { label: "🇮🇩 Indonesia", value: "indonesia" },
  { label: "🇮🇷 Iran", value: "iran" },
  { label: "🇮🇶 Iraq", value: "iraq" },
  { label: "🇯🇵 Japan", value: "japan" },
  { label: "🇯🇴 Jordan", value: "jordan" },
  { label: "🇰🇿 Kazakhstan", value: "kazakhstan" },
  { label: "🇱🇧 Lebanon", value: "lebanon" },
  { label: "🇲🇾 Malaysia", value: "malaysia" },
  { label: "🇲🇲 Myanmar", value: "myanmar" },
  { label: "🇳🇵 Nepal", value: "nepal" },
  { label: "🇵🇰 Pakistan", value: "pakistan" },
  { label: "🇵🇭 Philippines", value: "philippines" },
  { label: "🇸🇦 Saudi Arabia", value: "saudi_arabia" },
  { label: "🇰🇷 South Korea", value: "south_korea" },
  { label: "🇱🇰 Sri Lanka", value: "sri_lanka" },
  { label: "🇸🇾 Syria", value: "syria" },
  { label: "🇹🇭 Thailand", value: "thailand" },
  { label: "🇹🇷 Turkey", value: "turkey" },
  { label: "🇦🇪 UAE", value: "uae" },
  { label: "🇺🇿 Uzbekistan", value: "uzbekistan" },
  { label: "🇻🇳 Vietnam", value: "vietnam" },
  { label: "🇾🇪 Yemen", value: "yemen" },
  { label: "── Europe ──", value: "", disabled: true },
  { label: "🇦🇱 Albania", value: "albania" },
  { label: "🇦🇹 Austria", value: "austria" },
  { label: "🇧🇪 Belgium", value: "belgium" },
  { label: "🇧🇦 Bosnia", value: "bosnia" },
  { label: "🇧🇬 Bulgaria", value: "bulgaria" },
  { label: "🇭🇷 Croatia", value: "croatia" },
  { label: "🇨🇿 Czech Republic", value: "czech_republic" },
  { label: "🇩🇰 Denmark", value: "denmark" },
  { label: "🇫🇮 Finland", value: "finland" },
  { label: "🇫🇷 France", value: "france" },
  { label: "🇩🇪 Germany", value: "germany" },
  { label: "🇬🇷 Greece", value: "greece" },
  { label: "🇭🇺 Hungary", value: "hungary" },
  { label: "🇮🇪 Ireland", value: "ireland" },
  { label: "🇮🇹 Italy", value: "italy" },
  { label: "🇳🇱 Netherlands", value: "netherlands" },
  { label: "🇳🇴 Norway", value: "norway" },
  { label: "🇵🇱 Poland", value: "poland" },
  { label: "🇵🇹 Portugal", value: "portugal" },
  { label: "🇷🇴 Romania", value: "romania" },
  { label: "🇷🇺 Russia", value: "russia" },
  { label: "🇷🇸 Serbia", value: "serbia" },
  { label: "🇪🇸 Spain", value: "spain" },
  { label: "🇸🇪 Sweden", value: "sweden" },
  { label: "🇨🇭 Switzerland", value: "switzerland" },
  { label: "🇺🇦 Ukraine", value: "ukraine" },
  { label: "🇬🇧 United Kingdom", value: "united_kingdom" },
  { label: "── Americas ──", value: "", disabled: true },
  { label: "🇦🇷 Argentina", value: "argentina" },
  { label: "🇧🇴 Bolivia", value: "bolivia" },
  { label: "🇧🇷 Brazil", value: "brazil" },
  { label: "🇨🇦 Canada", value: "canada" },
  { label: "🇨🇱 Chile", value: "chile" },
  { label: "🇨🇴 Colombia", value: "colombia" },
  { label: "🇨🇷 Costa Rica", value: "costa_rica" },
  { label: "🇨🇺 Cuba", value: "cuba" },
  { label: "🇩🇴 Dominican Republic", value: "dominican_republic" },
  { label: "🇪🇨 Ecuador", value: "ecuador" },
  { label: "🇸🇻 El Salvador", value: "el_salvador" },
  { label: "🇬🇹 Guatemala", value: "guatemala" },
  { label: "🇭🇹 Haiti", value: "haiti" },
  { label: "🇭🇳 Honduras", value: "honduras" },
  { label: "🇯🇲 Jamaica", value: "jamaica" },
  { label: "🇲🇽 Mexico", value: "mexico" },
  { label: "🇳🇮 Nicaragua", value: "nicaragua" },
  { label: "🇵🇦 Panama", value: "panama" },
  { label: "🇵🇾 Paraguay", value: "paraguay" },
  { label: "🇵🇪 Peru", value: "peru" },
  { label: "🇺🇸 United States", value: "united_states" },
  { label: "🇺🇾 Uruguay", value: "uruguay" },
  { label: "🇻🇪 Venezuela", value: "venezuela" },
  { label: "── Oceania ──", value: "", disabled: true },
  { label: "🇦🇺 Australia", value: "australia" },
  { label: "🇫🇯 Fiji", value: "fiji" },
  { label: "🇳🇿 New Zealand", value: "new_zealand" },
  { label: "🇵🇬 Papua New Guinea", value: "papua_new_guinea" },
];

export default function BecomeWorker() {
  const { addWorker, user, session } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    location: '',
    education_level: 'Secondary School Certificate',
    work_history: '',
    country_config: 'global'
  });

  const update = (key, val) => setFormData({ ...formData, [key]: val });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session) {
      setError("Please sign in before creating a worker profile.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Call the backend AI analysis
      const response = await axios.post(`${API_BASE}/analyze`, formData);

      // 2. Save everything to Supabase
      await addWorker({
        ...formData,
        analysisResult: response.data
      });

      setSuccess(true);
      setTimeout(() => navigate('/browse'), 2000);
    } catch (err) {
      console.error(err);
      if (err.message === 'Not authenticated') {
        setError("Please sign in before creating a worker profile.");
      } else {
        setError("Failed to analyze skills. Please ensure the backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-container fade-in" style={{ maxWidth: '550px', textAlign: 'center', paddingTop: '6rem' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <CheckCircle size={64} color="var(--success)" />
        </motion.div>
        <h2 style={{ marginTop: '1.5rem' }}>Profile Created!</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Your ESCO-anchored skills profile is now live and saved to the database. Redirecting to Browse Workers...</p>
      </div>
    );
  }

  return (
    <div className="page-container fade-in" style={{ maxWidth: '550px' }}>
      <h1 className="section-title">Become a Worker</h1>
      <p className="section-subtitle">Map your skills to the global ESCO taxonomy with AI.</p>

      {!session && (
        <div style={{ padding: '0.85rem', background: 'var(--warning-bg, rgba(245,158,11,0.1))', color: 'var(--warning, #f59e0b)', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          ⚠️ You need to <a href="/auth?mode=signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>sign up</a> or <a href="/auth?mode=signin" style={{ color: 'var(--primary)', fontWeight: 600 }}>sign in</a> before creating a profile.
        </div>
      )}

      <div className="card-flat">
        {/* Stepper */}
        <div className="stepper">
          {[1, 2, 3].map(i => (
            <div key={i} className={`stepper-dot ${step >= i ? 'active' : ''}`} />
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Personal Context</h2>
                <div className="form-group">
                  <label className="form-label"><User size={14} /> Full Name</label>
                  <input className="form-input" value={formData.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Ahmed Zubair" required />
                </div>
                <div className="form-group">
                  <label className="form-label"><MapPin size={14} /> Location</label>
                  <input className="form-input" value={formData.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Lahore, Pakistan" required />
                </div>
                <div className="form-group">
                  <label className="form-label"><Globe2 size={14} /> Target Region</label>
                  <select className="form-select" value={formData.country_config} onChange={e => update('country_config', e.target.value)}>
                    {COUNTRIES.map((c, i) => (
                      <option key={i} value={c.value} disabled={c.disabled}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="button" className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setStep(2)}>
                  Next <ChevronRight size={16} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Education & Experience</h2>
                <div className="form-group">
                  <label className="form-label"><GraduationCap size={14} /> Highest Education</label>
                  <select className="form-select" value={formData.education_level} onChange={e => update('education_level', e.target.value)}>
                    <option>Primary School</option>
                    <option>Lower Secondary</option>
                    <option>Secondary School Certificate</option>
                    <option>WAEC/WASSCE</option>
                    <option>SSC/HSC</option>
                    <option>High School Diploma</option>
                    <option>O-Levels</option>
                    <option>A-Levels</option>
                    <option>Matriculation</option>
                    <option>National Diploma</option>
                    <option>Diploma</option>
                    <option>Associate Degree</option>
                    <option>Bachelor's Degree</option>
                    <option>Master's Degree</option>
                    <option>Doctorate / PhD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label"><Briefcase size={14} /> Work History</label>
                  <textarea
                    className="form-textarea"
                    rows="5"
                    value={formData.work_history}
                    onChange={e => update('work_history', e.target.value)}
                    placeholder="Describe what you do day-to-day in your own words. For example: 'I repair smartphones and laptops, handle customer queries, and manage a small repair shop.'"
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-outline btn-lg" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
                  <button type="button" className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => setStep(3)}>Next <ChevronRight size={16} /></button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Ready to Analyze?</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  We'll use Gemini AI + ESCO taxonomy to build your portable skills profile and assess your labor market positioning.
                </p>

                {error && (
                  <div style={{ padding: '0.85rem', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-outline btn-lg" style={{ flex: 1 }} onClick={() => setStep(2)}>Back</button>
                  <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={loading || !session}>
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : <><Zap size={18} /> Generate Profile</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
