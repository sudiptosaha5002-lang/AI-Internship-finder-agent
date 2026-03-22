import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Dummy Mock AI since we don't have an active OpenAI API key
export const mockGenerateQuestions = (role, skills, difficulty = 'medium') => {
  // Ensure we have enough skills to cycle through, fallback to defaults
  const pool = skills && skills.length > 0 ? skills : ['your core technologies', 'modern frameworks', 'design patterns', 'system architecture', 'debugging', 'testing methodologies'];

  // ── ROUND 1: Resume-Specific templates keyed by difficulty ──
  const easyResumeTemplates = [
    (skill) => ({ text: `What is ${skill} and why did you add it to your resume?`, type: `Round 1 [Easy]: Resume Basics (${skill})` }),
    (skill) => ({ text: `Can you give a simple definition of ${skill} in your own words?`, type: `Round 1 [Easy]: Resume Basics (${skill})` }),
    (skill) => ({ text: `What is one thing you like and one thing you dislike about ${skill}?`, type: `Round 1 [Easy]: Resume Basics (${skill})` }),
    (skill) => ({ text: `Have you ever used ${skill} in a personal project? Briefly describe it.`, type: `Round 1 [Easy]: Resume Basics (${skill})` }),
    (skill) => ({ text: `Where did you first learn ${skill} — a course, tutorial, or self-study?`, type: `Round 1 [Easy]: Resume Basics (${skill})` }),
  ];
  const mediumResumeTemplates = [
    (skill) => ({ text: `I noticed ${skill} heavily featured on your uploaded data. What was the most complex feature you built using it?`, type: `Round 1 [Medium]: Resume Deep Dive (${skill})` }),
    (skill) => ({ text: `Your resume highlights experience with ${skill}. Walk me through your standard workflow with it.`, type: `Round 1 [Medium]: Resume Deep Dive (${skill})` }),
    (skill) => ({ text: `Based on your resume, you've used ${skill} extensively. Why did you choose it over open-source alternatives?`, type: `Round 1 [Medium]: Resume Deep Dive (${skill})` }),
    (skill) => ({ text: `Describe a specific time you had to debug a critical issue directly related to ${skill}.`, type: `Round 1 [Medium]: Resume Deep Dive (${skill})` }),
    (skill) => ({ text: `How has your architectural understanding of ${skill} evolved across the projects on your resume?`, type: `Round 1 [Medium]: Resume Deep Dive (${skill})` }),
  ];
  const hardResumeTemplates = [
    (skill) => ({ text: `Looking at your resume usage of ${skill}: describe the hardest concurrency, memory-safety, or race-condition bug you've ever traced inside it.`, type: `Round 1 [Hard]: Resume Expert (${skill})` }),
    (skill) => ({ text: `Compare and contrast the internal runtime design of ${skill} against at least two production-grade alternatives, citing specific trade-offs.`, type: `Round 1 [Hard]: Resume Expert (${skill})` }),
    (skill) => ({ text: `If you were tasked with replacing ${skill} in your most complex resume project with zero downtime, what migration strategy would you implement?`, type: `Round 1 [Hard]: Resume Expert (${skill})` }),
    (skill) => ({ text: `What undocumented edge-case or hidden footgun in ${skill} have you personally discovered in production that most engineers miss?`, type: `Round 1 [Hard]: Resume Expert (${skill})` }),
    (skill) => ({ text: `Walk me through how you would benchmark and profile ${skill} under 10x peak load in a distributed cloud system.`, type: `Round 1 [Hard]: Resume Expert (${skill})` }),
  ];

  // ── ROUND 2: Role-Concept templates keyed by difficulty ──
  const easyRoleTemplates = [
    (role) => ({ text: `What does a typical day look like for a ${role}?`, type: `Round 2 [Easy]: Role Concepts (${role})` }),
    (role) => ({ text: `Name three key skills you believe every ${role} should have.`, type: `Round 2 [Easy]: Role Concepts (${role})` }),
    (role) => ({ text: `What is one technology trend a ${role} should be aware of in 2024?`, type: `Round 2 [Easy]: Role Concepts (${role})` }),
    (role) => ({ text: `Why did you choose to pursue the ${role} career path?`, type: `Round 2 [Easy]: Role Concepts (${role})` }),
    (role) => ({ text: `What is the most important soft skill for a ${role} and why?`, type: `Round 2 [Easy]: Role Concepts (${role})` }),
  ];
  const mediumRoleTemplates = [
    (role) => ({ text: `As a ${role}, what fundamental design patterns do you consider essential for scalable architecture?`, type: `Round 2 [Medium]: Role Concepts (${role})` }),
    (role) => ({ text: `What are the most dangerous performance bottlenecks a ${role} faces in 2024, and how do you mitigate them?`, type: `Round 2 [Medium]: Role Concepts (${role})` }),
    (role) => ({ text: `Describe a scenario where a ${role} should intentionally accumulate technical debt.`, type: `Round 2 [Medium]: Role Concepts (${role})` }),
    (role) => ({ text: `How do you stay updated with the rapidly changing ecosystem surrounding the ${role} position?`, type: `Round 2 [Medium]: Role Concepts (${role})` }),
    (role) => ({ text: `Walk me through your system-design approach when bootstrapping a high-stakes ${role} project from scratch.`, type: `Round 2 [Medium]: Role Concepts (${role})` }),
  ];
  const hardRoleTemplates = [
    (role) => ({ text: `Design a globally distributed, fault-tolerant system a ${role} would architect — including sharding, consensus, and failover strategies.`, type: `Round 2 [Hard]: Role Architecture (${role})` }),
    (role) => ({ text: `As a principal ${role}, how do you structurally prevent entire classes of security vulnerabilities at the compiler or framework layer?`, type: `Round 2 [Hard]: Role Architecture (${role})` }),
    (role) => ({ text: `Walk me through a zero-downtime migration strategy from a monolith to event-driven microservices as a senior ${role}.`, type: `Round 2 [Hard]: Role Architecture (${role})` }),
    (role) => ({ text: `How do you measure and enforce system observability (tracing, logging, alerting) across a multi-region ${role} platform?`, type: `Round 2 [Hard]: Role Architecture (${role})` }),
    (role) => ({ text: `What is the single hardest architectural paradigm shift you've had to make to excel as a modern ${role}?`, type: `Round 2 [Hard]: Role Architecture (${role})` }),
  ];

  const resumeMap = { easy: easyResumeTemplates, medium: mediumResumeTemplates, hard: hardResumeTemplates };
  const roleMap   = { easy: easyRoleTemplates,   medium: mediumRoleTemplates,   hard: hardRoleTemplates   };

  const chosenResumeTemplates = resumeMap[difficulty] || mediumResumeTemplates;
  const chosenRoleTemplates   = roleMap[difficulty]   || mediumRoleTemplates;

  let round1Questions = [];
  pool.forEach(skill => {
    chosenResumeTemplates.forEach(templateFunc => {
      round1Questions.push(templateFunc(skill));
    });
  });
  round1Questions.sort(() => Math.random() - 0.5);
  const selectedRound1 = round1Questions.slice(0, 5);

  let round2Questions = [];
  chosenRoleTemplates.forEach(templateFunc => {
    round2Questions.push(templateFunc(role));
  });
  round2Questions.sort(() => Math.random() - 0.5);
  const selectedRound2 = round2Questions.slice(0, 5);

  return [...selectedRound1, ...selectedRound2];
};

