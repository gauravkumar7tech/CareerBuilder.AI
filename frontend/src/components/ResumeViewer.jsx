import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function ResumeViewer() {
  const [resumeData, setResumeData] = useState(null);
  const [roadmaps, setRoadmaps] = useState([]);

  useEffect(() => {
    // Load resume data
    const storedResumeData = localStorage.getItem('resumeData');
    if (storedResumeData) {
      setResumeData(JSON.parse(storedResumeData));
    }

    // Load all roadmaps for this resume
    const allRoadmaps = [];

    // Get roadmap history
    const roadmapHistory = localStorage.getItem('roadmapHistory');
    if (roadmapHistory) {
      try {
        const history = JSON.parse(roadmapHistory);
        const resumeId = storedResumeData ? JSON.parse(storedResumeData).id : null;

        // Filter roadmaps for this resume
        const resumeRoadmaps = history.filter(roadmap =>
          roadmap.resumeId === resumeId || !roadmap.resumeId // Include roadmaps without resumeId for backward compatibility
        );

        allRoadmaps.push(...resumeRoadmaps);
      } catch (error) {
        console.error('Error parsing roadmap history:', error);
      }
    }

    // Also check current roadmap
    const currentRoadmap = localStorage.getItem('currentRoadmap');
    if (currentRoadmap) {
      try {
        const roadmapData = JSON.parse(currentRoadmap);
        // Check if current roadmap is already in history
        const isInHistory = allRoadmaps.some(r => r.id === roadmapData.id);
        if (!isInHistory) {
          allRoadmaps.push({ ...roadmapData, isCurrent: true });
        } else {
          // Mark the existing one as current
          const existingIndex = allRoadmaps.findIndex(r => r.id === roadmapData.id);
          if (existingIndex !== -1) {
            allRoadmaps[existingIndex].isCurrent = true;
          }
        }
      } catch (error) {
        console.error('Error parsing current roadmap:', error);
      }
    }

    setRoadmaps(allRoadmaps);
  }, []);

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-6">📄</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Resume Found</h2>
          <p className="text-gray-600 mb-6">Upload your resume to get started with personalized roadmaps.</p>
          <Link 
            to="/resume-upload" 
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Upload Resume
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">📄 Your Resume</h1>
                <p className="text-indigo-100 text-lg">Manage your uploaded resume and generated roadmaps</p>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">📋</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resume Details */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Resume Details</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">File Name</label>
                <p className="text-lg font-semibold text-gray-900">{resumeData.fileName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">File Size</label>
                <p className="text-lg text-gray-700">{formatFileSize(resumeData.fileSize)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">File Type</label>
                <p className="text-lg text-gray-700">{resumeData.fileType || 'PDF'}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Upload Date</label>
                <p className="text-lg text-gray-700">{formatDate(resumeData.uploadDate)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-lg text-green-600 font-medium">Active</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Roadmaps Generated</label>
                <p className="text-lg font-semibold text-indigo-600">{roadmaps.length}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-4">
            <Link 
              to="/resume-upload" 
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Upload New Resume
            </Link>
            <Link 
              to="/roadmap" 
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Generate New Roadmap
            </Link>
          </div>
        </div>

        {/* Generated Roadmaps */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Generated Roadmaps</h2>
          
          {roadmaps.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Roadmaps Yet</h3>
              <p className="text-gray-600 mb-6">Generate your first personalized learning roadmap based on your resume.</p>
              <Link 
                to="/roadmap" 
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Generate Roadmap
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {roadmaps.map((roadmap, index) => (
                <div 
                  key={roadmap.id || index}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                    roadmap.isCurrent 
                      ? 'border-indigo-200 bg-indigo-50' 
                      : 'border-gray-200 bg-gray-50 hover:border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {roadmap.title || 'Learning Roadmap'}
                        </h3>
                        {roadmap.isCurrent && (
                          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                            Current
                          </span>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Career Goal:</span> {roadmap.preferences?.careerGoal || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Timeframe:</span> {roadmap.preferences?.timeframe || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {roadmap.createdAt ? formatDate(roadmap.createdAt) : 'Unknown'}
                        </div>
                      </div>
                      
                      {roadmap.progress !== undefined && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium text-indigo-600">{roadmap.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${roadmap.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-6">
                      <Link 
                        to="/roadmap/view"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                      >
                        View Roadmap
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link 
            to="/dashboard"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResumeViewer;
