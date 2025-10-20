import { useState, useEffect } from 'react';

/**
 * Custom hook for persisting state to localStorage
 * @param key Storage key
 * @param initialValue Initial value if no stored value exists
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get stored value or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Clear the stored value
  const clearValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error clearing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, clearValue] as const;
}

/**
 * User preferences type
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  compactView?: boolean;
  showTutorials?: boolean;
  defaultPageSize?: number;
  language?: 'en' | 'vi';
  notifications?: {
    email?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
}

/**
 * Hook for managing user preferences
 */
export function useUserPreferences() {
  const [preferences, setPreferences, clearPreferences] = useLocalStorage<UserPreferences>(
    'hero-ai-user-preferences',
    {
      theme: 'system',
      compactView: false,
      showTutorials: true,
      defaultPageSize: 10,
      language: 'en',
      notifications: {
        email: true,
        push: false,
        inApp: true,
      },
    }
  );

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return {
    preferences,
    setPreferences,
    updatePreference,
    clearPreferences,
  };
}
