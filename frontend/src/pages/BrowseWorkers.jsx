import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Filter, ChevronRight, Star, Loader2 } from 'lucide-react';
import { useApp } from '../App';

const COLORS = ['#6366f1', '#f97316', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

function getColor(i) { return COLORS[i % COLORS.length]; }
function getInitials(name) { return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'; }

export default function BrowseWorkers() {
  const { workers, fetchWorkers } = useApp();
  const [search, setSearch] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Refresh workers data on mount
  useEffect(() => {
    setRefreshing(true);
    fetchWorkers().finally(() => setRefreshing(false));
  }, []);

  const allSkills = [...new Set(workers.flatMap(w => (w.analysisResult?.profile?.skills || []).map(s => s.label)))];

  const filtered = workers.filter(w => {
    const nameMatch = w.name?.toLowerCase().includes(search.toLowerCase());
    const locMatch = w.location?.toLowerCase().includes(search.toLowerCase());
    const skillMatch = !filterSkill || (w.analysisResult?.profile?.skills || []).some(s => s.label === filterSkill);
    return (nameMatch || locMatch) && skillMatch;
  });

  return (
    <div className="page-container fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="section-title">Browse Global Talent</h1>
        <p className="section-subtitle">Discover skilled professionals mapped to the ESCO taxonomy.</p>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            placeholder="Search by name or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <select className="form-select" style={{ width: '220px' }} value={filterSkill} onChange={e => setFilterSkill(e.target.value)}>
          <option value="">All Skills</option>
          {allSkills.map((s, i) => <option key={i} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Workers Grid */}
      {refreshing ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading workers...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-flat" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>No workers found yet.</p>
          <Link to="/become-worker" className="btn btn-primary">Become the first worker <ChevronRight size={16} /></Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((worker, i) => {
            const profile = worker.analysisResult?.profile;
            const risk = worker.analysisResult?.risk_assessment;
            const topOcc = profile?.top_occupations?.[0];
            return (
              <motion.div
                key={worker.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/worker/${worker.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div className="avatar" style={{ background: getColor(i) }}>{getInitials(worker.name)}</div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{worker.name}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={12} /> {worker.location}
                        </p>
                      </div>
                    </div>

                    {topOcc && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span className="badge badge-primary">{topOcc.title}</span>
                        <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>{Math.round(topOcc.confidence * 100)}% match</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                      {(profile?.skills || []).slice(0, 3).map((s, j) => (
                        <span key={j} className="tag">{s.label}</span>
                      ))}
                    </div>

                    {risk && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Automation Risk</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: risk.lmic_adjusted_risk < 0.3 ? 'var(--success)' : 'var(--warning)' }}>
                          {Math.round(risk.lmic_adjusted_risk * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
