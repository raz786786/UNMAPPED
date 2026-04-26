import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Briefcase, Zap, Shield, TrendingUp, Globe2, Sparkles, BarChart3 } from 'lucide-react';
import { useApp } from '../App';

// Constellation / Network Canvas
function NetworkCanvas() {
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    // Create nodes
    if (nodesRef.current.length === 0) {
      for (let i = 0; i < 55; i++) {
        nodesRef.current.push({
          x: Math.random() * 600,
          y: Math.random() * 500,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: 2 + Math.random() * 4,
          pulse: Math.random() * Math.PI * 2,
          hue: 230 + Math.random() * 40, // blue-indigo range
        });
      }
    }
    const nodes = nodesRef.current;

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener('mousemove', handleMouse);

    function draw() {
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);

      // Update nodes
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.02;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        // Mouse repulsion
        const dx = n.x - mouseRef.current.x;
        const dy = n.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          n.vx += (dx / dist) * 0.15;
          n.vy += (dy / dist) * 0.15;
        }
        // Dampen velocity
        n.vx *= 0.995;
        n.vy *= 0.995;
      });

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.2;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach(n => {
        const glowSize = n.r + Math.sin(n.pulse) * 1.5;
        // Outer glow
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowSize * 3);
        grad.addColorStop(0, `hsla(${n.hue}, 80%, 70%, 0.25)`);
        grad.addColorStop(1, `hsla(${n.hue}, 80%, 70%, 0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        // Core
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${n.hue}, 80%, 72%, 0.85)`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

// Floating skill tags over the network
const SKILL_TAGS = [
  { label: '⚡ Electronics Repair', top: '10%', left: '10%' },
  { label: '🧠 Data Analysis', top: '25%', right: '8%' },
  { label: '☀️ Solar Energy', bottom: '25%', left: '5%' },
  { label: '📱 Mobile Development', bottom: '10%', right: '15%' },
  { label: '🔧 Mechanical Engineering', top: '55%', left: '55%' },
];

export default function HomePage() {
  const { workers } = useApp();

  return (
    <div className="fade-in">
      {/* Hero */}
      <section style={{ display: 'flex', alignItems: 'center', minHeight: '88vh', padding: '0 4rem', gap: '3rem', overflow: 'hidden' }}>
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          style={{ flex: '0 0 480px' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', background: 'var(--primary-light)', marginBottom: '1.25rem' }}>
            <Sparkles size={14} color="var(--primary)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>AI-Powered Skills Infrastructure</span>
          </div>

          <h1 style={{ fontSize: '3.25rem', lineHeight: 1.08, letterSpacing: '-0.035em', marginBottom: '1.25rem' }}>
            Skills that matter,<br/>
            <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              verified & visible.
            </span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '420px' }}>
            UNMAPPED uses Gemini AI and the ESCO taxonomy to transform informal work experience into globally portable, employer-ready skill profiles.
          </p>

          <div className="stat-group" style={{ marginBottom: '2rem' }}>
            <div className="stat-item">
              <div className="stat-number">{workers.length > 0 ? workers.length : '∞'}</div>
              <div className="stat-label">Profiles</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">13.9k</div>
              <div className="stat-label">ESCO Skills</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">3k+</div>
              <div className="stat-label">Occupations</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
            <Link to="/browse" className="btn btn-dark btn-lg">
              <Users size={17} /> Browse Workers <ArrowRight size={15} />
            </Link>
            <Link to="/become-worker" className="btn btn-primary btn-lg">
              <Zap size={17} /> Become a Worker <ArrowRight size={15} />
            </Link>
          </div>
          <div style={{ marginTop: '0.65rem' }}>
            <Link to="/hiring" className="btn btn-outline btn-lg">
              <Briefcase size={17} /> We're Hiring <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>

        {/* Right — Network Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15 }}
          style={{ flex: 1, height: '520px', position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
        >
          <NetworkCanvas />

          {/* Floating tags */}
          {SKILL_TAGS.map((tag, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.15 }}
              style={{
                position: 'absolute',
                top: tag.top, left: tag.left, right: tag.right, bottom: tag.bottom,
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                boxShadow: 'var(--shadow)',
                animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                zIndex: 2,
              }}
            >
              {tag.label}
            </motion.div>
          ))}

          {/* Gradient overlays for edge blending */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--bg-secondary) 0%, transparent 15%, transparent 85%, var(--bg-secondary) 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, var(--bg-secondary) 0%, transparent 15%, transparent 85%, var(--bg-secondary) 100%)', pointerEvents: 'none' }} />
        </motion.div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '5rem 4rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>HOW IT WORKS</span>
            <h2 style={{ fontSize: '2.25rem', letterSpacing: '-0.02em' }}>From informal skills to global recognition</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '560px', margin: '0.75rem auto 0' }}>Three modules work together to map, assess, and match your skills to real opportunities.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[
              { icon: <Globe2 size={26} />, num: '01', title: 'Skills Signal Engine', desc: 'Gemini AI reads your work history and maps it to 13,939 ESCO-anchored skills with confidence scores.', color: 'var(--primary)' },
              { icon: <Shield size={26} />, num: '02', title: 'AI Readiness Lens', desc: 'Automation risk calibrated for your local economy — wages, infrastructure, and digital adoption factored in.', color: 'var(--warning)' },
              { icon: <BarChart3 size={26} />, num: '03', title: 'Opportunity Matching', desc: 'Live signals from ILOSTAT & World Bank surface sector growth, wage premiums, and reachable opportunities.', color: 'var(--success)' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                viewport={{ once: true }}
                className="card"
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: '-10px', right: '-5px', fontSize: '5rem', fontWeight: 800, opacity: 0.04, fontFamily: 'Outfit', lineHeight: 1 }}>{item.num}</div>
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${item.color}15`, color: item.color, marginBottom: '1.25rem' }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.6rem' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.65 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '4rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            maxWidth: '800px', margin: '0 auto', textAlign: 'center',
            padding: '3rem', borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, var(--primary), #4f46e5)',
            color: 'white', position: 'relative', overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', position: 'relative' }}>Ready to put your skills on the map?</h2>
          <p style={{ opacity: 0.85, marginBottom: '1.75rem', position: 'relative' }}>Join workers from 40+ countries who have built their ESCO-verified portable skills profile.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', position: 'relative' }}>
            <Link to="/become-worker" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary)', fontWeight: 700 }}>
              <Zap size={17} /> Get Started Free
            </Link>
            <Link to="/browse" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
              Browse Talent
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '2rem 4rem', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        &copy; 2025 UNMAPPED Protocol · Composable Skills Infrastructure · Calibrated for Global Labor Resilience
      </footer>
    </div>
  );
}
