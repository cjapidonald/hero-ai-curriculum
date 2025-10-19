import { useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext, type AuthContextType, type AuthUser, type UserRole } from "@/contexts/auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
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

      if (role === 'admin') {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          console.error('Admin login error:', error);
          setLoading(false);
          return false;
        }

        const userData: AuthUser = {
          id: data.id,
          name: data.name,
          surname: data.surname,
          email: data.email,
          role: 'admin',
          profileImageUrl: data.profile_image_url ?? undefined,
          phone: data.phone ?? undefined,
        };

        setUser(userData);
        localStorage.setItem('hero_user', JSON.stringify(userData));

        // Update last login
        await supabase
          .from('admins')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.id);

        setLoading(false);
        return true;
      } else if (role === 'teacher') {
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

        const userData: AuthUser = {
          id: data.id,
          name: data.name,
          surname: data.surname,
          email: data.email,
          role: 'teacher',
          subject: data.subject,
          profileImageUrl: data.profile_image_url ?? undefined,
          phone: data.phone ?? undefined,
          bio: data.bio ?? undefined,
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

        const userData: AuthUser = {
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

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isTeacher,
    isStudent,
    isAdmin,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
