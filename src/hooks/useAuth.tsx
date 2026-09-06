import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { apiGet, apiPost, ApiError } from '@/integrations/api/client';
import { AppRole, hasPermission, canViewModule, RolePermissions, Permission } from '@/lib/permissions';

interface AuthUser {
  id: string;
  email: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'disabled';
}

interface MeResponse {
  user: {
    id: string;
    email: string;
    role: AppRole | null;
    profile: UserProfile | null;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  userRole: AppRole | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isManager: boolean;
  isSeller: boolean;
  hasPermission: (module: keyof RolePermissions, action: keyof Permission) => boolean;
  canViewModule: (module: keyof RolePermissions) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const applyMe = (me: MeResponse['user']) => {
    setUser({ id: me.id, email: me.email });
    setUserRole(me.role);
    setUserProfile(me.profile);
  };

  const clearSession = () => {
    setUser(null);
    setUserRole(null);
    setUserProfile(null);
  };

  const refreshMe = useCallback(async () => {
    try {
      const { user: me } = await apiGet<MeResponse>('/api/auth/me');
      applyMe(me);
    } catch {
      clearSession();
    }
  }, []);

  useEffect(() => {
    refreshMe().finally(() => setLoading(false));
  }, [refreshMe]);

  const signIn = async (email: string, password: string) => {
    try {
      const { user: me } = await apiPost<MeResponse>('/api/auth/login', { email, password });
      applyMe(me);
      return { error: null };
    } catch (err) {
      return { error: err instanceof ApiError ? new Error(err.message) : (err as Error) };
    }
  };

  const signOut = async () => {
    try {
      await apiPost('/api/auth/logout');
    } finally {
      clearSession();
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    userRole,
    userProfile,
    isAdmin: userRole === 'admin',
    isManager: userRole === 'manager',
    isSeller: userRole === 'seller',
    hasPermission: (module, action) => hasPermission(userRole, module, action),
    canViewModule: (module) => canViewModule(userRole, module),
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
