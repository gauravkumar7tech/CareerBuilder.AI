import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { logActivity, startLessonTimer, endLessonTimer, triggerStatsUpdate } from '../utils/statsCalculator';

function RoadmapViewer() {
  const [roadmap, setRoadmap] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [activeTimers, setActiveTimers] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        setLoading(true);
        setError(null);

        const roadmapData = localStorage.getItem('currentRoadmap');
        if (!roadmapData) {
          setError('No roadmap found. Please generate a roadmap first.');
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(roadmapData);

        // Debug: Log roadmap structure
        console.log('Loaded roadmap:', parsed);
        console.log('Roadmap content:', parsed.content);
        console.log('Roadmap phases:', parsed.content?.phases);

        // Validate roadmap structure
        if (!parsed.content || !parsed.content.phases || !Array.isArray(parsed.content.phases)) {
          console.error('Invalid roadmap structure:', parsed);
          setError('Invalid roadmap data. Please generate a new roadmap.');
          setLoading(false);
          return;
        }

        // Check if phases have steps
        const hasValidPhases = parsed.content.phases.some(phase =>
          phase && phase.steps && Array.isArray(phase.steps) && phase.steps.length > 0
        );

        if (!hasValidPhases) {
          console.error('No valid phases with steps found:', parsed.content.phases);
          setError('Roadmap has no valid learning steps. Please generate a new roadmap.');
          setLoading(false);
          return;
        }

        setRoadmap(parsed);

        // Load completed steps from localStorage
        const completed = localStorage.getItem(`roadmap_${parsed.id}_completed`);
        if (completed) {
          setCompletedSteps(new Set(JSON.parse(completed)));
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading roadmap:', error);
        setError('Failed to load roadmap. Please try again.');
        setLoading(false);
      }
    };

    loadRoadmap();
  }, []);

  const toggleStepCompletion = (phaseIndex, stepIndex) => {
    const stepId = `${phaseIndex}-${stepIndex}`;
    const newCompleted = new Set(completedSteps);
    const phase = roadmap.content.phases[phaseIndex];
    const step = phase.steps[stepIndex];

    if (newCompleted.has(stepId)) {
      // Uncompleting a step
      newCompleted.delete(stepId);

      // Stop timer if running
      if (activeTimers.has(stepId)) {
        const newTimers = new Map(activeTimers);
        newTimers.delete(stepId);
        setActiveTimers(newTimers);
      }
    } else {
      // Starting/completing a step
      let actualTimeSpent = 0;

      if (activeTimers.has(stepId)) {
        // Step was being timed, calculate actual time
        actualTimeSpent = endLessonTimer(stepId);
        const newTimers = new Map(activeTimers);
        newTimers.delete(stepId);
        setActiveTimers(newTimers);
      } else {
        // Start timer for this step
        startLessonTimer(stepId);
        const newTimers = new Map(activeTimers);
        newTimers.set(stepId, Date.now());
        setActiveTimers(newTimers);
        return; // Don't mark as completed yet, just start timer
      }

      newCompleted.add(stepId);

      // Log activity when step is completed with actual time
      logActivity('lesson_completed', {
        lessonTitle: step.title,
        phase: phase.title,
        actualTimeSpent: actualTimeSpent
      });
    }
    
    setCompletedSteps(newCompleted);
    
    // Save to localStorage
    if (roadmap) {
      localStorage.setItem(`roadmap_${roadmap.id}_completed`, JSON.stringify([...newCompleted]));
      
      // Update roadmap progress
      const totalSteps = roadmap.totalSteps;
      const completedCount = newCompleted.size;
      const progress = Math.round((completedCount / totalSteps) * 100);
      
      const updatedRoadmap = { ...roadmap, progress };
      localStorage.setItem('currentRoadmap', JSON.stringify(updatedRoadmap));
      setRoadmap(updatedRoadmap);

      // Trigger real-time updates
      triggerStatsUpdate();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-xl">Loading your roadmap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Roadmap Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link
              to="/roadmap"
              className="block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Generate New Roadmap
            </Link>
            <Link
              to="/dashboard"
              className="block bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Roadmap Found</h2>
          <p className="text-gray-600 mb-6">Generate your first roadmap to get started!</p>
          <Link
            to="/roadmap"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Generate Roadmap
          </Link>
        </div>
      </div>
    );
  }

  const completedCount = completedSteps.size;
  const progressPercentage = roadmap.progress || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{roadmap.title}</h1>
                <p className="text-indigo-100 text-lg mb-4">{roadmap.content.description}</p>
                
                {/* Progress Bar */}
                <div className="bg-white/20 rounded-full h-3 mb-2">
                  <div 
                    className="bg-white h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-indigo-100 text-sm">
                  {completedCount} of {roadmap.totalSteps} steps completed ({progressPercentage}%)
                </p>
              </div>
              <div className="hidden md:block ml-8">
                <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">🎯</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap Phases */}
        <div className="space-y-8">
          {roadmap.content.phases.map((phase, phaseIndex) => (
            <div key={phaseIndex} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">{phase.title}</h3>
                  <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                    {phase.duration}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {phase.steps.map((step, stepIndex) => {
                    const stepId = `${phaseIndex}-${stepIndex}`;
                    const isCompleted = completedSteps.has(stepId);
                    const isTimerActive = activeTimers.has(stepId);

                    return (
                      <div
                        key={stepIndex}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          isCompleted
                            ? 'border-green-200 bg-green-50'
                            : isTimerActive
                            ? 'border-orange-200 bg-orange-50'
                            : 'border-gray-200 bg-gray-50 hover:border-indigo-200 hover:bg-indigo-50'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <button
                            onClick={() => toggleStepCompletion(phaseIndex, stepIndex)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                              isCompleted
                                ? 'border-green-500 bg-green-500 text-white'
                                : isTimerActive
                                ? 'border-orange-500 bg-orange-500 text-white animate-pulse'
                                : 'border-gray-300 hover:border-indigo-500'
                            }`}
                          >
                            {isCompleted && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {isTimerActive && !isCompleted && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className={`font-semibold ${
                                isCompleted ? 'text-green-800 line-through' :
                                isTimerActive ? 'text-orange-800' : 'text-gray-900'
                              }`}>
                                {step.title}
                              </h4>
                              {isTimerActive && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full animate-pulse">
                                  In Progress
                                </span>
                              )}
                            </div>
                            
                            {step.resources && step.resources.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600 mb-2">Resources:</p>
                                <div className="flex flex-wrap gap-2">
                                  {step.resources.map((resource, resourceIndex) => (
                                    <span 
                                      key={resourceIndex}
                                      className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full"
                                    >
                                      {resource}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link 
            to="/dashboard"
            className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold text-center hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </Link>
          <Link 
            to="/roadmap"
            className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold text-center hover:bg-gray-700 transition-colors"
          >
            Generate New Roadmap
          </Link>
        </div>

        {/* Completion Celebration */}
        {progressPercentage === 100 && (
          <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
            <p className="text-green-100">You've completed your entire roadmap! Time to set new goals.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoadmapViewer;
