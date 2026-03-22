'use client';

import { useRouter } from 'next/navigation';
import { Zap, Target, Flame } from 'lucide-react';

const levels = [
  {
    key: 'easy',
    label: 'Easy',
    icon: <Zap size={40} />,
    tagline: 'Beginner Friendly',
    description: 'Surface-level conceptual questions about your listed skills. Great for first-timers or freshers brushing up basics.',
    color: 'var(--success)',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.35)',
  },
  {
    key: 'medium',
    label: 'Medium',
    icon: <Target size={40} />,
    tagline: 'Industry Standard',
    description: 'Practical questions that dig into real-world usage of your resume skills. Mirrors a typical campus placement or internship interview.',
    color: 'var(--warning)',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.35)',
  },
  {
    key: 'hard',
    label: 'Hard',
    icon: <Flame size={40} />,
    tagline: 'Senior-Level Challenge',
    description: 'Deep architectural, system-design and edge-case questions. Expect to justify every decision at a principal engineer level.',
    color: 'var(--danger)',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.35)',
  },
];

export default function DifficultyPage() {
  const router = useRouter();

  const handleSelect = (level: string) => {
    sessionStorage.setItem('difficulty', level);
    router.push('/interview');
  };

  return (
    <div className="container flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }} className="fade-in">
        <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}>
          Choose Your <span className="text-gradient">Difficulty</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Select the challenge level that matches your current confidence.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', width: '100%', maxWidth: '960px' }}>
        {levels.map((lvl, idx) => (
          <button
            key={lvl.key}
            onClick={() => handleSelect(lvl.key)}
            className="fade-in"
            style={{
              background: lvl.bg,
              border: `2px solid ${lvl.border}`,
              borderRadius: '20px',
              padding: '2.5rem 2rem',
              cursor: 'pointer',
              textAlign: 'center',
              color: 'white',
              transition: 'transform 0.2s, box-shadow 0.2s',
              animationDelay: `${idx * 0.15}s`,
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 40px ${lvl.border}`;
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <div style={{ color: lvl.color, marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>{lvl.icon}</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.3rem', color: lvl.color }}>{lvl.label}</h2>
            <p style={{ fontSize: '0.85rem', color: lvl.color, opacity: 0.8, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>{lvl.tagline}</p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>{lvl.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
