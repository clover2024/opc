import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  createUser: (email: string, password: string, username: string) => Promise<{ error: any; data?: any }>;
  deleteUser: (userId: string) => Promise<{ error: any }>;
  getAllUsers: () => Promise<{ error: any; data?: any[] }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        checkAdminStatus(newSession.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        checkAdminStatus(currentSession.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    setIsAdmin(data?.is_admin || false);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (!error && data?.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username: username,
        is_admin: false,
        created_at: new Date().toISOString()
      });
    }

    return { error, data };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  const createUser = async (email: string, password: string, username: string) => {
    if (!isAdmin) {
      return { error: { message: '只有管理员可以创建用户' } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (!error && data?.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username: username,
        email: email,
        is_admin: false,
        created_at: new Date().toISOString()
      });
    }

    return { error, data };
  };

  const deleteUser = async (userId: string) => {
    if (!isAdmin) {
      return { error: { message: '只有管理员可以删除用户' } };
    }

    const { error } = await supabase.auth.admin.deleteUser(userId);
    return { error };
  };

  const getAllUsers = async () => {
    if (!isAdmin) {
      return { error: { message: '只有管理员可以查看用户列表' }, data: [] };
    }

    const { data: authUsers, error: authError } = await supabase
      .from('auth_users_view')
      .select('id, email');

    if (authError || !authUsers) {
      return { error: authError, data: [] };
    }

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username, is_admin, created_at');

    const mergedUsers = authUsers.map((authUser: any) => {
      const profile = profilesData?.find((p: any) => p.id === authUser.id);
      return {
        id: authUser.id,
        email: authUser.email,
        username: profile?.username || null,
        is_admin: profile?.is_admin || false,
        created_at: profile?.created_at || new Date().toISOString()
      };
    });

    return { error: null, data: mergedUsers };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signIn, signUp, signOut, createUser, deleteUser, getAllUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
