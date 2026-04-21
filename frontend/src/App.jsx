import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ResumeUpload from './pages/ResumeUpload';
import ResumeViewer from './components/ResumeViewer';
import ResumeManager from './pages/ResumeManager';
import Roadmap from './pages/Roadmap';
import RoadmapViewer from './pages/RoadmapViewer';
import Dashboard from './pages/DashboardNew';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Router>
          <Navbar />
          <Routes>
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<Register />} />

        {/* Main App Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/resume-upload" element={
          <ProtectedRoute>
            <ResumeUpload />
          </ProtectedRoute>
        } />
        <Route path="/resume/view" element={
          <ProtectedRoute>
            <ResumeViewer />
          </ProtectedRoute>
        } />
        <Route path="/resume/manage" element={
          <ProtectedRoute>
            <ResumeManager />
          </ProtectedRoute>
        } />
        <Route path="/roadmap" element={
          <ProtectedRoute>
            <Roadmap />
          </ProtectedRoute>
        } />
        <Route path="/roadmap/view" element={
          <ProtectedRoute>
            <RoadmapViewer />
          </ProtectedRoute>
        } />
        <Route path="/progress" element={
          <ProtectedRoute>
            <Progress />
          </ProtectedRoute>
        } />

        {/* Settings */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />



        {/* Landing Page */}
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<Home />} />
        </Routes>
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
