'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, History, Calendar, CheckCircle, BarChart2 } from 'lucide-react';

export default function InterviewHistory() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('interviewHistory');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return null;

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem', minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <History size={36} color="var(--accent)" /> 
          Past <span className="text-gradient">Interviews</span>
        </h1>
        <button className="btn btn-secondary" onClick={() => router.push('/')}>
          <ArrowLeft size={18} /> Back Home
        </button>
      </div>

      {history.length === 0 ? (
        <div className="glass-panel flex-center" style={{ padding: '4rem', flexDirection: 'column', textAlign: 'center' }}>
          <BarChart2 size={64} color="var(--text-secondary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>No interviews recorded yet.</h2>
          <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>Take your first AI mock interview to see your history and growth!</p>
          <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => router.push('/')}>Start Interview</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {history.map((session, idx) => (
            <div key={session.id || idx} className="glass-card fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', animationDelay: `${idx * 0.1}s` }}>
              
              <div>
                <h3 style={{ fontSize: '1.3rem', color: 'white', marginBottom: '0.5rem' }}>{session.role}</h3>
                <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> {session.date} at {session.time}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle size={14} /> {session.questionsAnswered} / 10 Questions</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Score</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: session.score >= 75 ? 'var(--success)' : session.score >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
                    {session.score}%
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
