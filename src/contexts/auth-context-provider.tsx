import { useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext, type AuthContextType, type AuthUser, type UserRole } from "./auth-context-hook";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const savedUser = localStorage.getItem("hero_user");

        if (savedUser) {
          setUser(JSON.parse(savedUser));
          setLoading(false);
          return;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error retrieving auth session:", sessionError);
          setLoading(false);
          return;
        }

        const authUserId = session?.user?.id;
        if (!authUserId) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("teachers")
          .select("*")
          .eq("auth_user_id", authUserId)
          .eq("is_active", true)
          .single();

        if (error || !data) {
          if (error) {
            console.error("Teacher lookup after session restore failed:", error);
          }
          setLoading(false);
          return;
        }

        const userData: AuthUser = {
          id: data.id,
          authUserId,
          name: data.name,
          surname: data.surname,
          email: data.email,
          role: "teacher",
          subject: data.subject,
          profileImageUrl: data.profile_image_url ?? undefined,
          phone: data.phone ?? undefined,
          bio: data.bio ?? undefined,
        };

        setUser(userData);
        localStorage.setItem("hero_user", JSON.stringify(userData));
      } catch (error) {
        console.error("Error initializing auth state:", error);
      } finally {
        setLoading(false);
      }
    };

    void initializeUser();
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
      } else if (role === "teacher") {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError || !authData?.user) {
          console.error("Teacher auth error:", authError);
          setLoading(false);
          return false;
        }

        const authUserId = authData.user.id;

        const { data, error } = await supabase
          .from("teachers")
          .select("*")
          .eq("auth_user_id", authUserId)
          .eq("is_active", true)
          .single();

        if (error || !data) {
          console.error("Teacher profile lookup error:", error);
          await supabase.auth.signOut();
          setLoading(false);
          return false;
        }

        const userData: AuthUser = {
          id: data.id,
          authUserId,
          name: data.name,
          surname: data.surname,
          email: data.email,
          role: "teacher",
          subject: data.subject,
          profileImageUrl: data.profile_image_url ?? undefined,
          phone: data.phone ?? undefined,
          bio: data.bio ?? undefined,
        };

        setUser(userData);
        localStorage.setItem("hero_user", JSON.stringify(userData));

        await supabase
          .from("teachers")
          .update({ last_login: new Date().toISOString() })
          .eq("id", data.id);

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
    void supabase.auth.signOut();
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