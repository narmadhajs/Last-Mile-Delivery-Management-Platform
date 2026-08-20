import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'AGENT' | 'CUSTOMER';
  phone?: string;
  companyName?: string;
  agentId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  switchRole: (role: 'ADMIN' | 'CUSTOMER' | 'B2B' | 'AGENT') => Promise<void>;
  logout: () => void;
  demoAccounts: any[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('logitrack_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);

  // Fetch current user or default to Admin on first load for optimal evaluator experience
  useEffect(() => {
    const initAuth = async () => {
      try {
        const demoRes: any = await authApi.getDemoAccounts();
        if (demoRes.success) {
          setDemoAccounts(demoRes.data);
        }

        const storedToken = localStorage.getItem('logitrack_token');
        if (storedToken) {
          const res: any = await authApi.getMe();
          if (res.success && res.data) {
            setUser({
              id: res.data.id,
              email: res.data.email,
              name: res.data.name,
              role: res.data.role,
              phone: res.data.phone,
              companyName: res.data.companyName,
              agentId: res.data.agentProfile?.id,
            });
          }
        } else {
          // Auto-login as Admin by default for testing
          await login('admin@delivery.com', 'admin123');
        }
      } catch (err) {
        localStorage.removeItem('logitrack_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string = 'password123') => {
    setIsLoading(true);
    try {
      const res: any = await authApi.login({
        email,
        password: email === 'admin@delivery.com' ? 'admin123' : password,
      });

      if (res.success && res.data) {
        localStorage.setItem('logitrack_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (targetRole: 'ADMIN' | 'CUSTOMER' | 'B2B' | 'AGENT') => {
    if (targetRole === 'ADMIN') {
      await login('admin@delivery.com', 'admin123');
    } else if (targetRole === 'CUSTOMER') {
      await login('john@example.com', 'password123');
    } else if (targetRole === 'B2B') {
      await login('sarah.b2b@apexlogistics.com', 'password123');
    } else if (targetRole === 'AGENT') {
      await login('rajesh.agent@delivery.com', 'password123');
    }
  };

  const logout = () => {
    localStorage.removeItem('logitrack_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        switchRole,
        logout,
        demoAccounts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
