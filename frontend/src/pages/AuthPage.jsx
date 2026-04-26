import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useApp } from '../App';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') || 'signin';
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, signup } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        await signup(email, password, name);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container fade-in" style={{ maxWidth: '440px', paddingTop: '4rem' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem' }}>{mode === 'signin' ? 'Welcome Back' : 'Create Account'}</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {mode === 'signin' ? 'Sign in to manage your profile and opportunities.' : 'Join the UNMAPPED global talent network.'}
          </p>
        </div>

        <div className="card-flat">
          {error && (
            <div style={{
              padding: '0.85rem',
              background: 'var(--error-bg, rgba(239, 68, 68, 0.1))',
              color: 'var(--error, #ef4444)',
              borderRadius: 'var(--radius)',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label"><User size={14} /> Full Name</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label"><Mail size={14} /> Email</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label"><Lock size={14} /> Password</label>
              <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Processing...</>
              ) : (
                <>{mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            {mode === 'signin' ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Don't have an account?{' '}
                <button onClick={() => { setMode('signup'); setError(null); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Sign Up</button>
              </p>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <button onClick={() => { setMode('signin'); setError(null); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
