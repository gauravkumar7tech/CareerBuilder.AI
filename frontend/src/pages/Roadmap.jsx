import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { logActivity, triggerStatsUpdate } from '../utils/statsCalculator';

function Roadmap() {
  const [preferences, setPreferences] = useState({
    careerGoal: '',
    timeframe: '',
    experience: '',
    interests: [],
    learningStyle: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const navigate = useNavigate();

  const careerGoals = [
    { id: 'frontend', title: 'Frontend Developer', icon: '🎨', desc: 'Build beautiful user interfaces' },
    { id: 'backend', title: 'Backend Developer', icon: '⚙️', desc: 'Create robust server systems' },
    { id: 'fullstack', title: 'Full Stack Developer', icon: '🚀', desc: 'Master both frontend and backend' },
    { id: 'mobile', title: 'Mobile Developer', icon: '📱', desc: 'Build mobile applications' },
    { id: 'devops', title: 'DevOps Engineer', icon: '🔧', desc: 'Manage deployment and infrastructure' },
    { id: 'data', title: 'Data Scientist', icon: '📊', desc: 'Analyze data and build ML models' },
    { id: 'ai', title: 'AI/ML Engineer', icon: '🤖', desc: 'Develop AI and machine learning systems' },
    { id: 'security', title: 'Security Engineer', icon: '🔒', desc: 'Protect systems and data' }
  ];

  const timeframes = [
    { id: '3months', title: '3 Months', desc: 'Intensive learning' },
    { id: '6months', title: '6 Months', desc: 'Balanced approach' },
    { id: '1year', title: '1 Year', desc: 'Comprehensive mastery' },
    { id: '2years', title: '2+ Years', desc: 'Expert level' }
  ];

  const experienceLevels = [
    { id: 'beginner', title: 'Beginner', desc: 'New to programming' },
    { id: 'intermediate', title: 'Intermediate', desc: 'Some experience' },
    { id: 'advanced', title: 'Advanced', desc: 'Experienced developer' }
  ];

  const interests = [
    'Web Development', 'Mobile Apps', 'Machine Learning', 'Data Analysis',
    'Cloud Computing', 'Cybersecurity', 'Game Development', 'IoT',
    'Blockchain', 'AR/VR', 'API Development', 'UI/UX Design'
  ];

  const learningStyles = [
    { id: 'visual', title: 'Visual', icon: '👁️', desc: 'Learn through diagrams and videos' },
    { id: 'hands-on', title: 'Hands-on', icon: '🛠️', desc: 'Learn by building projects' },
    { id: 'reading', title: 'Reading', icon: '📚', desc: 'Learn through documentation' },
    { id: 'mixed', title: 'Mixed', icon: '🎯', desc: 'Combination of all methods' }
  ];

  const generationSteps = [
    'Analyzing your resume...',
    'Processing your preferences...',
    'Matching skills with goals...',
    'Creating learning path...',
    'Optimizing timeline...',
    'Finalizing roadmap...'
  ];

  const handleInterestToggle = (interest) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const generateRoadmapContent = (prefs) => {
    const roadmaps = {
      frontend: {
        description: "Master modern frontend development with React, JavaScript, and responsive design",
        phases: [
          {
            title: "Foundation",
            duration: "4-6 weeks",
            steps: [
              { title: "HTML5 & Semantic Markup", completed: false, resources: ["MDN HTML Guide", "HTML5 Course"] },
              { title: "CSS3 & Flexbox/Grid", completed: false, resources: ["CSS Grid Garden", "Flexbox Froggy"] },
              { title: "JavaScript Fundamentals", completed: false, resources: ["JavaScript.info", "Eloquent JavaScript"] },
              { title: "DOM Manipulation", completed: false, resources: ["DOM Exercises", "Vanilla JS Projects"] }
            ]
          },
          {
            title: "Modern Development",
            duration: "6-8 weeks",
            steps: [
              { title: "React Fundamentals", completed: false, resources: ["React Official Tutorial", "React Course"] },
              { title: "State Management", completed: false, resources: ["Redux Toolkit", "Context API"] },
              { title: "React Router", completed: false, resources: ["React Router Docs", "SPA Navigation"] },
              { title: "API Integration", completed: false, resources: ["Fetch API", "Axios Library"] }
            ]
          },
          {
            title: "Advanced Topics",
            duration: "4-6 weeks",
            steps: [
              { title: "Testing (Jest, React Testing Library)", completed: false, resources: ["Testing Library Docs"] },
              { title: "Build Tools (Vite, Webpack)", completed: false, resources: ["Vite Guide", "Webpack Tutorial"] },
              { title: "Performance Optimization", completed: false, resources: ["React Performance", "Web Vitals"] },
              { title: "Deployment & CI/CD", completed: false, resources: ["Netlify", "Vercel", "GitHub Actions"] }
            ]
          }
        ]
      },
      backend: {
        description: "Build scalable server-side applications with Node.js, databases, and APIs",
        phases: [
          {
            title: "Server Fundamentals",
            duration: "4-6 weeks",
            steps: [
              { title: "Node.js & NPM", completed: false, resources: ["Node.js Docs", "NPM Guide"] },
              { title: "Express.js Framework", completed: false, resources: ["Express Guide", "REST API Tutorial"] },
              { title: "Database Design", completed: false, resources: ["SQL Tutorial", "Database Design"] },
              { title: "MongoDB & Mongoose", completed: false, resources: ["MongoDB University", "Mongoose Docs"] }
            ]
          },
          {
            title: "API Development",
            duration: "6-8 weeks",
            steps: [
              { title: "RESTful API Design", completed: false, resources: ["REST API Best Practices"] },
              { title: "Authentication & Authorization", completed: false, resources: ["JWT Tutorial", "Passport.js"] },
              { title: "Data Validation", completed: false, resources: ["Joi Validation", "Express Validator"] },
              { title: "Error Handling", completed: false, resources: ["Error Handling Patterns"] }
            ]
          },
          {
            title: "Production Ready",
            duration: "4-6 weeks",
            steps: [
              { title: "Testing (Unit, Integration)", completed: false, resources: ["Jest", "Supertest"] },
              { title: "Security Best Practices", completed: false, resources: ["OWASP Guide", "Helmet.js"] },
              { title: "Performance & Caching", completed: false, resources: ["Redis", "Performance Monitoring"] },
              { title: "Deployment & DevOps", completed: false, resources: ["Docker", "AWS/Heroku"] }
            ]
          }
        ]
      },
      fullstack: {
        description: "Become a complete full-stack developer with modern technologies",
        phases: [
          {
            title: "Frontend Mastery",
            duration: "6-8 weeks",
            steps: [
              { title: "React & Modern JavaScript", completed: false, resources: ["React Docs", "ES6+ Features"] },
              { title: "State Management (Redux/Context)", completed: false, resources: ["Redux Toolkit"] },
              { title: "UI/UX & Responsive Design", completed: false, resources: ["Tailwind CSS", "Material-UI"] },
              { title: "Frontend Testing", completed: false, resources: ["React Testing Library"] }
            ]
          },
          {
            title: "Backend Development",
            duration: "6-8 weeks",
            steps: [
              { title: "Node.js & Express", completed: false, resources: ["Express.js Guide"] },
              { title: "Database Design & Management", completed: false, resources: ["PostgreSQL", "MongoDB"] },
              { title: "API Development & Documentation", completed: false, resources: ["Swagger", "Postman"] },
              { title: "Authentication Systems", completed: false, resources: ["JWT", "OAuth"] }
            ]
          },
          {
            title: "Full-Stack Integration",
            duration: "4-6 weeks",
            steps: [
              { title: "Frontend-Backend Communication", completed: false, resources: ["API Integration"] },
              { title: "Real-time Features", completed: false, resources: ["Socket.io", "WebSockets"] },
              { title: "Testing & Quality Assurance", completed: false, resources: ["E2E Testing", "Cypress"] },
              { title: "Deployment & DevOps", completed: false, resources: ["Full-Stack Deployment"] }
            ]
          }
        ]
      }
    };

    return roadmaps[prefs.careerGoal] || roadmaps.frontend;
  };

  const handleGenerate = async () => {
    if (!preferences.careerGoal || !preferences.timeframe || !preferences.experience) {
      alert('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(0);

    try {
      // Simulate AI generation process
      for (let i = 0; i < generationSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setGenerationStep(i + 1);
      }

      // Generate detailed roadmap content
      const selectedGoal = careerGoals.find(g => g.id === preferences.careerGoal);
      const roadmapContent = generateRoadmapContent(preferences);

      // Get resume data to link roadmap
      const resumeData = localStorage.getItem('resumeData');
      const resumeId = resumeData ? JSON.parse(resumeData).id : null;

      // Get current user ID
      const userData = localStorage.getItem('user');
      const userId = userData ? JSON.parse(userData).id || JSON.parse(userData)._id : null;

      const roadmapData = {
        id: Date.now(),
        title: `${selectedGoal?.title} Roadmap`,
        preferences,
        content: roadmapContent,
        createdAt: new Date().toISOString(),
        progress: 0,
        totalSteps: roadmapContent.phases.reduce((total, phase) => total + phase.steps.length, 0),
        resumeId: resumeId, // Link to resume
        userId: userId, // Link to user
        createdBy: userId // Alternative field name for user reference
      };

      // Call API to generate roadmap
      try {
        await API.post('/roadmap/generate', {
          preferences,
          roadmapData,
          resumeText: localStorage.getItem('resumeText') || '',
          userId: JSON.parse(localStorage.getItem('user') || '{}')._id
        });
      } catch (apiError) {
        console.log('API call failed, continuing with demo data:', apiError);
      }

      localStorage.setItem('currentRoadmap', JSON.stringify(roadmapData));

      // Also store in roadmap history
      const roadmapHistory = localStorage.getItem('roadmapHistory') || '[]';
      const history = JSON.parse(roadmapHistory);
      history.push(roadmapData);
      localStorage.setItem('roadmapHistory', JSON.stringify(history));

      // Log roadmap generation activity
      logActivity('roadmap_generated', {
        careerGoal: selectedGoal?.title,
        timeframe: preferences.timeframe,
        experience: preferences.experience
      });

      // Trigger real-time updates
      triggerStatsUpdate();

      navigate('/dashboard');
    } catch (error) {
      console.error('Roadmap generation error:', error);
      alert('Failed to generate roadmap. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">🚀</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CareerBuilder.AI</h1>
                <p className="text-white/60 text-sm">Step 2 of 2: Generate Roadmap</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-white/70 hover:text-white transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {!isGenerating ? (
          <>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Customize Your Learning Path
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Tell us about your goals and preferences to create the perfect roadmap for you
              </p>
            </div>

            <div className="space-y-12">
              {/* Career Goal */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">What's your career goal? *</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {careerGoals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setPreferences(prev => ({ ...prev, careerGoal: goal.id }))}
                      className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                        preferences.careerGoal === goal.id
                          ? 'border-indigo-400 bg-indigo-500/20'
                          : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-3xl mb-3">{goal.icon}</div>
                      <h4 className="font-semibold text-white mb-2">{goal.title}</h4>
                      <p className="text-white/60 text-sm">{goal.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeframe */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">How much time can you dedicate? *</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {timeframes.map((time) => (
                    <button
                      key={time.id}
                      onClick={() => setPreferences(prev => ({ ...prev, timeframe: time.id }))}
                      className={`p-6 rounded-2xl border-2 transition-all duration-200 text-center ${
                        preferences.timeframe === time.id
                          ? 'border-purple-400 bg-purple-500/20'
                          : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                      }`}
                    >
                      <h4 className="font-semibold text-white mb-2">{time.title}</h4>
                      <p className="text-white/60 text-sm">{time.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">What's your experience level? *</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {experienceLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setPreferences(prev => ({ ...prev, experience: level.id }))}
                      className={`p-6 rounded-2xl border-2 transition-all duration-200 text-center ${
                        preferences.experience === level.id
                          ? 'border-pink-400 bg-pink-500/20'
                          : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                      }`}
                    >
                      <h4 className="font-semibold text-white mb-2">{level.title}</h4>
                      <p className="text-white/60 text-sm">{level.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">What interests you? (Optional)</h3>
                <div className="flex flex-wrap gap-3">
                  {interests.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`px-4 py-2 rounded-full border transition-all duration-200 ${
                        preferences.interests.includes(interest)
                          ? 'border-blue-400 bg-blue-500/20 text-blue-200'
                          : 'border-white/30 bg-white/5 text-white/70 hover:border-white/50 hover:bg-white/10'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Learning Style */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">How do you prefer to learn?</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {learningStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setPreferences(prev => ({ ...prev, learningStyle: style.id }))}
                      className={`p-6 rounded-2xl border-2 transition-all duration-200 text-center ${
                        preferences.learningStyle === style.id
                          ? 'border-green-400 bg-green-500/20'
                          : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-3xl mb-3">{style.icon}</div>
                      <h4 className="font-semibold text-white mb-2">{style.title}</h4>
                      <p className="text-white/60 text-sm">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="text-center pt-8">
                <button
                  onClick={handleGenerate}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-12 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center mx-auto"
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate My Roadmap
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 animate-pulse">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Generating Your Roadmap</h3>
            <p className="text-xl text-white/70 mb-8">
              {generationSteps[Math.min(generationStep - 1, generationSteps.length - 1)] || 'Preparing...'}
            </p>
            <div className="max-w-md mx-auto">
              <div className="w-full bg-white/20 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(generationStep / generationSteps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Roadmap;
