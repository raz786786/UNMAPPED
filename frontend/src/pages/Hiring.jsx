import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Plus, Trash2, Send, CheckCircle, FileText, Eye, Building2, Search, MapPin, X, User, Loader2 } from 'lucide-react';
import { useApp } from '../App';

export default function Hiring() {
  const { user, session, jobs, addJob, fetchJobs, applications, addApplication, fetchApplications, workers } = useApp();
  const [tab, setTab] = useState('browse'); // 'browse' | 'create' | 'myjobs'
  const [success, setSuccess] = useState(false);
  const [applyingTo, setApplyingTo] = useState(null); // job object being applied to
  const [applyForm, setApplyForm] = useState({});
  const [applySuccess, setApplySuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Refresh data on mount
  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  // ---- Create Job Form State ----
  const [jobForm, setJobForm] = useState({
    org_name: '',
    job_title: '',
    description: '',
    required_skills: '',
    location: '',
    salary_range: '',
    fields: []
  });
  const [newField, setNewField] = useState({ label: '', type: 'text' });

  const addField = () => {
    if (!newField.label.trim()) return;
    setJobForm({ ...jobForm, fields: [...jobForm.fields, { ...newField, id: Date.now() }] });
    setNewField({ label: '', type: 'text' });
  };

  const removeField = (id) => {
    setJobForm({ ...jobForm, fields: jobForm.fields.filter(f => f.id !== id) });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!session) { alert('Please Sign In to create a job posting.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await addJob(jobForm);
      setSuccess(true);
      setJobForm({ org_name: '', job_title: '', description: '', required_skills: '', location: '', salary_range: '', fields: [] });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create job posting.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Apply Flow ----
  const handleApply = async (e) => {
    e.preventDefault();
    if (!session) { alert('Please Sign In to apply.'); return; }
    setSubmitting(true);
    try {
      await addApplication({
        jobId: applyingTo.id,
        jobTitle: applyingTo.job_title,
        orgName: applyingTo.org_name,
        applicantName: user.name,
        applicantEmail: user.email,
        answers: applyForm
      });
      setApplySuccess(true);
      setTimeout(() => {
        setApplyingTo(null);
        setApplyForm({});
        setApplySuccess(false);
      }, 2000);
    } catch (err) {
      alert(err.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Filters ----
  // createdBy is now a UUID from Supabase
  const myJobs = jobs.filter(j => j.createdBy === session?.user?.id);
  const getAppsForJob = (jobId) => applications.filter(a => a.jobId === jobId);

  const filteredJobs = jobs.filter(j => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      j.job_title?.toLowerCase().includes(q) ||
      j.org_name?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q) ||
      j.required_skills?.toLowerCase().includes(q)
    );
  });

  // Check if current user already applied to a job
  const hasApplied = (jobId) => applications.some(a => a.jobId === jobId && a.applicantId === session?.user?.id);

  // Find worker profile for current user
  const myWorkerProfile = workers.find(w => w.user_id === session?.user?.id);

  return (
    <div className="page-container fade-in" style={{ maxWidth: '900px' }}>
      <h1 className="section-title">Job Board</h1>
      <p className="section-subtitle">Browse opportunities or post jobs for skilled workers.</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button className={`btn ${tab === 'browse' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('browse')}>
          <Search size={16} /> Browse Jobs ({jobs.length})
        </button>
        <button className={`btn ${tab === 'create' ? 'btn-accent' : 'btn-outline'}`} onClick={() => setTab('create')}>
          <Plus size={16} /> Post a Job
        </button>
        <button className={`btn ${tab === 'myjobs' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('myjobs')}>
          <Eye size={16} /> My Postings ({myJobs.length})
        </button>
      </div>

      {/* =============== BROWSE JOBS TAB =============== */}
      {tab === 'browse' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              placeholder="Search jobs by title, company, location, or skills..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          {filteredJobs.length === 0 ? (
            <div className="card-flat" style={{ textAlign: 'center', padding: '3rem' }}>
              <Briefcase size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>No job postings yet.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Be the first to post an opportunity!</p>
              <button className="btn btn-accent" onClick={() => setTab('create')}><Plus size={16} /> Post a Job</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredJobs.map((job, i) => {
                const applied = hasApplied(job.id);
                const appCount = getAppsForJob(job.id).length;
                return (
                  <motion.div
                    key={job.id}
                    className="card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <h3 style={{ fontSize: '1.15rem', margin: 0 }}>{job.job_title}</h3>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Building2 size={13} /> {job.org_name}</span>
                          {job.location && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={13} /> {job.location}</span>}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {job.salary_range && (
                          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{job.salary_range}</div>
                        )}
                        <span className="badge badge-success">{appCount} applicant{appCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.75rem 0' }}>{job.description}</p>

                    {job.required_skills && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                        {job.required_skills.split(',').map((s, j) => (
                          <span key={j} className="tag">{s.trim()}</span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {applied ? (
                        <span className="badge badge-success" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
                          <CheckCircle size={14} /> Applied
                        </span>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => { setApplyingTo(job); setApplyForm({}); }}
                        >
                          <Send size={14} /> Apply Now
                        </button>
                      )}
                      {job.createdBy === session?.user?.id && (
                        <span className="badge badge-warning">Your posting</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* =============== CREATE JOB TAB =============== */}
      {tab === 'create' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {!session && (
            <div style={{ padding: '0.85rem', background: 'var(--warning-bg, rgba(245,158,11,0.1))', color: 'var(--warning, #f59e0b)', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              ⚠️ Please sign in to create a job posting.
            </div>
          )}

          {success && (
            <div style={{ padding: '1rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} /> Job posting created and saved to database!
            </div>
          )}

          {error && (
            <div style={{ padding: '0.85rem', background: 'var(--error-bg, rgba(239,68,68,0.1))', color: 'var(--error, #ef4444)', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleCreate}>
            <div className="card-flat" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={20} /> Organization Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Organization Name</label>
                  <input className="form-input" value={jobForm.org_name} onChange={e => setJobForm({ ...jobForm, org_name: e.target.value })} placeholder="e.g. TechHub Ghana" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input className="form-input" value={jobForm.job_title} onChange={e => setJobForm({ ...jobForm, job_title: e.target.value })} placeholder="e.g. Mobile Repair Technician" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Job Description</label>
                <textarea className="form-textarea" rows="3" value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} placeholder="Describe the role, responsibilities, and expectations..." required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Required Skills (comma-separated)</label>
                  <input className="form-input" value={jobForm.required_skills} onChange={e => setJobForm({ ...jobForm, required_skills: e.target.value })} placeholder="e.g. device repair, soldering, customer service" />
                </div>
                <div className="form-group">
                  <label className="form-label">Salary Range</label>
                  <input className="form-input" value={jobForm.salary_range} onChange={e => setJobForm({ ...jobForm, salary_range: e.target.value })} placeholder="e.g. GHS 800-1,400/mo" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={jobForm.location} onChange={e => setJobForm({ ...jobForm, location: e.target.value })} placeholder="e.g. Accra, Ghana or Remote" />
              </div>
            </div>

            {/* Custom Form Builder */}
            <div className="card-flat" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={20} /> Custom Application Questions</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Add custom fields that workers will fill out when applying.</p>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input className="form-input" placeholder="Field label (e.g. Years of Experience)" value={newField.label} onChange={e => setNewField({ ...newField, label: e.target.value })} style={{ flex: 1 }} />
                <select className="form-select" value={newField.type} onChange={e => setNewField({ ...newField, type: e.target.value })} style={{ width: '140px' }}>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="textarea">Long Text</option>
                </select>
                <button type="button" className="btn btn-primary" onClick={addField}><Plus size={16} /></button>
              </div>

              {jobForm.fields.length > 0 && (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {jobForm.fields.map(f => (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.875rem' }}>{f.label} <span className="badge badge-primary">{f.type}</span></span>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeField(f.id)}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-accent btn-lg" style={{ width: '100%' }} disabled={submitting || !session}>
              {submitting ? <><Loader2 size={18} className="animate-spin" /> Publishing...</> : <><Send size={18} /> Publish Job Posting</>}
            </button>
          </form>
        </motion.div>
      )}

      {/* =============== MY POSTINGS TAB =============== */}
      {tab === 'myjobs' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {!session ? (
            <div className="card-flat" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Please sign in to see your job postings.</p>
            </div>
          ) : myJobs.length === 0 ? (
            <div className="card-flat" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You haven't created any job postings yet.</p>
              <button className="btn btn-accent" onClick={() => setTab('create')}><Plus size={16} /> Create Your First Job</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {myJobs.map(job => {
                const apps = getAppsForJob(job.id);
                return (
                  <div key={job.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{job.job_title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{job.org_name} · {job.location}</p>
                      </div>
                      <span className={`badge ${apps.length > 0 ? 'badge-success' : 'badge-warning'}`}>
                        {apps.length} Application{apps.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{job.description}</p>
                    {job.salary_range && <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>Salary: {job.salary_range}</p>}

                    {apps.length > 0 && (
                      <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Applications Received</h4>
                        {apps.map(app => (
                          <div key={app.id} style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', marginBottom: '0.5rem', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem', background: 'var(--primary)' }}>
                                  {app.applicantName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                  <span style={{ fontWeight: 600 }}>{app.applicantName}</span>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{app.applicantEmail}</span>
                                </div>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(app.submittedAt).toLocaleDateString()}</span>
                            </div>
                            {app.answers && Object.entries(app.answers).map(([key, val]) => (
                              <div key={key} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', paddingLeft: '2.5rem' }}>
                                <strong style={{ color: 'var(--text)' }}>{key}:</strong> {val}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* =============== APPLY MODAL =============== */}
      <AnimatePresence>
        {applyingTo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '2rem'
            }}
            onClick={(e) => { if (e.target === e.currentTarget) { setApplyingTo(null); setApplySuccess(false); } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="card-flat"
              style={{ maxWidth: '520px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}
            >
              {applySuccess ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <CheckCircle size={48} color="var(--success)" />
                  <h3 style={{ marginTop: '1rem' }}>Application Submitted!</h3>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Your application for "{applyingTo.job_title}" at {applyingTo.org_name} has been saved.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Apply: {applyingTo.job_title}</h2>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{applyingTo.org_name} · {applyingTo.location}</p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setApplyingTo(null)}><X size={18} /></button>
                  </div>

                  <form onSubmit={handleApply}>
                    {/* Auto-attached profile info */}
                    <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <User size={14} color="var(--primary)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>Your Profile (auto-attached)</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {user?.name} · {user?.email}
                        {myWorkerProfile && <> · {myWorkerProfile.analysisResult?.profile?.skills?.length || 0} verified skills</>}
                      </p>
                    </div>

                    {/* Default fields */}
                    <div className="form-group">
                      <label className="form-label">Cover Note</label>
                      <textarea
                        className="form-textarea"
                        rows="3"
                        placeholder="Briefly explain why you're a good fit for this role..."
                        value={applyForm['Cover Note'] || ''}
                        onChange={e => setApplyForm({ ...applyForm, 'Cover Note': e.target.value })}
                        required
                      />
                    </div>

                    {/* Custom fields from the job posting */}
                    {(applyingTo.fields || []).map(field => (
                      <div key={field.id} className="form-group">
                        <label className="form-label">{field.label}</label>
                        {field.type === 'textarea' ? (
                          <textarea
                            className="form-textarea"
                            rows="3"
                            value={applyForm[field.label] || ''}
                            onChange={e => setApplyForm({ ...applyForm, [field.label]: e.target.value })}
                            required
                          />
                        ) : (
                          <input
                            className="form-input"
                            type={field.type}
                            value={applyForm[field.label] || ''}
                            onChange={e => setApplyForm({ ...applyForm, [field.label]: e.target.value })}
                            required
                          />
                        )}
                      </div>
                    ))}

                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
                      {submitting ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : <><Send size={18} /> Submit Application</>}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
