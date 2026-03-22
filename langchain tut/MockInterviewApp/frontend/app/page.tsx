'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mic, Brain, BarChart3, Upload, FileText } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Profile Form States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState({
    fullName: '', email: '', dob: '', fathersName: '', bloodGroup: '', country: '', 
    skills: '', universityName: '', id: '', courseOfDegree: '', gradYear: '', 
    postGradYear: '', certifications: ''
  });

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const startInterviewFlow = async () => {
    if (!file) {
      // If no file, proceed with defaults
      router.push('/difficulty');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/interview/upload-resume', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.skills && data.skills.length > 0) {
        sessionStorage.setItem('skills', JSON.stringify(data.skills));
        sessionStorage.setItem('role', data.role || 'Software Engineer');
        sessionStorage.setItem('parsedText', data.parsedText || '');
        router.push('/difficulty');
      } else {
        alert(data.error || 'Failed to extract skills. The interview might not be personalized.');
        router.push('/difficulty'); // fail safe
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to the backend. Is the Flask server running?');
      setUploading(false);
    }
  };

  const handleProfileResumeAutoFill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const autoFile = e.target.files?.[0];
    if (!autoFile) return;
    
    setProfileLoading(true);
    const formData = new FormData();
    formData.append('resume', autoFile);

    try {
      const res = await fetch('/api/interview/profile/extract', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(prev => ({ ...prev, ...data.profile }));
        alert('Profile auto-filled successfully from Resume AI OCR!');
      } else {
        alert(data.error || 'Failed to extract profile data.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to AI Resume parser.');
    } finally {
      setProfileLoading(false);
    }
  };

  const saveProfile = () => {
    sessionStorage.setItem('userProfile', JSON.stringify(profile));
    setIsProfileModalOpen(false);
    alert('Profile saved securely.');
  };

  return (
    <div className="container flex-center" style={{ minHeight: '100vh', flexDirection: 'column', position: 'relative' }}>
      
      {/* Absolute Header for Login/Profile */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button 
          className="btn btn-secondary" 
          style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid var(--accent)', color: 'white' }}
          onClick={() => setIsProfileModalOpen(true)}
        >
          ✍️ Complete Profile
        </button>
      </div>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }} className="fade-in">
        <h1 style={{ fontSize: '3.5rem', fontWeight: 700, marginBottom: '1rem' }}>
          AI Mock <span className="text-gradient">Interview</span> Pro
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Simulate real-world tech interviews, get evaluated instantly, and accelerate your career prep using AI.
        </p>
      </header>

      <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '700px', padding: '3rem', animationDelay: '0.2s' }}>

        {/* Feature highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="glass-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <Mic size={32} color="var(--accent)" style={{ margin: '0 auto 0.8rem' }} />
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.3rem' }}>Voice Interview</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Speak your answers naturally</p>
          </div>
          <div className="glass-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <Brain size={32} color="var(--accent)" style={{ margin: '0 auto 0.8rem' }} />
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.3rem' }}>AI Evaluation</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Instant scoring & feedback</p>
          </div>
          <div className="glass-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <BarChart3 size={32} color="var(--accent)" style={{ margin: '0 auto 0.8rem' }} />
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.3rem' }}>Skill-Based</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Questions from your resume</p>
          </div>
        </div>

        {/* Resume Dropzone */}
        <div 
          className="glass-card"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragOver ? '2px dashed var(--accent)' : '2px dashed var(--glass-border)',
            background: isDragOver ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0,0,0,0.2)',
            padding: '2.5rem 1rem',
            textAlign: 'center',
            marginBottom: '2rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {file ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                <FileText size={40} color="var(--success)" />
              </div>
              <div>
                <h4 style={{ color: 'white', marginBottom: '0.3rem' }}>{file.name}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ready for analysis</p>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
              >
                Remove File
              </button>
            </div>
          ) : (
            <>
              <Upload size={48} color={isDragOver ? "var(--accent)" : "var(--text-secondary)"} style={{ margin: '0 auto 1.5rem', opacity: isDragOver ? 1 : 0.6 }} />
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: isDragOver ? 'white' : 'var(--text-secondary)' }}>
                Drag & drop your resume here
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                or
              </p>
              <label 
                className="btn btn-secondary" 
                style={{ cursor: 'pointer', display: 'inline-block', border: '1px solid var(--glass-border)' }}
                onClick={(e) => e.stopPropagation()}
              >
                Browse Files
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                />
              </label>
              <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Supports PDF, DOC, DOCX. We use Advanced OCR for optimal skill extraction.
              </p>
            </>
          )}
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', marginBottom: '1rem' }}
          onClick={startInterviewFlow}
          disabled={uploading}
        >
          {uploading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
               Analyzing Resume... <span className="pulse">⏳</span>
            </span>
          ) : file ? (
            <>🎤 Start Personalized Practice Interview <ArrowRight /></>
          ) : (
             <>🎤 Skip Resume & Start General Interview <ArrowRight /></>
          )}
        </button>

        <button 
          className="btn btn-secondary" 
          style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', background: 'transparent', border: '1px solid var(--glass-border)' }}
          onClick={() => router.push('/history')}
        >
          View Past Interview History
        </button>

      </div>

      {/* PROFILE COMPLETION MODAL */}
      {isProfileModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel slide-up" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', position: 'relative' }}>
            <button 
              onClick={() => setIsProfileModalOpen(false)} 
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ✕
            </button>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 600 }}>Complete Your <span className="text-gradient">Profile</span></h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Fill in your details manually, or use our AI to auto-fill directly from your resume.</p>
            
            {/* AI AUTO FILL BOX */}
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--accent)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center' }}>
              <h4 style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Brain color="var(--accent)" size={20} /> AI Resume Auto-Fill
              </h4>
              {profileLoading ? (
                 <p style={{ color: 'var(--accent)' }} className="pulse">🤖 Scanning parsing algorithms...</p>
              ) : (
                <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                  Upload Resume to Auto-Fill
                  <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleProfileResumeAutoFill}/>
                </label>
              )}
            </div>

            {/* FORM GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div><label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Full Name</label><input className="glass-input" value={profile.fullName} onChange={(e) => setProfile({...profile, fullName: e.target.value})} /></div>
              <div><label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Email</label><input className="glass-input" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} /></div>
              
              <div><label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Date of Birth</label><input className="glass-input" value={profile.dob} onChange={(e) => setProfile({...profile, dob: e.target.value})} /></div>
              <div><label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Father's Name (Optional)</label><input className="glass-input" value={profile.fathersName} onChange={(e) => setProfile({...profile, fathersName: e.target.value})} /></div>
              
              <div><label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Blood Group</label><input className="glass-input" value={profile.bloodGroup} onChange={(e) => setProfile({...profile, bloodGroup: e.target.value})} /></div>
              <div><label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Country</label><input className="glass-input" value={profile.country} onChange={(e) => setProfile({...profile, country: e.target.value})} /></div>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Top Skills</label>
                <textarea className="glass-input" rows={2} value={profile.skills} onChange={(e) => setProfile({...profile, skills: e.target.value})} />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'white' }}>Educational Qualification</h3>
              </div>
              
              <div><label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>University Name</label><input className="glass-input" value={profile.universityName} onChange={(e) => setProfile({...profile, universityName: e.target.value})} /></div>
              <div><label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Student ID / Roll No</label><input className="glass-input" value={profile.id} onChange={(e) => setProfile({...profile, id: e.target.value})} /></div>
              
              <div><label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Course of Degree</label><input className="glass-input" value={profile.courseOfDegree} onChange={(e) => setProfile({...profile, courseOfDegree: e.target.value})} /></div>
              <div><label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Graduate Year</label><input className="glass-input" value={profile.gradYear} onChange={(e) => setProfile({...profile, gradYear: e.target.value})} /></div>
              
              <div><label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Post Graduate Year</label><input className="glass-input" value={profile.postGradYear} onChange={(e) => setProfile({...profile, postGradYear: e.target.value})} /></div>
              <div><label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Certifications</label><input className="glass-input" value={profile.certifications} onChange={(e) => setProfile({...profile, certifications: e.target.value})} /></div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }} onClick={saveProfile}>
              Save Profile Preferences
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
