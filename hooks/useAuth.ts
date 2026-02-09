'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const hasSupabaseConfig =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = hasSupabaseConfig ? createClient() : null;

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      if (!supabase) {
        setState(prev => ({
          ...prev,
          loading: false,
        }));
        return;
      }
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          loading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error as Error,
          loading: false,
        }));
      }
    };

    getSession();

    // Listen for auth changes
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          loading: false,
        }));
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      if (!supabase) {
        return { success: false, error: new Error('Supabase is not configured') };
      }
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        user: data.user,
        loading: false,
      }));

      return { success: true };
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        loading: false,
      }));
      return { success: false, error };
    }
  }, [supabase]);

  const signUp = useCallback(async (email: string, password: string, metadata?: object) => {
    try {
      if (!supabase) {
        return { success: false, error: new Error('Supabase is not configured') };
      }
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        user: data.user,
        loading: false,
      }));

      return { success: true };
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        loading: false,
      }));
      return { success: false, error };
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    try {
      if (!supabase) {
        return { success: false, error: new Error('Supabase is not configured') };
      }
      setState(prev => ({ ...prev, loading: true }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      setState({
        user: null,
        loading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        loading: false,
      }));
      return { success: false, error };
    }
  }, [supabase]);

  const signInWithOAuth = useCallback(async (provider: 'twitter' | 'github') => {
    try {
      if (!supabase) {
        return { success: false, error: new Error('Supabase is not configured') };
      }
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      return { success: true, url: data.url };
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        loading: false,
      }));
      return { success: false, error };
    }
  }, [supabase]);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    isAuthenticated: !!state.user,
  };
}
