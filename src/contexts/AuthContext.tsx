import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'teacher' | 'student' | 'admin';

interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: UserRole;
  class?: string;
  subject?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isTeacher: boolean;
  isStudent: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('hero_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      setLoading(true);

      if (role === 'teacher') {
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          console.error('Teacher login error:', error);
          setLoading(false);
          return false;
        }

        const userData: User = {
          id: data.id,
          name: data.name,
          surname: data.surname,
          email: data.email,
          role: 'teacher',
          subject: data.subject,
        };

        setUser(userData);
        localStorage.setItem('hero_user', JSON.stringify(userData));
        setLoading(false);
        return true;
      } else if (role === 'student') {
        const { data, error } = await supabase
          .from('dashboard_students')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          console.error('Student login error:', error);
          setLoading(false);
          return false;
        }

        const userData: User = {
          id: data.id,
          name: data.name,
          surname: data.surname,
          email: data.email,
          role: 'student',
          class: data.class,
          subject: data.subject,
        };

        setUser(userData);
        localStorage.setItem('hero_user', JSON.stringify(userData));
        setLoading(false);
        return true;
      }

      setLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hero_user');
  };

  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isTeacher, isStudent, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