export const mockEvaluateResponse = (question, response) => {
  const words = response.split(/\s+/).filter(w => w.trim().length > 0).length;
  
  // 1. Catches empty or extremely short/blank answers
  if (words < 5) {
     return {
       score: 0,
       feedback: "Your answer was blank or far too short to be evaluated. In a real interview, always provide a detailed technical explanation.",
       accuracy: 0,
       clarity: 0,
       confidence: 0,
       toneAnalysis: "No significant audio or text detected."
     };
  }

  // 2. Analyze Hesitations and Tone
  const hesitations = (response.match(/(um|uh|like|you know|sort of|basically)/gi) || []).length;
  let confidenceScore = 95 - (hesitations * 15);
  confidenceScore = Math.max(0, confidenceScore);
  const toneMsg = hesitations === 0 ? "Tone was confident and steady." : "Significant hesitations detected (e.g., 'um', 'uh'). Practice pausing silently instead.";

  // 3. Extract the target technical skill from the question
  let targetSkill = "";
  const targetSkillMatch = question.match(/knowledge of (.*?) in/i) || question.match(/working with (.*?),/i) || question.match(/strategy around (.*?)\?/i);
  if (targetSkillMatch && targetSkillMatch[1]) {
    targetSkill = targetSkillMatch[1].toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // 4. Semantic Relevance Check
  let isRelevant = false;
  const resWords = response.toLowerCase();
  if (targetSkill && resWords.includes(targetSkill)) {
    isRelevant = true; // User specifically mentioned the topic!
  }
  
  const techKeywords = /(api|database|system|component|test|deploy|design|code|framework|architecture|problem|solution|function|class|variable|implement|scale|server|client|front|back|end|data)/gi;
  const keywordHits = (response.match(techKeywords) || []).length;
  if (keywordHits >= 2) isRelevant = true; // User used general good tech terminology

  // 5. Final Strict Scoring
  let score, textFeedback;

  if (!isRelevant) {
    score = 25;
    textFeedback = "Your response was completely off-topic or irrelevant. You did not directly address the core technical concept of the question. Make sure you stay on topic and reference the specific tools mentioned.";
  } else {
    score = words > 20 ? 80 : Math.max(40, words * 2); 
    score += (keywordHits * 2); // Boost score for good keywords
    score = Math.min(100, score);
    
    if (words > 20 && keywordHits >= 2) {
      textFeedback = "Excellent content! You effectively utilized technical terminology and provided a structured, accurate answer on-topic.";
    } else if (words > 20) {
      textFeedback = "Good length, but try to incorporate more specific technical keywords related to the task to demonstrate deeper expertise.";
    } else {
      textFeedback = "Your answer was relevant but a bit brief. Next time, use the STAR format (Situation, Task, Action, Result) to provide more technical detail.";
    }
  }
  
  return {
    score,
    feedback: textFeedback,
    accuracy: isRelevant ? Math.min(100, score + 10) : 10,
    clarity: Math.min(100, score + 5),
    confidence: confidenceScore,
    toneAnalysis: toneMsg
  };
};

export const parseResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No resume uploaded' });
    const data = await pdfParse(req.file.buffer);
    const text = data.text;
    
    // Dynamic NLP-style Keyword Extraction
    const stopWords = new Set(['about', 'after', 'all', 'also', 'am', 'an', 'and', 'another', 'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'between', 'both', 'but', 'by', 'came', 'can', 'come', 'could', 'did', 'do', 'each', 'for', 'from', 'get', 'got', 'has', 'had', 'he', 'have', 'her', 'here', 'him', 'himself', 'his', 'how', 'if', 'in', 'into', 'is', 'it', 'its', 'it\'s', 'like', 'make', 'many', 'me', 'might', 'more', 'most', 'much', 'must', 'my', 'never', 'now', 'of', 'on', 'only', 'or', 'other', 'our', 'out', 'over', 'said', 'same', 'see', 'should', 'since', 'some', 'still', 'such', 'take', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'up', 'very', 'was', 'way', 'we', 'well', 'were', 'what', 'where', 'which', 'while', 'who', 'with', 'would', 'you', 'your', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'development', 'experience', 'project', 'projects', 'using', 'used', 'worked', 'working', 'skills', 'education', 'university', 'college', 'degree', 'bachelor', 'master', 'years', 'months', 'designed', 'developed', 'created', 'implemented', 'managed', 'led', 'team', 'business', 'application', 'system', 'software', 'data', 'user']);
    
    // Clean text, remove punctuation, numbers, split to words
    const words = text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/);
    
    const wordFreq = {};
    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // Sort by frequency
    const sortedWords = Object.keys(wordFreq).sort((a, b) => wordFreq[b] - wordFreq[a]);
    
    // Top 10 words as 'skills'
    const uniqueSkills = sortedWords.slice(0, 10).map(w => w.charAt(0).toUpperCase() + w.slice(1));
    
    // Fallback if resume is empty
    if (uniqueSkills.length === 0) uniqueSkills.push('Communication', 'Problem Solving', 'Leadership');
    
    // Auto-infer candidate role based on skills
    let inferredRole = "Software Engineer";
    const skillString = uniqueSkills.join(' ').toLowerCase();
    
    if (skillString.includes('react') || skillString.includes('css') || skillString.includes('frontend')) inferredRole = "Frontend Developer";
    else if (skillString.includes('node') || skillString.includes('express') || skillString.includes('database')) inferredRole = "Backend Developer";
    else if (skillString.includes('python') || skillString.includes('data') || skillString.includes('sql')) inferredRole = "Data Analyst";
    else if (skillString.includes('aws') || skillString.includes('docker') || skillString.includes('cloud')) inferredRole = "DevOps Engineer";
    else if (skillString.includes('design') || skillString.includes('figma') || skillString.includes('ui')) inferredRole = "UI/UX Designer";

    res.json({ skills: uniqueSkills, role: inferredRole, parsedText: text.substring(0, 500) + "..." });
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse resume' });
  }
};

