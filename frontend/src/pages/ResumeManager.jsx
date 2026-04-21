import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { triggerStatsUpdate } from '../utils/statsCalculator';

function ResumeManager() {
  const [resumes, setResumes] = useState([]);
  const [roadmapsByResume, setRoadmapsByResume] = useState({});

  useEffect(() => {
    loadResumesAndRoadmaps();
  }, []);

  const loadResumesAndRoadmaps = () => {
    // Get current user ID
    const userData = localStorage.getItem('user');
    let currentUserId = null;
    if (userData) {
      try {
        const user = JSON.parse(userData);
        currentUserId = user.id || user._id;
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    }

    // Load all resumes for current user
    const allResumes = [];
    
    // Get current resume
    const currentResumeData = localStorage.getItem('resumeData');
    if (currentResumeData) {
      try {
        const resumeData = JSON.parse(currentResumeData);
        allResumes.push({ ...resumeData, isCurrent: true });
      } catch (error) {
        console.error('Error parsing current resume:', error);
      }
    }

    // Get resume history (for future multiple resume support)
    const resumeHistory = localStorage.getItem('resumeHistory');
    if (resumeHistory) {
      try {
        const history = JSON.parse(resumeHistory);
        allResumes.push(...history.filter(r => !allResumes.some(existing => existing.id === r.id)));
      } catch (error) {
        console.error('Error parsing resume history:', error);
      }
    }

    setResumes(allResumes);

    // Load roadmaps for each resume
    const roadmapsMap = {};
    
    allResumes.forEach(resume => {
      roadmapsMap[resume.id] = [];
      
      // Get roadmap history
      const roadmapHistory = localStorage.getItem('roadmapHistory');
      if (roadmapHistory) {
        try {
          const history = JSON.parse(roadmapHistory);
          const resumeRoadmaps = history.filter(roadmap => {
            const belongsToUser = !roadmap.userId || roadmap.userId === currentUserId || roadmap.createdBy === currentUserId;
            const belongsToResume = roadmap.resumeId === resume.id || (!roadmap.resumeId && resume.isCurrent);
            return belongsToUser && belongsToResume;
          });
          roadmapsMap[resume.id].push(...resumeRoadmaps);
        } catch (error) {
          console.error('Error parsing roadmap history:', error);
        }
      }

      // Check current roadmap
      const currentRoadmap = localStorage.getItem('currentRoadmap');
      if (currentRoadmap && resume.isCurrent) {
        try {
          const roadmapData = JSON.parse(currentRoadmap);
          // Check if current roadmap belongs to this user
          const belongsToUser = !roadmapData.userId || roadmapData.userId === currentUserId || roadmapData.createdBy === currentUserId;
          if (belongsToUser) {
            const isInHistory = roadmapsMap[resume.id].some(r => r.id === roadmapData.id);
            if (!isInHistory) {
              roadmapsMap[resume.id].push({ ...roadmapData, isCurrent: true });
            } else {
              // Mark existing as current
            const existingIndex = roadmapsMap[resume.id].findIndex(r => r.id === roadmapData.id);
            if (existingIndex !== -1) {
              roadmapsMap[resume.id][existingIndex].isCurrent = true;
            }
          }
        }
        } catch (error) {
          console.error('Error parsing current roadmap:', error);
        }
      }

      // Sort roadmaps by creation date (newest first)
      roadmapsMap[resume.id].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });

    setRoadmapsByResume(roadmapsMap);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateRoadmapProgress = (roadmap) => {
    if (!roadmap.id) return 0;
    
    const completedSteps = localStorage.getItem(`roadmap_${roadmap.id}_completed`);
    if (!completedSteps) return 0;
    
    try {
      const completed = JSON.parse(completedSteps);
      const totalSteps = roadmap.totalSteps || 0;
      return totalSteps > 0 ? Math.round((completed.length / totalSteps) * 100) : 0;
    } catch (error) {
      return 0;
    }
  };

  const getTotalTimeSpent = (roadmaps) => {
    let totalMinutes = 0;
    roadmaps.forEach(roadmap => {
      if (roadmap.id) {
        const completedSteps = localStorage.getItem(`roadmap_${roadmap.id}_completed`);
        if (completedSteps) {
          try {
            const completed = JSON.parse(completedSteps);
            totalMinutes += completed.length * 25; // Average 25 minutes per lesson
          } catch (error) {
            console.error('Error calculating time:', error);
          }
        }
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const deleteResume = (resumeId) => {
    const resumeToDelete = resumes.find(r => r.id === resumeId);
    const roadmapCount = roadmapsByResume[resumeId]?.length || 0;

    const confirmMessage = `Are you sure you want to delete "${resumeToDelete?.fileName}"?\n\nThis will also delete ${roadmapCount} roadmap(s) and all progress data.\n\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    // Get roadmaps for this resume
    const resumeRoadmaps = roadmapsByResume[resumeId] || [];

    // Delete all roadmap completion data
    resumeRoadmaps.forEach(roadmap => {
      if (roadmap.id) {
        localStorage.removeItem(`roadmap_${roadmap.id}_completed`);
        localStorage.removeItem(`lesson_timer_${roadmap.id}`);
      }
    });

    // Remove roadmaps from history
    const roadmapHistory = localStorage.getItem('roadmapHistory');
    if (roadmapHistory) {
      try {
        const history = JSON.parse(roadmapHistory);
        const filteredHistory = history.filter(roadmap => roadmap.resumeId !== resumeId);
        localStorage.setItem('roadmapHistory', JSON.stringify(filteredHistory));
      } catch (error) {
        console.error('Error updating roadmap history:', error);
      }
    }

    // If this is the current resume, clear current data
    const currentResumeData = localStorage.getItem('resumeData');
    if (currentResumeData) {
      try {
        const currentResume = JSON.parse(currentResumeData);
        if (currentResume.id === resumeId) {
          localStorage.removeItem('resumeData');
          localStorage.removeItem('resumeUploaded');
          localStorage.removeItem('resumeFileName');
          localStorage.removeItem('currentRoadmap');
        }
      } catch (error) {
        console.error('Error checking current resume:', error);
      }
    }

    // Remove from resume history (for future multiple resume support)
    const resumeHistory = localStorage.getItem('resumeHistory');
    if (resumeHistory) {
      try {
        const history = JSON.parse(resumeHistory);
        const filteredHistory = history.filter(resume => resume.id !== resumeId);
        localStorage.setItem('resumeHistory', JSON.stringify(filteredHistory));
      } catch (error) {
        console.error('Error updating resume history:', error);
      }
    }

    // Reload data and trigger updates
    loadResumesAndRoadmaps();
    triggerStatsUpdate();
  };

  const deleteRoadmap = (roadmapId, resumeId) => {
    const roadmapToDelete = roadmapsByResume[resumeId]?.find(r => r.id === roadmapId);
    const confirmMessage = `Are you sure you want to delete "${roadmapToDelete?.title}"?\n\nAll progress and completion data will be lost.\n\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    // Delete roadmap completion data
    localStorage.removeItem(`roadmap_${roadmapId}_completed`);
    localStorage.removeItem(`lesson_timer_${roadmapId}`);

    // Remove from roadmap history
    const roadmapHistory = localStorage.getItem('roadmapHistory');
    if (roadmapHistory) {
      try {
        const history = JSON.parse(roadmapHistory);
        const filteredHistory = history.filter(roadmap => roadmap.id !== roadmapId);
        localStorage.setItem('roadmapHistory', JSON.stringify(filteredHistory));
      } catch (error) {
        console.error('Error updating roadmap history:', error);
      }
    }

    // If this is the current roadmap, clear it
    const currentRoadmap = localStorage.getItem('currentRoadmap');
    if (currentRoadmap) {
      try {
        const current = JSON.parse(currentRoadmap);
        if (current.id === roadmapId) {
          localStorage.removeItem('currentRoadmap');
        }
      } catch (error) {
        console.error('Error checking current roadmap:', error);
      }
    }

    // Reload data and trigger updates
    loadResumesAndRoadmaps();
    triggerStatsUpdate();
  };

  if (resumes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-6">📄</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Resumes Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Upload your first resume to get started with personalized roadmaps.</p>
          <Link 
            to="/resume-upload" 
            className="bg-indigo-600 dark:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
          >
            Upload Resume
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">📄 Resume Manager</h1>
                <p className="text-indigo-100 text-lg">Manage all your resumes and their learning roadmaps</p>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">📋</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumes List */}
        <div className="space-y-8">
          {resumes.map((resume) => {
            const resumeRoadmaps = roadmapsByResume[resume.id] || [];
            const totalProgress = resumeRoadmaps.length > 0 
              ? Math.round(resumeRoadmaps.reduce((sum, roadmap) => sum + calculateRoadmapProgress(roadmap), 0) / resumeRoadmaps.length)
              : 0;

            return (
              <div key={resume.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Resume Header */}
                <div className={`p-6 ${resume.isCurrent ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-b-2 border-indigo-200 dark:border-indigo-700' : 'bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{resume.fileName}</h2>
                        {resume.isCurrent && (
                          <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm font-medium">
                            Current Resume
                          </span>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-300">
                        <div>
                          <span className="font-medium">Size:</span> {formatFileSize(resume.fileSize)}
                        </div>
                        <div>
                          <span className="font-medium">Uploaded:</span> {formatDate(resume.uploadDate)}
                        </div>
                        <div>
                          <span className="font-medium">Roadmaps:</span> {resumeRoadmaps.length}
                        </div>
                        <div>
                          <span className="font-medium">Time Spent:</span> {getTotalTimeSpent(resumeRoadmaps)}
                        </div>
                      </div>

                      {resumeRoadmaps.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-300">Overall Progress</span>
                            <span className="font-medium text-indigo-600 dark:text-indigo-400">{totalProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${totalProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-6 flex space-x-3">
                      <Link
                        to="/roadmap"
                        className="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
                      >
                        Generate Roadmap
                      </Link>
                      <Link
                        to="/resume-upload"
                        className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                      >
                        Upload New
                      </Link>
                      <button
                        onClick={() => deleteResume(resume.id)}
                        className="bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                      >
                        Delete Resume
                      </button>
                    </div>
                  </div>
                </div>

                {/* Roadmaps for this Resume */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Learning Roadmaps ({resumeRoadmaps.length})
                  </h3>
                  
                  {resumeRoadmaps.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-3xl mb-3">🗺️</div>
                      <p className="text-gray-600 mb-4">No roadmaps generated for this resume yet.</p>
                      <Link 
                        to="/roadmap" 
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                      >
                        Generate First Roadmap
                      </Link>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {resumeRoadmaps.map((roadmap, index) => {
                        const progress = calculateRoadmapProgress(roadmap);
                        const completedSteps = localStorage.getItem(`roadmap_${roadmap.id}_completed`);
                        const completedCount = completedSteps ? JSON.parse(completedSteps).length : 0;
                        const timeSpent = completedCount * 25; // 25 minutes per lesson
                        
                        return (
                          <div 
                            key={roadmap.id || index}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                              roadmap.isCurrent
                                ? 'border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30'
                                : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {roadmap.title || 'Learning Roadmap'}
                              </h4>
                              {roadmap.isCurrent && (
                                <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                                  Active
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
                              <div className="flex justify-between">
                                <span>Career Goal:</span>
                                <span className="font-medium">{roadmap.preferences?.careerGoal || 'Not specified'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Timeframe:</span>
                                <span className="font-medium">{roadmap.preferences?.timeframe || 'Not specified'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Time Spent:</span>
                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                  {timeSpent >= 60 ? `${Math.floor(timeSpent / 60)}h ${timeSpent % 60}m` : `${timeSpent}m`}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Created:</span>
                                <span className="font-medium">{formatDate(roadmap.createdAt)}</span>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600 dark:text-gray-300">Progress</span>
                                <span className="font-medium text-indigo-600 dark:text-indigo-400">{progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {completedCount} of {roadmap.totalSteps || 0} lessons completed
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Link
                                to="/roadmap/view"
                                onClick={() => {
                                  // Set this as current roadmap when viewing
                                  localStorage.setItem('currentRoadmap', JSON.stringify(roadmap));
                                }}
                                className="flex-1 bg-indigo-600 dark:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-center"
                              >
                                View Roadmap
                              </Link>
                              <button
                                onClick={() => deleteRoadmap(roadmap.id, resume.id)}
                                className="bg-red-600 dark:bg-red-700 text-white py-2 px-3 rounded-lg font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                                title="Delete Roadmap"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/resume-upload"
            className="bg-indigo-600 dark:bg-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-center"
          >
            Upload New Resume
          </Link>
          <Link 
            to="/dashboard"
            className="bg-gray-600 dark:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-center"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResumeManager;
