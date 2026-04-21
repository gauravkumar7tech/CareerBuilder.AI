import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to apply theme to DOM
  const applyThemeToDOM = (themeToApply) => {
    const root = document.documentElement;
    const body = document.body;

    console.log('Applying theme to DOM:', themeToApply);

    // Always remove dark class first
    root.classList.remove('dark');
    body.classList.remove('dark');

    if (themeToApply === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      body.style.backgroundColor = '#111827';
      body.style.color = '#f9fafb';
      console.log('Dark mode applied - DOM has dark class:', root.classList.contains('dark'));
    } else {
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#111827';
      console.log('Light mode applied - DOM has dark class:', root.classList.contains('dark'));
    }

    // Force a re-render by dispatching a custom event
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: themeToApply, isDark: themeToApply === 'dark' }
    }));
  };

  // Initialize theme on mount
  useEffect(() => {
    const initializeTheme = () => {
      const savedSettings = localStorage.getItem('userSettings');
      let initialTheme = 'light';

      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          const savedTheme = settings.appearance?.theme || 'light';

          if (savedTheme === 'auto') {
            initialTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          } else {
            initialTheme = savedTheme;
          }
        } catch (error) {
          console.error('Error loading theme:', error);
        }
      }

      console.log('Initializing theme:', initialTheme);
      setTheme(initialTheme);
      applyThemeToDOM(initialTheme);
      setIsInitialized(true);
    };

    initializeTheme();
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    if (isInitialized) {
      applyThemeToDOM(theme);
    }
  }, [theme, isInitialized]);

  // Listen for system theme changes when auto mode is selected
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.appearance?.theme === 'auto') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          
          const handleChange = (e) => {
            setTheme(e.matches ? 'dark' : 'light');
          };
          
          mediaQuery.addEventListener('change', handleChange);
          return () => mediaQuery.removeEventListener('change', handleChange);
        }
      } catch (error) {
        console.error('Error setting up auto theme:', error);
      }
    }
  }, []);

  // Function to update theme
  const updateTheme = (newTheme) => {
    console.log('🎨 Theme update requested:', newTheme);

    // Update settings in localStorage immediately
    const currentSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    const updatedSettings = {
      ...currentSettings,
      appearance: {
        ...currentSettings.appearance,
        theme: newTheme
      }
    };
    localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
    console.log('💾 Settings saved to localStorage');

    let finalTheme = newTheme;
    if (newTheme === 'auto') {
      finalTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      console.log('🔄 Auto theme detected:', finalTheme);
    }

    // Update state - this will trigger the useEffect above
    console.log('🔄 Setting theme state from', theme, 'to', finalTheme);
    setTheme(finalTheme);
  };

  const value = {
    theme,
    updateTheme,
    isDark: theme === 'dark',
    isInitialized
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
