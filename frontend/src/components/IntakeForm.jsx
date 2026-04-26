import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, GraduationCap, Briefcase, ChevronRight, ChevronLeft, Loader2, Zap } from 'lucide-react';

const IntakeForm = ({ onAnalyze, loading, error }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    education_level: 'Secondary School Certificate',
    work_history: '',
    country_config: 'ghana_urban'
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAnalyze(formData);
  };

  const variants = {
    enter: (direction) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction < 0 ? 100 : -100, opacity: 0 })
  };

  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', justifyContent: 'center' }}>
        {[1, 2, 3].map(i => (
          <div 
            key={i} 
            style={{ 
              width: '40px', 
              height: '4px', 
              borderRadius: '2px', 
              background: step >= i ? 'var(--primary)' : 'var(--border)' 
            }} 
          />
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait" custom={step}>
          {step === 1 && (
            <motion.div
              key="step1"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              custom={1}
            >
              <h2 style={{ marginBottom: '1.5rem' }}>Personal Context</h2>
              <div style={{ marginBottom: '1rem' }}>
                <label><User size={16} /> Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Amara"
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label><MapPin size={16} /> Location</label>
                <input 
                  type="text" 
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. Accra, Ghana"
                  required
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label>Target Region Config</label>
                <select 
                  value={formData.country_config} 
                  onChange={e => setFormData({...formData, country_config: e.target.value})}
                >
                  <option value="ghana_urban">Ghana (Urban)</option>
                  <option value="bangladesh_rural">Bangladesh (Rural)</option>
                </select>
              </div>
              <button type="button" className="btn-primary" style={{ width: '100%' }} onClick={nextStep}>
                Next <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              custom={1}
            >
              <h2 style={{ marginBottom: '1.5rem' }}>Education & Skills</h2>
              <div style={{ marginBottom: '1rem' }}>
                <label><GraduationCap size={16} /> Highest Education Level</label>
                <select 
                  value={formData.education_level} 
                  onChange={e => setFormData({...formData, education_level: e.target.value})}
                >
                  <option>Secondary School Certificate</option>
                  <option>WAEC/WASSCE</option>
                  <option>National Diploma</option>
                  <option>SSC/HSC</option>
                  <option>Diploma</option>
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label><Briefcase size={16} /> Work & Experience</label>
                <textarea 
                  rows="4"
                  value={formData.work_history}
                  onChange={e => setFormData({...formData, work_history: e.target.value})}
                  placeholder="Describe what you do day-to-day... (e.g. I repair mobile phones and help customers with technology)"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={prevStep} style={{ flex: 1, background: 'none', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--text)' }}>
                  Back
                </button>
                <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={nextStep}>
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              custom={1}
            >
              <h2 style={{ marginBottom: '1.5rem' }}>Ready to Analyze?</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                We'll use ESCO-anchored taxonomy and LMIC-calibrated risk models to map your profile to the local labor market.
              </p>
              
              {error && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={prevStep} style={{ flex: 1, background: 'none', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--text)' }}>
                  Back
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : <Zap size={18} />}
                  {loading ? 'Analyzing...' : 'Generate Profile'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};

export default IntakeForm;
