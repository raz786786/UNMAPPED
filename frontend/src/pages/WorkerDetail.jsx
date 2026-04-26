import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, GraduationCap, Shield, TrendingUp, Download, ArrowLeft, Briefcase, Loader2 } from 'lucide-react';
import { useApp } from '../App';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';

const COLORS = ['#6366f1', '#f97316', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
function getColor(id) { return COLORS[id % COLORS.length]; }
function getInitials(name) { return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'; }

// Strip emojis and non-ASCII characters that jsPDF can't render
function sanitize(str) {
  if (!str) return 'N/A';
  // Remove emojis and non-printable unicode, keep basic latin + extended latin
  return str.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim() || 'N/A';
}

function generatePDF(worker) {
  const profile = worker.analysisResult?.profile;
  const risk = worker.analysisResult?.risk_assessment;
  const opps = worker.analysisResult?.opportunity_matching;
  const doc = new jsPDF();

  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  let y = 20;

  // ---- Header bar ----
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, PAGE_W, 38, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('UNMAPPED', 14, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Portable Skills Profile  |  ESCO Anchored', 14, 24);
  doc.setFontSize(8);
  doc.text('Profile ID: ' + sanitize(profile?.profile_id), 14, 32);
  doc.text('Generated: ' + new Date().toLocaleDateString(), PAGE_W - 60, 32);

  y = 48;

  // ---- Personal Info ----
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(sanitize(worker.name), 14, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Location: ' + sanitize(worker.location) + '  |  Education: ' + sanitize(worker.education_level), 14, y);
  y += 12;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, PAGE_W - 14, y);
  y += 8;

  // ---- Skills Section ----
  doc.setTextColor(99, 102, 241);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('SKILLS (ESCO ANCHORED)', 14, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  (profile?.skills || []).forEach((skill) => {
    if (y > PAGE_H - 20) { doc.addPage(); y = 20; }
    const confidence = Math.round(skill.score * 100);
    doc.setTextColor(15, 23, 42);
    doc.text('[+]  ' + sanitize(skill.label), 18, y);
    doc.setTextColor(16, 185, 129);
    doc.text(confidence + '%', PAGE_W - 30, y);
    y += 6;
  });
  y += 6;

  // ---- Occupations ----
  if (y > PAGE_H - 40) { doc.addPage(); y = 20; }
  doc.setTextColor(99, 102, 241);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOP OCCUPATION MATCHES', 14, y);
  y += 8;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  (profile?.top_occupations || []).forEach((occ) => {
    if (y > PAGE_H - 20) { doc.addPage(); y = 20; }
    doc.text('  -  ' + sanitize(occ.title) + ' (ISCO: ' + sanitize(occ.isco_code) + ')', 18, y);
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.text(Math.round(occ.confidence * 100) + '%', PAGE_W - 30, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    y += 6;
  });
  y += 8;

  // ---- Risk Assessment ----
  if (risk) {
    if (y > PAGE_H - 50) { doc.addPage(); y = 20; }
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, PAGE_W - 14, y);
    y += 8;

    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('AUTOMATION RISK ASSESSMENT', 14, y);
    y += 8;

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Global Baseline Risk: ' + Math.round(risk.global_risk_score * 100) + '%', 18, y);
    y += 6;
    doc.text('LMIC-Adjusted Risk: ' + Math.round(risk.lmic_adjusted_risk * 100) + '%', 18, y);
    y += 6;
    doc.text('Trend 2035: ' + sanitize(risk.trend_2035), 18, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Skill Durability:', 18, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    (risk.skill_durability || []).forEach((s) => {
      if (y > PAGE_H - 20) { doc.addPage(); y = 20; }
      const color = s.category === 'DURABLE' ? [16, 185, 129] : [245, 158, 11];
      doc.setTextColor(...color);
      doc.text('  * ' + sanitize(s.label) + ': ' + sanitize(s.category), 22, y);
      doc.setTextColor(15, 23, 42);
      y += 6;
    });
    y += 4;
  }

  // ---- Opportunities ----
  if (opps) {
    if (y > PAGE_H - 50) { doc.addPage(); y = 20; }
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, PAGE_W - 14, y);
    y += 8;

    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('OPPORTUNITIES & MARKET SIGNALS', 14, y);
    y += 8;

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (opps.market_signals) {
      Object.entries(opps.market_signals).forEach(([key, val]) => {
        if (y > PAGE_H - 20) { doc.addPage(); y = 20; }
        doc.text(sanitize(key.replace(/_/g, ' ').toUpperCase()) + ': ' + sanitize(String(val)), 18, y);
        y += 5;
      });
    }
    y += 4;

    doc.setFontSize(10);
    (opps.opportunities || []).forEach((opp) => {
      if (y > PAGE_H - 25) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text(sanitize(opp.title) + ' (' + sanitize(opp.type) + ')', 18, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(99, 102, 241);
      doc.text('Match: ' + Math.round(opp.match_score * 100) + '%  |  ' + sanitize(opp.wage_estimate), PAGE_W - 90, y);
      doc.setTextColor(15, 23, 42);
      y += 5;
      doc.setFontSize(9);
      doc.text('  ' + sanitize(opp.description), 18, y);
      doc.setFontSize(10);
      y += 7;
    });
  }

  // ---- Footer ----
  y = PAGE_H - 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y - 4, PAGE_W - 14, y - 4);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('UNMAPPED Protocol  |  Composable Skills Infrastructure  |  Calibrated for Global Labor Resilience', 14, y);
  doc.text('Powered by ESCO v1.2.0 & Gemini AI', PAGE_W - 70, y);

  doc.save('UNMAPPED_Profile_' + sanitize(worker.name).replace(/\s/g, '_') + '.pdf');
}


export default function WorkerDetail() {
  const { id } = useParams();
  const { workers, fetchWorkers } = useApp();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to find worker in existing context first
    const found = workers.find(w => w.id === Number(id));
    if (found) {
      setWorker(found);
      setLoading(false);
    } else {
      // Fetch from Supabase if not in context
      fetchWorkers().then(() => setLoading(false));
    }
  }, [id]);

  // Update worker if workers list changes
  useEffect(() => {
    const found = workers.find(w => w.id === Number(id));
    if (found) {
      setWorker(found);
      setLoading(false);
    }
  }, [workers, id]);

  if (loading) {
    return (
      <div className="page-container fade-in" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading worker profile...</p>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="page-container fade-in" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <h2>Worker not found</h2>
        <Link to="/browse" className="btn btn-primary" style={{ marginTop: '1rem' }}><ArrowLeft size={16} /> Back to Browse</Link>
      </div>
    );
  }

  const { analysisResult } = worker;
  const profile = analysisResult?.profile;
  const risk = analysisResult?.risk_assessment;
  const opps = analysisResult?.opportunity_matching;

  return (
    <div className="page-container fade-in" style={{ maxWidth: '900px' }}>
      <Link to="/browse" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        <ArrowLeft size={14} /> Back to Workers
      </Link>

      {/* Header Card */}
      <motion.div className="card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div className="avatar avatar-lg" style={{ background: getColor(worker.id) }}>{getInitials(worker.name)}</div>
          <div>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>{worker.name}</h1>
            <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={14} /> {worker.location}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span className="badge badge-primary"><GraduationCap size={12} /> {worker.education_level}</span>
              <span className="badge badge-success">Profile ID: {profile?.profile_id}</span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Skills (ESCO Anchored)</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {(profile?.skills || []).map((s, i) => (
              <span key={i} className="tag">✓ {s.label} <span style={{ color: 'var(--success)', marginLeft: '0.25rem', fontWeight: 600 }}>{Math.round(s.score * 100)}%</span></span>
            ))}
          </div>
        </div>

        {/* Occupations */}
        <div>
          <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Top Occupation Matches</h3>
          {(profile?.top_occupations || []).map((occ, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: i < profile.top_occupations.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontWeight: 500 }}>{occ.title}</span>
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>{Math.round(occ.confidence * 100)}%</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Risk Assessment */}
        {risk && (
          <motion.div className="card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', marginBottom: '1.25rem' }}>
              <Shield size={22} />
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Automation Risk</h3>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem' }}>LMIC-Adjusted Risk</span>
                <span style={{ fontWeight: 700 }}>{Math.round(risk.lmic_adjusted_risk * 100)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${risk.lmic_adjusted_risk * 100}%`, background: risk.lmic_adjusted_risk < 0.3 ? 'var(--success)' : 'var(--warning)' }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Global baseline: {Math.round(risk.global_risk_score * 100)}% — reduced by local wage & infra factors.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Skill Durability</h4>
              {(risk.skill_durability || []).map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.category === 'DURABLE' ? 'var(--success)' : 'var(--warning)' }} />
                  <span style={{ fontSize: '0.85rem' }}>{s.label}: <strong style={{ color: s.category === 'DURABLE' ? 'var(--success)' : 'var(--warning)' }}>{s.category}</strong></span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Opportunities */}
        {opps && (
          <motion.div className="card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '1.25rem' }}>
              <TrendingUp size={22} />
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Opportunities</h3>
            </div>
            {(opps.opportunities || []).map((opp, i) => (
              <div key={i} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', marginBottom: '0.5rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{opp.title}</span>
                    <span className="badge badge-accent" style={{ marginLeft: '0.5rem' }}>{opp.type}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>{Math.round(opp.match_score * 100)}%</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{opp.wage_estimate}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => generatePDF(worker)}>
        <Download size={18} /> Download Portable Skills PDF
      </button>
    </div>
  );
}
