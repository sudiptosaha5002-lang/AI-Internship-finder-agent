'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Trophy, Target, AlertTriangle, ArrowLeft, Download, Activity, Clock } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function Dashboard() {
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [averageScore, setAverageScore] = useState(0);
  const [averageConfidence, setAverageConfidence] = useState(0);
  const [averageTime, setAverageTime] = useState(0);
  const [userName, setUserName] = useState('Jane Doe');
  const [internships, setInternships] = useState<any[]>([]);

  useEffect(() => {
    const rawData = sessionStorage.getItem('evaluations');
    if (rawData) {
      const parsed = JSON.parse(rawData);
      setEvaluations(parsed);
      
      let totalScore = 0;
      let totalConf = 0;
      let totalTime = 0;
      
      parsed.forEach((curr: any) => {
        totalScore += curr.evaluation.score;
        totalConf += curr.evaluation.confidence || 0;
        totalTime += curr.timeTaken || 0;
      });
      
      const avgScore = Math.round(totalScore / parsed.length);
      setAverageScore(avgScore);
      setAverageConfidence(Math.round(totalConf / parsed.length) || 0);
      setAverageTime(Math.round(totalTime / parsed.length) || 0);

      // Fetch dynamic internship matcher
      fetch('/api/interview/internship-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: avgScore, skills: JSON.parse(sessionStorage.getItem('skills') || '[]') })
      })
      .then(res => res.json())
      .then(data => setInternships(data.internships || []))
      .catch(console.error);
    }
  }, []);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      // Capture full scroll height
      const canvas = await html2canvas(reportRef.current, { 
        scale: 2, 
        backgroundColor: '#0f172a',
        scrollY: -window.scrollY // Fixes viewport cutoff bug
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add subsequent pages if the content is longer than 1 A4 page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`AI_Interview_Report_${userName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("PDF Generation Failed", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (evaluations.length === 0) {
    return (
      <div className="container flex-center min-h-screen">
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>No interview data found.</h2>
          <button className="btn btn-primary mt-1" onClick={() => router.push('/')}>Go Back Home</button>
        </div>
      </div>
    );
  }

  // Verdict calculation
  const isReady = averageScore >= 75 && averageConfidence >= 50;

  // Transform data for Radar Chart
  const radarData = evaluations.map((e, idx) => ({
    subject: `Q${idx + 1} (${e.question.type})`,
    A: e.evaluation.accuracy,
    C: e.evaluation.clarity,
    fullMark: 100,
  }));

  // Bar Chart Data
  const barData = evaluations.map((e, idx) => ({
    name: `Q${idx + 1}`,
    score: e.evaluation.score
  }));

  return (
    <div className="container" style={{ paddingTop: '3rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 600 }}>Performance <span className="text-gradient">Analytics</span></h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            className="glass-input" 
            value={userName} 
            onChange={(e) => setUserName(e.target.value)} 
            placeholder="Enter your name for report..."
            style={{ width: '250px', padding: '0.6rem 1rem' }}
          />
          <button className="btn btn-primary" onClick={handleDownloadPDF}><Download size={18} /> Download Report</button>
          <button className="btn btn-secondary" onClick={() => router.push('/')}><ArrowLeft size={18} /> Home</button>
        </div>
      </div>

      <div ref={reportRef} style={{ background: 'var(--bg-dark)', padding: '2rem' }}>
        
        {/* PDF HEADER */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '2.2rem', color: 'white' }}>
            Official Marksheet: <span style={{ color: 'var(--accent)' }}>{userName}</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>AI Mock Interview Assessment</p>
        </div>

        {/* SUITABLE INTERNSHIPS MARKSHEET */}
        {internships.length > 0 && (
          <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '3rem', borderTop: '4px solid var(--accent)' }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Target color="var(--accent)" /> Internship Role Suitability
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Based exclusively on the skills parsed from your resume and authenticated by your spoken technical performance today, our AI evaluates your immediate hireability for the following roles:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {internships.map((internship, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 500 }}>{internship.role}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '250px' }}>
                    <div style={{ flex: 1, background: 'var(--bg-dark)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${internship.percentage}%`, height: '100%', 
                        background: internship.percentage >= 75 ? 'var(--success)' : internship.percentage >= 50 ? 'var(--warning)' : 'var(--danger)',
                        transition: 'width 1s ease-out'
                      }} />
                    </div>
                    <span style={{ fontWeight: 'bold', fontSize: '1.3rem', minWidth: '55px', textAlign: 'right', color: internship.percentage >= 75 ? 'var(--success)' : internship.percentage >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                      {internship.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* FINAL VERDICT BOX */}
        <div className="glass-card fade-in" style={{ 
          marginBottom: '3rem', 
          background: isReady ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
          borderLeft: `4px solid ${isReady ? 'var(--success)' : 'var(--warning)'}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2.5rem'
        }}>
          {isReady ? <Trophy size={48} color="var(--success)" style={{ marginBottom: '1rem' }} /> : <AlertTriangle size={48} color="var(--warning)" style={{ marginBottom: '1rem' }} />}
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: isReady ? 'var(--success)' : 'var(--warning)' }}>
            {isReady ? "Verdict: You are Ready for the Internship! 🎉" : "Verdict: Keep Practicing! 💪"}
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '1.5rem' }}>
            {isReady 
              ? "Your technical answers and vocal confidence meet the standard for real-world tech interviews. You demonstrated clear communication and solid domain knowledge." 
              : "You have a good foundation, but try to improve your technical vocabulary and reference specific tools to avoid being flagged as off-topic."}
          </p>
          
          {averageScore < 75 ? (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ background: 'var(--accent)', border: 'none', padding: '0.8rem 2rem', fontSize: '1.1rem' }}
                onClick={() => router.push('/career-path')}
              >
                Launch Career Path Simulator
              </button>
              {averageScore < 40 && (
                <button 
                  className="btn btn-secondary" 
                  style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '0.8rem 2rem', fontSize: '1.1rem' }}
                  onClick={() => router.push('/interview')}
                >
                  Retry Interview Now
                </button>
              )}
            </div>
          ) : (
            <button 
              className="btn btn-primary" 
              style={{ background: 'var(--success)', border: 'none', padding: '0.8rem 2rem', fontSize: '1.1rem' }}
              onClick={() => router.push('/career-path')}
            >
              Generate Next-Steps Roadmap
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '12px' }}>
              <Trophy size={32} color="var(--success)" />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)' }}>Overall Score</p>
              <h2 style={{ fontSize: '2rem' }}>{averageScore}%</h2>
            </div>
          </div>
          
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '1rem', borderRadius: '12px' }}>
              <Activity size={32} color="var(--accent)" />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)' }}>Voice Confidence</p>
              <h2 style={{ fontSize: '2rem' }}>{averageConfidence}%</h2>
            </div>
          </div>
          
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '12px' }}>
              <Target size={32} color="var(--danger)" />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)' }}>Questions Answered</p>
              <h2 style={{ fontSize: '2rem' }}>{evaluations.length}</h2>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(234, 179, 8, 0.2)', padding: '1rem', borderRadius: '12px' }}>
              <Clock size={32} color="#eab308" />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)' }}>Avg Response Time</p>
              <h2 style={{ fontSize: '2rem' }}>{averageTime}s</h2>
            </div>
          </div>
        </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>Accuracy vs Clarity (Radar)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'white' }} />
                <Radar name="Accuracy" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Radar name="Clarity" dataKey="C" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                <Tooltip contentStyle={{ background: 'var(--bg-dark)', border: '1px solid var(--glass-border)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>Score per Question (Bar)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis domain={[0, 100]} stroke="var(--text-secondary)" />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-dark)', border: '1px solid var(--glass-border)' }} />
                <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <AlertTriangle color="var(--warning)" /> Detailed Feedback & Tone Analysis
        </h3>
        {evaluations.map((e, idx) => (
          <div key={idx} className="glass-card" style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h4 style={{ fontWeight: 600 }}>Q{idx + 1}: {e.question.text}</h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className="tag" style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                   ⏱️ {e.timeTaken || 0}s
                </span>
                <span className="tag" style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                  Confidence: {e.evaluation.confidence || 0}%
                </span>
                <span className="tag" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                  Score: {e.evaluation.score}%
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontStyle: 'italic', fontSize: '0.9rem' }}>
                  "{e.response}"
                </p>
                <div style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '1rem' }}>
                  <p style={{ fontSize: '0.95rem' }}><strong>Technical Feedback:</strong> {e.evaluation.feedback}</p>
                </div>
              </div>
              <div style={{ flex: 1, borderLeft: '1px solid var(--glass-border)', paddingLeft: '1.5rem' }}>
                <p style={{ fontSize: '0.95rem', color: 'var(--warning)' }}><strong>Voice Tone Analysis:</strong> <br/>{e.evaluation.toneAnalysis || 'Tone confident.'}</p>
              </div>
            </div>
            
          </div>
        ))}
      </div>
      
      </div> 
      {/* End reportRef Wrapper */}

    </div>
  );
}
