import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isTechnician: boolean;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('sparx_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      localStorage.removeItem('sparx_user');
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCurrentUser = async (): Promise<User | null> => {
    try {
      const userData = await apiClient.get<{
        id: number;
        username: string;
        email: string;
        role: string;
        is_approved: boolean;
        created_at: string;
      }>('/users/me');
      
      return {
        id: userData.id.toString(),
        name: userData.username,
        email: userData.email,
        role: userData.role.toUpperCase() as UserRole,
        status: userData.is_approved ? 'APPROVED' : 'PENDING',
        createdAt: userData.created_at,
      };
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      return null;
    }
  };

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await apiClient.post<LoginResponse>('/login/', {
        username,
        password,
      });

      if (!response.access_token) {
        throw new Error('No access token received');
      }

      localStorage.setItem('access_token', response.access_token);
      
      const userData = await fetchCurrentUser();
      
      if (!userData) {
        throw new Error('Failed to fetch user data');
      }
      
      localStorage.setItem('sparx_user', JSON.stringify(userData));
      setUser(userData);
      
      toast({ 
        title: 'Login successful', 
        description: `Welcome back, ${userData.name}!` 
      });
      
      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Invalid credentials';
      
      if (errorMessage.includes('pending') || errorMessage.includes('approved')) {
        toast({ 
          title: 'Account pending approval', 
          description: 'Your account is awaiting admin approval.', 
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Login failed', 
          description: errorMessage, 
          variant: 'destructive' 
        });
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      await apiClient.post('/register/', {
        username: name,
        email,
        password,
      });

      toast({ 
        title: 'Registration successful', 
        description: 'Your account has been created and is pending approval' 
      });
      
      return true;
    } catch (error: any) {
      toast({ 
        title: 'Registration failed', 
        description: error.message || 'Could not create account', 
        variant: 'destructive' 
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('sparx_user');
    toast({ title: 'Logged out', description: 'You have been successfully logged out' });
  }, [toast]);

  return (
    <AuthContext.Provider value={{
      user, 
      loading, 
      login, 
      register, 
      logout,
      isAdmin: user?.role === 'ADMIN',
      isTechnician: user?.role === 'TECHNICIAN',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};