export const generateQuestions = (req, res) => {
  const { role, skills, difficulty } = req.body;
  if (!role || !skills) return res.status(400).json({ error: "Role and skills required" });
  
  const questions = mockGenerateQuestions(role, skills, difficulty || 'medium');
  res.json({ questions });
};

export const evaluateAnswer = (req, res) => {
  const { question, response } = req.body;
  const evaluation = mockEvaluateResponse(question, response);
  res.json({ evaluation });
};

export const saveInterviewAnalytics = async (req, res) => {
  // Normally save to DB here via Interview model
  res.json({ message: "Analytics saved successfully", id: "mock_id_123" });
};

export const generateCareerRoadmap = (req, res) => {
  const { role, score, skills } = req.body;
  if (!role || score === undefined) return res.status(400).json({ error: "Role and score required" });
  
  const dominantSkill = skills && skills.length > 0 ? skills[0] : "Software Engineering";
  let roadmap = [];
  
  if (score >= 75) {
    roadmap = [
      {
        title: "Aggressive Application Phase",
        timeframe: "Month 1",
        description: `Your impressive score of ${score}% indicates you are highly competitive for ${role} positions right now. Prioritize outbound networking over passive studying.`,
        actionItems: [
          `Tailor your resume explicitly targeting mid-level or advanced ${role} roles.`,
          `Highlight your deep understanding of ${dominantSkill} in your cover letters.`,
          "Reach out to specific technical recruiters on LinkedIn with your portfolio."
        ]
      },
      {
        title: "Interview Mastery & Negotiation",
        timeframe: "Month 2",
        description: `As you land interviews, pivot towards mastering system architecture and behavioral STAR responses.`,
        actionItems: [
          "Practice advanced mock interviews focusing purely on edge-case scenarios.",
          "Research standard salary negotiations and compensation packages for your local area.",
          "Prepare questions to ask the interviewers about their tech stack."
        ]
      },
      {
        title: "Onboarding & Senior Pathway",
        timeframe: "Month 3-6",
        description: `Upon landing the job, establish yourself as a domain expert quickly.`,
        actionItems: [
          `Take ownership of a project involving ${dominantSkill} within your first 90 days.`,
          "Schedule regular 1-on-1s with senior engineers to accelerate your learning.",
          "Start contributing to your company's internal documentation."
        ]
      }
    ];
  } else if (score >= 40) {
    roadmap = [
      {
        title: "Core Foundational Review",
        timeframe: "Month 1-2",
        description: `You have an acceptable base score of ${score}%, but you need to eliminate vocal hesitations and expand your theoretical knowledge.`,
        actionItems: [
          `Dedicate 10 hours a week to studying advanced concepts of ${dominantSkill}.`,
          "Start a blog or dev journal explaining the technical concepts you struggle with.",
          `Take an additional online certification related to the ${role} field.`
        ]
      },
      {
        title: "Portfolio Project Expansion",
        timeframe: "Month 3-4",
        description: `Your vocabulary is good but lacks practical evidence. You need hands-on proof of skill.`,
        actionItems: [
          "Build a full-stack project from scratch and host it live.",
          `Ensure the project heavily relies on ${dominantSkill} to demonstrate competence.`,
          "Contribute to one open-source repository."
        ]
      },
      {
        title: "Job Readiness & Mock Loop",
        timeframe: "Month 5-6",
        description: `Begin entering the job market while continuing to refine your interview skills.`,
        actionItems: [
          "Take this Mock Interview again aiming for a score > 75%.",
          `Start applying to Junior or Entry-Level ${role} positions.`,
          "Optimize your LinkedIn profile with your new portfolio links."
        ]
      }
    ];
  } else {
    roadmap = [
      {
        title: "Intensive Skill Bootstrapping",
        timeframe: "Month 1-3",
        description: `Your score of ${score}% indicates a critical gap in fundamental knowledge. Before scheduling interviews, you must build a solid baseline.`,
        actionItems: [
          `Enroll in a structured Bootcamp or rigorous course specifically for ${dominantSkill}.`,
          "Dedicate time strictly to building small, functional tutorial projects.",
          "Focus on learning the vocabulary; study glossaries of common tech terms."
        ]
      },
      {
        title: "Intermediate Concept Application",
        timeframe: "Month 4-6",
        description: `Start transitioning from tutorial learning to independent building.`,
        actionItems: [
          "Build two separate solo projects without following a guide.",
          "Implement basic testing and deployment pipelines.",
          "Join a local tech meetup or Discord community for code-reviews."
        ]
      },
      {
        title: "Resume Building & Market Entry",
        timeframe: "Month 6+",
        description: `Do not rush into interviews before you have a proper portfolio.`,
        actionItems: [
          "Draft your first tech resume highlighting your new solo projects.",
          "Retake this Mock AI simulator and track your score improvement.",
          "Start applying for internships or strictly junior roles."
        ]
      }
    ];
  }
  
  res.json({ roadmap });
};

