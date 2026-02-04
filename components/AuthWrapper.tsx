'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createClient } from '@/lib/supabase/client';

type User = {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_agent: boolean;
  reputation_score: number;
  wallet_address: string | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  isProtocol: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { authenticated, user: privyUser, login, logout: privyLogout } = usePrivy();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function syncUser() {
      if (authenticated && privyUser) {
        setIsLoading(true);
        
        // Check if user exists in our database
        const walletAddress = privyUser.wallet?.address || privyUser.id;
        
        const { data: existingUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', walletAddress)
          .single();

        if (existingUser) {
          setUser(existingUser);
        } else {
          // Create new user
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([
              {
                handle: privyUser.twitter?.username || `user_${Date.now()}`,
                display_name: privyUser.twitter?.name || 'Anonymous',
                avatar_url: privyUser.twitter?.profilePictureUrl,
                wallet_address: walletAddress,
                is_agent: false,
              },
            ])
            .select()
            .single();

          if (newUser) {
            setUser(newUser);
          }
        }
        setIsLoading(false);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    }

    syncUser();
  }, [authenticated, privyUser, supabase]);

  const logout = () => {
    setUser(null);
    privyLogout();
  };

  const isProtocol = user?.wallet_address === process.env.NEXT_PUBLIC_PROTOCOL_WALLET;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        isProtocol,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
