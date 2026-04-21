import { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';
import { cleanupOtherUsersData } from '../utils/statsCalculator';

const UserContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Update user data
  const updateUser = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Update profile specifically
  const updateProfile = async (profileData) => {
    const updatedUser = {
      ...user,
      profile: { ...user.profile, ...profileData },
      name: profileData.firstName && profileData.lastName
        ? `${profileData.firstName} ${profileData.lastName}`
        : user.name
    };

    // Update local state and storage immediately for instant UI update
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    // Save to server to persist across sessions
    try {
      const response = await API.put(`/users/${user._id}/profile`, {
        profile: profileData,
        name: updatedUser.name // Also update the main name field
      });

      // If server returns updated user data, use it
      if (response.data.user) {
        const serverUser = response.data.user;
        setUser(serverUser);
        localStorage.setItem('user', JSON.stringify(serverUser));
      }

      console.log('Profile updated successfully on server');
    } catch (error) {
      console.error('Failed to update profile on server:', error);
      // Don't revert local changes - they're still valid
      // User will see the changes locally even if server update fails
    }
  };

  // Login user
  const loginUser = async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    if (response.data.user) {
      // Store user data immediately
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Store token if provided
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }

      // Clean up data from other users
      const userId = response.data.user.id || response.data.user._id;
      cleanupOtherUsersData(userId);

      // Fetch latest profile data from server to ensure we have the most recent info
      API.get('/auth/me')
        .then(profileResponse => {
          if (profileResponse.data.user) {
            const latestUser = profileResponse.data.user;
            setUser(latestUser);
            localStorage.setItem('user', JSON.stringify(latestUser));
          }
        })
        .catch(() => {
          console.log('Could not fetch latest profile, using login data');
        });
    }
    return response;
  };

  // Register user
  const registerUser = async (userData) => {
    const response = await API.post('/auth/register', userData);
    if (response.data.user) {
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  };

  // Logout user
  const logoutUser = async () => {
    try {
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('resumeUploaded');
      localStorage.removeItem('currentRoadmap');
    }
  };

  // Refresh user data from server
  const refreshUser = async () => {
    try {
      const response = await API.get('/auth/me');
      if (response.data.user) {
        // Merge server data with local data to preserve any local changes
        const mergedUser = {
          ...response.data.user,
          profile: {
            ...response.data.user.profile,
            ...user?.profile // Keep local profile changes
          }
        };
        setUser(mergedUser);
        localStorage.setItem('user', JSON.stringify(mergedUser));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails, user might be logged out
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  const value = {
    user,
    loading,
    updateUser,
    updateProfile,
    loginUser,
    registerUser,
    logoutUser,
    refreshUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