export const evaluateInternships = (req, res) => {
  const { score, skills } = req.body;
  if (score === undefined || !skills) return res.status(400).json({ error: "Score and skills required" });

  const skillStr = skills.join(' ').toLowerCase();
  
  // Base roles
  const possibleRoles = [
    { title: "AI / ML Engineering Intern", keywords: ['python', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'data', 'model', 'ai', 'nlp'] },
    { title: "Frontend Engineering Intern", keywords: ['react', 'javascript', 'html', 'css', 'ui', 'frontend', 'next'] },
    { title: "Backend Systems Intern", keywords: ['node', 'python', 'java', 'sql', 'database', 'api', 'backend', 'express'] },
    { title: "Data Analyst Intern", keywords: ['python', 'sql', 'data', 'excel', 'machine learning', 'analytics', 'pandas'] },
    { title: "DevOps & Cloud Intern", keywords: ['docker', 'aws', 'cloud', 'linux', 'ci/cd', 'deploy', 'kubernetes'] },
    { title: "Full Stack Developer Intern", keywords: ['react', 'node', 'javascript', 'database', 'api', 'fullstack', 'next'] },
    { title: "Product Management Intern", keywords: ['leadership', 'agile', 'scrum', 'business', 'management', 'product'] }
  ];

  let matches = [];

  possibleRoles.forEach(roleData => {
    // Calculate how many keywords match the user's parsed skills
    let keywordMatches = 0;
    roleData.keywords.forEach(kw => {
      if (skillStr.includes(kw)) keywordMatches++;
    });

    // Base compatibility driven by resume skills (max 40 points)
    let skillCompatibility = Math.min(40, keywordMatches * 15);
    
    // Performance compatibility driven by interview score (max 60 points)
    // If they score high in the interview, they are more capable overall.
    let performanceCompatibility = (score / 100) * 60;
    
    // Final percentage = Skills + Performance + random noise for realism
    let finalPercentage = Math.round(skillCompatibility + performanceCompatibility + (Math.random() * 5));
    finalPercentage = Math.min(99, Math.max(15, finalPercentage)); // Cap at 99%, min 15%

    // Only boost roles where they actually matched a keyword, otherwise keep them lower
    if (keywordMatches === 0 && finalPercentage > 50) {
      finalPercentage = Math.round(finalPercentage * 0.6); 
    }

    matches.push({ role: roleData.title, percentage: finalPercentage });
  });

  // Sort by highest compatibility
  matches.sort((a, b) => b.percentage - a.percentage);

  // Return top 3 suited internships
  res.json({ internships: matches.slice(0, 4) });
};
