import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import API from '../services/api';

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading, true/false = result

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Make a request to verify the cookie using the /auth/me endpoint
        const response = await API.get('/auth/me');
        if (response.data.user) {
          setIsAuthenticated(true);
          // Store user data in localStorage for other components
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.log('Auth check failed:', error);
        setIsAuthenticated(false);
        // Clear any stale user data
        localStorage.removeItem('user');
      }
    };

    checkAuth();
  }, []);

  // Show minimal loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
