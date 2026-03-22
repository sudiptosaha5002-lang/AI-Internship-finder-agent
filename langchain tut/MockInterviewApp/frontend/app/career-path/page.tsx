'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Map, Briefcase, GraduationCap, TrendingUp, Star } from 'lucide-react';

export default function CareerPathSimulator() {
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('Candidate');
  const [score, setScore] = useState(0);
  const [internships, setInternships] = useState<any[]>([]);

  useEffect(() => {
    const rawData = sessionStorage.getItem('evaluations');
    const storedRole = sessionStorage.getItem('role') || 'Software Engineer';
    const storedSkillsStr = sessionStorage.getItem('skills') || '[]';
    
    setRole(storedRole);

    if (rawData) {
      const parsed = JSON.parse(rawData);
      let totalScore = 0;
      parsed.forEach((curr: any) => totalScore += curr.evaluation.score);
      const avg = Math.round(totalScore / parsed.length);
      setScore(avg);

      // Fetch dynamic career path
      fetch('/api/interview/career-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: storedRole, score: avg, skills: JSON.parse(storedSkillsStr) })
      })
      .then(res => res.json())
      .then(data => {
        setRoadmap(data.roadmap);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

      // Fetch internship recommendations
      fetch('/api/interview/internship-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: avg, skills: JSON.parse(storedSkillsStr) })
      })
      .then(res => res.json())
      .then(data => setInternships(data.internships || []))
      .catch(console.error);
    } else {
      router.push('/');
    }
  }, [router]);

  if (loading) {
    return (
      <div className="container flex-center min-h-screen">
        <h2 className="pulse">Simulating your Career Trajectory...</h2>
      </div>
    );
  }

  const icons = [<GraduationCap size={24} key={1}/>, <Briefcase size={24} key={2}/>, <TrendingUp size={24} key={3}/>, <Star size={24} key={4}/>];

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 600 }}>Your Career <span className="text-gradient">Roadmap</span></h1>
        <button className="btn btn-secondary" onClick={() => router.push('/dashboard')}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
      </div>

      <div className="glass-panel fade-in" style={{ padding: '3rem', textAlign: 'center', marginBottom: '4rem', maxWidth: '800px', margin: '0 auto 4rem auto' }}>
        <Map size={48} color="var(--accent)" style={{ margin: '0 auto 1rem' }} />
        <h2>Path to becoming a <span style={{ color: 'var(--success)' }}>{role}</span></h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '1rem auto 0' }}>
          Based on your interview score of <strong>{score}%</strong>, our AI has generated a customized progression simulator to bridge the gap between your current skills and your ultimate dream job.
        </p>

        {internships.length > 0 && (
          <div style={{ marginTop: '2.5rem', textAlign: 'left', borderTop: '1px solid var(--glass-border)', paddingTop: '2.5rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: 'var(--accent)', textAlign: 'center' }}>✅ You Can Apply For</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {internships.map((internship, idx) => {
                const pct = internship.percentage;
                const color = pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
                const bg   = pct >= 75 ? 'rgba(16,185,129,0.08)' : pct >= 50 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';
                return (
                  <div key={idx} className="fade-in" style={{ background: bg, border: `1px solid ${color}30`, borderRadius: '14px', padding: '1.2rem 1.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animationDelay: `${idx * 0.1}s` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.3rem', color }}>→</span>
                      <span style={{ fontSize: '1.05rem', color: 'white', fontWeight: 500 }}>{internship.role}</span>
                    </div>
                    <span style={{ background: color, color: '#000', fontWeight: 700, fontSize: '1rem', padding: '0.3rem 0.9rem', borderRadius: '20px', minWidth: '58px', textAlign: 'center' }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="timeline-container" style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
        {/* Vertical Line */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50px', width: '4px', background: 'var(--glass-border)', zIndex: 0 }} />

        {roadmap.map((step, idx) => (
          <div key={idx} className="fade-in" style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', position: 'relative', zIndex: 1, animationDelay: `${idx * 0.2}s` }}>
            <div style={{ 
              minWidth: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-dark)', 
              border: '4px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', marginTop: '0.5rem'
            }}>
              {icons[idx % icons.length]}
            </div>
            
            <div className="glass-card" style={{ flex: 1, padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.4rem', color: 'white' }}>{step.title}</h3>
                <span className="tag" style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent)' }}>{step.timeframe}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step.description}</p>
              
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--glass-border)' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--success)', marginBottom: '0.5rem' }}>Action Items:</h4>
                <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
                  {step.actionItems.map((item: string, i: number) => (
                    <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
