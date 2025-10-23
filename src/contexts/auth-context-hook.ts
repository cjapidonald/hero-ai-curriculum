import { createContext, useContext } from "react";

export type UserRole = "admin" | "teacher" | "student";

export interface AuthUser {
  id: string;
  authUserId?: string;
  name: string;
  surname: string;
  email: string;
  role: UserRole;
  profileImageUrl?: string;
  phone?: string;
  bio?: string;
  subject?: string;
  class?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isTeacher: boolean;
  isStudent: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};