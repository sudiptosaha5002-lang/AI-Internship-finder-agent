'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Send, MicOff, Clock, Volume2 } from 'lucide-react';

export default function InterviewRoom() {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [timeLeft, setTimeLeft] = useState(240); // 4 minutes
  const [loading, setLoading] = useState(true);
  const [testOutput, setTestOutput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    // Initialize SpeechRecognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true; // Show words as they speak
        
        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscriptRef.current += event.results[i][0].transcript + ' ';
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          // Display the locked-in text plus whatever they are currently saying
          setResponseText(finalTranscriptRef.current + interimTranscript);
        };

        // Auto-restart if it stops but we are still recording
        recognitionRef.current.onend = () => {
          setIsRecording((prevRecording) => {
            if (prevRecording) {
              try {
                recognitionRef.current.start();
              } catch (e) {}
            }
            return prevRecording;
          });
        };
      }
    }
    
    const fetchQuestions = async () => {
      const skillsStr = sessionStorage.getItem('skills');
      const role = sessionStorage.getItem('role') || 'Candidate';
      const difficulty = sessionStorage.getItem('difficulty') || 'medium';
      const skills = skillsStr ? JSON.parse(skillsStr) : ['JavaScript', 'React'];

      try {
        const res = await fetch('/api/interview/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, skills, difficulty })
        });
        const data = await res.json();
        setQuestions(data.questions || []);
        
        // Speak the first question
        if (data.questions && data.questions.length > 0) {
          speakQuestion(data.questions[0].text);
          setQuestionStartTime(Date.now());
        }
      } catch (err) {
        console.error('Failed to load questions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
    
    // Cleanup speech synthesis on unmount
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakQuestion = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Make voice more relaxed
      utterance.rate = 0.85; 
      utterance.pitch = 0.95; 
      
      const voices = window.speechSynthesis.getVoices();
      // Try to find a premium/natural English voice
      const preferredVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural')) && v.lang.includes('en'));
      if (preferredVoice) utterance.voice = preferredVoice;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stateRef = useRef({ currentIndex, responseText, evaluations, questions, questionStartTime });
  useEffect(() => {
    stateRef.current = { currentIndex, responseText, evaluations, questions, questionStartTime };
  }, [currentIndex, responseText, evaluations, questions, questionStartTime]);

  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          autoSubmitRemaining(stateRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading]);

  const autoSubmitRemaining = async (latestState: any) => {
    const { currentIndex, responseText, evaluations, questions, questionStartTime } = latestState;
    if (questions.length === 0) return handleFinish(evaluations);

    setLoading(true); // Show loading screen while processing the pending questions
    
    const pendingQuestions: { question: any; response: string; timeTaken: number }[] = [];
    for (let i = currentIndex; i < questions.length; i++) {
        pendingQuestions.push({
            question: questions[i],
            response: i === currentIndex ? responseText : "",
            timeTaken: i === currentIndex ? Math.round((Date.now() - questionStartTime) / 1000) : 0
        });
    }

    try {
        const evalPromises = pendingQuestions.map(pq => 
            fetch('/api/interview/evaluate-response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: pq.question.text, response: pq.response })
            }).then(res => res.json())
        );

        const results = await Promise.all(evalPromises);
        
        const finalEvals = [...evaluations];
        results.forEach((data, idx) => {
            finalEvals.push({
                question: pendingQuestions[idx].question,
                response: pendingQuestions[idx].response,
                timeTaken: pendingQuestions[idx].timeTaken,
                evaluation: data.evaluation
            });
        });

        handleFinish(finalEvals);
    } catch (err) {
        console.error(err);
        handleFinish(evaluations); // Fallback
    }
  };

  const handleSubmitAnswer = async () => {
    if (!responseText.trim()) return;
    
    // Evaluate response real-time
    const currentQ = questions[currentIndex];
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000); // Compute seconds taken

    // If it's a coding question with terminal output, append it to the response for the evaluator to grade!
    const finalResponse = testOutput ? `${responseText}\n\n### VIRTUAL COMPILER RESULTS ###\n${testOutput}` : responseText;

    try {
      const res = await fetch('/api/interview/evaluate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQ.text, response: finalResponse })
      });
      const data = await res.json();
      
      const newEvals = [...evaluations, { question: currentQ, response: finalResponse, timeTaken, evaluation: data.evaluation }];
      setEvaluations(newEvals);
      
      setResponseText('');
      setTestOutput('');
      finalTranscriptRef.current = '';
      
      if (currentIndex < questions.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        speakQuestion(questions[nextIndex].text); // Speak the new question
        setQuestionStartTime(Date.now()); // reset timer for next question
      } else {
        handleFinish(newEvals);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunCode = async () => {
    if (!responseText.trim()) return;
    setIsTesting(true);
    setTestOutput('Compiling and running against hidden test cases...\n');
    try {
      const res = await fetch('/api/interview/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questions[currentIndex].text, code: responseText })
      });
      const data = await res.json();
      setTestOutput(data.output || 'No output received.');
    } catch (err) {
      setTestOutput(`[Error] Failed to execute code: ${err}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleFinish = (finalEvals = evaluations) => {
    if (finalEvals.length > 0) {
      sessionStorage.setItem('evaluations', JSON.stringify(finalEvals));
      
      // Save globally for History feature
      let history = [];
      try { history = JSON.parse(localStorage.getItem('interviewHistory') || '[]'); } catch (e) {}
      
      let totalScore = 0;
      finalEvals.forEach((curr: any) => totalScore += curr.evaluation.score);
      const avgScore = Math.round(totalScore / finalEvals.length);
      const role = sessionStorage.getItem('role') || 'Candidate';
      
      history.unshift({
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        role: role,
        score: avgScore,
        questionsAnswered: finalEvals.length
      });
      localStorage.setItem('interviewHistory', JSON.stringify(history));
    }
    router.push('/dashboard');
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    const isInitialLoading = questions.length === 0;
    
    return (
      <div className="container flex-center min-h-screen">
        <div className="text-xl" style={{ textAlign: 'center' }}>
          {isInitialLoading ? (
            <>
              <h2 className="pulse" style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--primary)' }}>Analyzing Context...</h2>
              <p>Generating personalized FAANG-level questions based on your resume skills...</p>
            </>
          ) : (
            <>
              <h2 className="pulse" style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--accent)' }}>Time's Up!</h2>
              <p>Auto-submitting pending questions and generating your final Marksheet...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '100vh', paddingTop: '4rem' }}>
      
      <div className="flex-center" style={{ justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Mock Interview in Progress</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => handleFinish()} 
            style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            End Early
          </button>
          <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', color: timeLeft < 60 ? 'var(--danger)' : 'white' }}>
            <Clock /> <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '3rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
          {questions.map((_, idx) => (
            <div key={idx} style={{ flex: 1, height: '6px', borderRadius: '3px', background: idx < currentIndex ? 'var(--success)' : idx === currentIndex ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        <div style={{ flex: 1 }}>
          {questions[currentIndex] ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'inline-block', padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', fontSize: '0.8rem', color: 'var(--accent)' }}>
                  {questions[currentIndex].type} Question
                </div>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => speakQuestion(questions[currentIndex].text)}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Volume2 size={16} /> Replay Question
                </button>
              </div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 500, lineHeight: 1.3, marginBottom: '2rem' }}>
                {questions[currentIndex].text}
              </h2>
            </>
          ) : (
             <h2>Preparing...</h2>
          )}
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.3)' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
            {questions[currentIndex]?.type === 'Coding' ? 'Your Code Solution (Use Tab to Indent)' : 'Your Answer'}
          </h3>
          <textarea 
            className="glass-input" 
            rows={questions[currentIndex]?.type === 'Coding' ? 12 : 5} 
            value={responseText}
            onChange={(e) => {
              setResponseText(e.target.value);
              // Keep the ref in sync if they manually type to correct the AI
              finalTranscriptRef.current = e.target.value;
            }}
            onKeyDown={(e) => {
              const isCoding = questions[currentIndex]?.type === 'Coding';
              if (isCoding && e.key === 'Tab') {
                e.preventDefault();
                const target = e.target as HTMLTextAreaElement;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                const val = target.value;
                const newVal = val.substring(0, start) + '  ' + val.substring(end);
                setResponseText(newVal);
                finalTranscriptRef.current = newVal;
                setTimeout(() => {
                  target.selectionStart = target.selectionEnd = start + 2;
                }, 0);
              } else if (!isCoding && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitAnswer();
              }
            }}
            placeholder={questions[currentIndex]?.type === 'Coding' ? "def solution():\n  # Write your code here" : "Type your answer here or press Enter to submit..."}
            style={{ 
              marginBottom: '1rem', 
              background: questions[currentIndex]?.type === 'Coding' ? 'rgba(10, 15, 30, 0.8)' : 'transparent', 
              border: questions[currentIndex]?.type === 'Coding' ? '1px solid #334155' : 'none',
              borderBottom: questions[currentIndex]?.type !== 'Coding' ? '1px solid var(--glass-border)' : undefined, 
              borderRadius: questions[currentIndex]?.type === 'Coding' ? '8px' : 0, 
              resize: 'vertical',
              fontFamily: questions[currentIndex]?.type === 'Coding' ? '"Fira Code", monospace, "Courier New"' : 'inherit',
              color: questions[currentIndex]?.type === 'Coding' ? '#60a5fa' : 'inherit',
              padding: questions[currentIndex]?.type === 'Coding' ? '1rem' : '0',
            }}
          />
          
          {questions[currentIndex]?.type === 'Coding' && testOutput && (
            <div style={{ marginBottom: '1rem', background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Terminal Output</div>
              <pre style={{ margin: 0, color: testOutput.includes('FAIL') ? '#ef4444' : '#10b981', fontFamily: '"Fira Code", monospace', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                {testOutput}
              </pre>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              className={`btn ${isRecording ? 'btn-danger' : 'btn-secondary'}`} 
              onClick={() => {
                if (!isRecording && recognitionRef.current) {
                  recognitionRef.current.start();
                  setIsRecording(true);
                } else if (isRecording && recognitionRef.current) {
                  recognitionRef.current.stop();
                  setIsRecording(false);
                }
              }}
              title={recognitionRef.current ? "Click to record" : "Speech Recognition not supported in this browser"}
              disabled={!recognitionRef.current}
            >
              {isRecording ? <MicOff /> : <Mic />} {isRecording ? 'Listening...' : 'Record Voice'}
            </button>
            <div>
              {questions[currentIndex]?.type === 'Coding' && (
                <button 
                  className="btn" 
                  onClick={handleRunCode} 
                  disabled={!responseText.trim() || isTesting}
                  style={{ marginRight: '1rem', background: 'var(--accent)', color: 'black', fontWeight: 600 }}
                >
                  {isTesting ? 'Running...' : 'Run & Test Code'}
                </button>
              )}
              <button className="btn btn-primary" onClick={handleSubmitAnswer} disabled={!responseText.trim() || isTesting}>
                Submit Answer <Send size={18} />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
