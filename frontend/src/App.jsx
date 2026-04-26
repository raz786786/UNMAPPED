import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Globe2, Users, Briefcase, UserPlus, LogIn, ChevronRight, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import HomePage from './pages/HomePage';
import BrowseWorkers from './pages/BrowseWorkers';
import WorkerDetail from './pages/WorkerDetail';
import BecomeWorker from './pages/BecomeWorker';
import Hiring from './pages/Hiring';
import AuthPage from './pages/AuthPage';
import Dashboard from './components/Dashboard';
import './index.css';

// Global context for workers and auth
export const AppContext = createContext();

export function useApp() { return useContext(AppContext); }

function AppProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ---- Supabase Auth listener ----
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ---- Load profile from Supabase ----
  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setUser({
        id: data.id,
        name: data.full_name,
        email: data.email
      });
    }
  };

  // ---- Load all workers from Supabase ----
  const fetchWorkers = async () => {
    const { data, error } = await supabase
      .from('worker_profiles')
      .select(`
        *,
        worker_skills (*),
        worker_occupations (*),
        risk_assessments (*),
        opportunity_matches (*)
      `)
      .order('created_at', { ascending: false });
    
    if (data) {
      // Transform to match the old shape for minimal UI changes
      const transformed = data.map(wp => ({
        id: wp.id,
        name: wp.name,
        location: wp.location,
        education_level: wp.education_level,
        work_history: wp.work_history,
        country_config: wp.country_config,
        user_id: wp.user_id,
        analysisResult: {
          country: wp.country_name,
          profile: {
            name: wp.name,
            location: wp.location,
            education: { level: wp.education_level },
            skills: (wp.worker_skills || []).map(s => ({
              esco_uri: s.esco_uri,
              label: s.label,
              type: s.type,
              score: s.score,
              human_label: s.human_label
            })),
            top_occupations: (wp.worker_occupations || []).map(o => ({
              title: o.title,
              isco_code: o.isco_code,
              confidence: o.confidence,
              uri: o.uri
            })),
            profile_id: wp.profile_id
          },
          risk_assessment: wp.risk_assessments?.[0] ? {
            occupation: wp.risk_assessments[0].occupation,
            global_risk_score: wp.risk_assessments[0].global_risk_score,
            lmic_adjusted_risk: wp.risk_assessments[0].lmic_adjusted_risk,
            trend_2035: wp.risk_assessments[0].trend_2035,
            skill_durability: (wp.worker_skills || [])
              .filter(s => s.durability)
              .map(s => ({ label: s.label, category: s.durability }))
          } : null,
          opportunity_matching: {
            market_signals: wp.opportunity_matches?.[0]?.market_signals || {},
            opportunities: (wp.opportunity_matches || []).map(o => ({
              id: o.id,
              title: o.title,
              type: o.type,
              match_score: o.match_score,
              description: o.description,
              wage_estimate: o.wage_estimate
            }))
          }
        }
      }));
      setWorkers(transformed);
    }
  };

  // ---- Load all jobs from Supabase ----
  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('job_postings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      const transformed = data.map(j => ({
        id: j.id,
        org_name: j.org_name,
        job_title: j.job_title,
        description: j.description,
        required_skills: j.required_skills,
        location: j.location,
        salary_range: j.salary_range,
        fields: j.custom_fields || [],
        createdBy: j.created_by
      }));
      setJobs(transformed);
    }
  };

  // ---- Load all applications from Supabase ----
  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .order('submitted_at', { ascending: false });
    
    if (data) {
      const transformed = data.map(a => ({
        id: a.id,
        jobId: a.job_id,
        applicantName: a.applicant_name,
        applicantEmail: a.applicant_email,
        answers: a.answers || {},
        submittedAt: a.submitted_at,
        applicantId: a.applicant_id
      }));
      setApplications(transformed);
    }
  };

  // Fetch all data on mount
  useEffect(() => {
    fetchWorkers();
    fetchJobs();
    fetchApplications();
  }, []);

  // ---- Add Worker to Supabase ----
  const addWorker = async (workerData) => {
    if (!session?.user) throw new Error('Not authenticated');
    
    const analysisResult = workerData.analysisResult;
    const profile = analysisResult?.profile;
    const riskAssessment = analysisResult?.risk_assessment;
    const opportunityMatching = analysisResult?.opportunity_matching;

    // 1. Insert worker profile
    const { data: wp, error: wpError } = await supabase
      .from('worker_profiles')
      .insert({
        user_id: session.user.id,
        name: workerData.name,
        location: workerData.location,
        education_level: workerData.education_level,
        work_history: workerData.work_history,
        country_config: workerData.country_config,
        profile_id: profile?.profile_id,
        country_name: analysisResult?.country
      })
      .select()
      .single();

    if (wpError) throw wpError;
    const workerId = wp.id;

    // 2. Insert skills
    const skills = (profile?.skills || []).map(s => ({
      worker_id: workerId,
      esco_uri: s.esco_uri,
      label: s.label,
      type: s.type,
      score: s.score,
      human_label: s.human_label,
      durability: riskAssessment?.skill_durability?.find(d => d.label === s.label)?.category || null
    }));
    if (skills.length > 0) {
      await supabase.from('worker_skills').insert(skills);
    }

    // 3. Insert occupations
    const occupations = (profile?.top_occupations || []).map(o => ({
      worker_id: workerId,
      title: o.title,
      isco_code: o.isco_code,
      confidence: o.confidence,
      uri: o.uri
    }));
    if (occupations.length > 0) {
      await supabase.from('worker_occupations').insert(occupations);
    }

    // 4. Insert risk assessment
    if (riskAssessment) {
      await supabase.from('risk_assessments').insert({
        worker_id: workerId,
        occupation: riskAssessment.occupation,
        global_risk_score: riskAssessment.global_risk_score,
        lmic_adjusted_risk: riskAssessment.lmic_adjusted_risk,
        trend_2035: riskAssessment.trend_2035
      });
    }

    // 5. Insert opportunity matches
    const opps = (opportunityMatching?.opportunities || []);
    if (opps.length > 0) {
      const oppInserts = opps.map((o, i) => ({
        worker_id: workerId,
        market_signals: i === 0 ? (opportunityMatching.market_signals || {}) : {},
        title: o.title,
        type: o.type,
        match_score: o.match_score,
        description: o.description,
        wage_estimate: o.wage_estimate
      }));
      await supabase.from('opportunity_matches').insert(oppInserts);
    }

    // Refresh workers list
    await fetchWorkers();
  };

  // ---- Add Job to Supabase ----
  const addJob = async (jobData) => {
    if (!session?.user) throw new Error('Not authenticated');
    
    const { error } = await supabase.from('job_postings').insert({
      created_by: session.user.id,
      org_name: jobData.org_name,
      job_title: jobData.job_title,
      description: jobData.description,
      required_skills: jobData.required_skills,
      location: jobData.location,
      salary_range: jobData.salary_range,
      custom_fields: jobData.fields || []
    });

    if (error) throw error;
    await fetchJobs();
  };

  // ---- Add Application to Supabase ----
  const addApplication = async (appData) => {
    if (!session?.user) throw new Error('Not authenticated');
    
    const { error } = await supabase.from('job_applications').insert({
      job_id: appData.jobId,
      applicant_id: session.user.id,
      applicant_name: appData.applicantName,
      applicant_email: appData.applicantEmail,
      answers: appData.answers || {}
    });

    if (error) throw error;
    await fetchApplications();
  };

  // ---- Auth functions ----
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  };

  const signup = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const toggleTheme = () => setTheme(p => p === 'light' ? 'dark' : 'light');

  return (
    <AppContext.Provider value={{
      theme, toggleTheme, user, session, loading,
      login, signup, logout,
      workers, addWorker, fetchWorkers,
      jobs, addJob, fetchJobs,
      applications, addApplication, fetchApplications
    }}>
      {children}
    </AppContext.Provider>
  );
}

function Navbar() {
  const { user, logout, theme } = useApp();
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span>UN</span>MAPPED
      </Link>
      <div className="navbar-links">
        <Link to="/browse" className={isActive('/browse')}>Browse Workers</Link>
        <Link to="/become-worker" className={isActive('/become-worker')}>Become a Worker</Link>
        <Link to="/hiring" className={isActive('/hiring')}>We're Hiring</Link>
        {user ? (
          <>
            <Link to="/dashboard" className="nav-link" style={{ color: 'var(--primary)' }}>{user.name}</Link>
            <button onClick={logout} className="btn btn-ghost btn-sm">Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/auth?mode=signin" className="btn btn-outline btn-sm">Sign In</Link>
            <Link to="/auth?mode=signup" className="btn btn-primary btn-sm">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  const { theme, toggleTheme, loading } = useApp();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loader" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowseWorkers />} />
          <Route path="/worker/:id" element={<WorkerDetail />} />
          <Route path="/become-worker" element={<BecomeWorker />} />
          <Route path="/hiring" element={<Hiring />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </AnimatePresence>
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </>
  );
}

export default function WrappedApp() {
  return (
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  );
}
