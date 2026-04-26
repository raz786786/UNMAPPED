import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';
import { Briefcase, Users, FileText, TrendingUp, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, session, workers, jobs, applications, fetchWorkers, fetchJobs, fetchApplications } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchWorkers(), fetchJobs(), fetchApplications()])
      .finally(() => setLoading(false));
  }, []);

  if (!session) {
    return (
      <div className="page-container fade-in" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h1>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Please sign in to view your dashboard.</p>
        <Link to="/auth?mode=signin" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Sign In</Link>
      </div>
    );
  }

  const myWorkerProfile = workers.find(w => w.user_id === session.user.id);
  const myJobs = jobs.filter(j => j.createdBy === session.user.id);
  const myApplications = applications.filter(a => a.applicantId === session.user.id);
  const applicationsToMyJobs = applications.filter(a =>
    myJobs.some(j => j.id === a.jobId)
  );

  if (loading) {
    return (
      <div className="page-container fade-in" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="page-container fade-in" style={{ maxWidth: '800px' }}>
      <h1 className="section-title">Dashboard</h1>
      <p className="section-subtitle">Welcome back, {user?.name}!</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <Users size={28} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{workers.length}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Workers</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <Briefcase size={28} style={{ color: 'var(--accent, #f97316)', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent, #f97316)' }}>{myJobs.length}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>My Job Posts</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <FileText size={28} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>{myApplications.length}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>My Applications</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <TrendingUp size={28} style={{ color: '#8b5cf6', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#8b5cf6' }}>{applicationsToMyJobs.length}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Received Apps</div>
        </div>
      </div>

      {/* Worker Profile Status */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Your Worker Profile</h3>
        {myWorkerProfile ? (
          <div>
            <p style={{ color: 'var(--success)', fontWeight: 600, marginBottom: '0.5rem' }}>✓ Profile Active</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {myWorkerProfile.analysisResult?.profile?.skills?.length || 0} skills mapped · 
              {' '}{myWorkerProfile.analysisResult?.profile?.top_occupations?.length || 0} occupation matches
            </p>
            <Link to={`/worker/${myWorkerProfile.id}`} className="btn btn-outline btn-sm" style={{ marginTop: '0.75rem' }}>
              View Full Profile
            </Link>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>You haven't created a worker profile yet.</p>
            <Link to="/become-worker" className="btn btn-primary btn-sm">Create Profile</Link>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <Link to="/browse" className="btn btn-primary">Browse Workers</Link>
        <Link to="/hiring" className="btn btn-accent">Job Board</Link>
      </div>
    </div>
  );
}
