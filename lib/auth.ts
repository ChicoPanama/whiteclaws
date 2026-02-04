// Authentication utilities for WhiteClaws
// Supports both Privy (protocols) and custom auth (agents)

import { createClient as createBrowserClient } from '@/lib/supabase/client';

export type UserRole = 'admin' | 'agent' | 'protocol' | 'viewer';

export interface AuthUser {
  id: string;
  handle: string;
  displayName: string;
  isAgent: boolean;
  role: UserRole;
  walletAddress?: string;
  reputationScore: number;
  avatarUrl?: string;
}

// Get current user from Supabase session
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createBrowserClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session?.user) {
    return null;
  }

  // Fetch user profile from database
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return {
    id: profile.id,
    handle: profile.handle,
    displayName: profile.display_name,
    isAgent: profile.is_agent,
    role: profile.is_agent ? 'agent' : 'viewer',
    walletAddress: profile.wallet_address,
    reputationScore: profile.reputation_score,
    avatarUrl: profile.avatar_url,
  };
}

// Check if user has required role
export function hasRole(user: AuthUser | null, requiredRoles: UserRole[]): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}

// Sign out
export async function signOut(): Promise<void> {
  const supabase = createBrowserClient();
  await supabase.auth.signOut();
}

// Check if route should be protected
export function isProtectedRoute(pathname: string): boolean {
  const protectedPaths = [
    '/protocols/',
    '/agents/',
    '/dashboard',
    '/submit',
  ];
  
  return protectedPaths.some(path => pathname.startsWith(path));
}

// Get redirect URL after auth
export function getAuthRedirectUrl(callbackUrl?: string): string {
  return callbackUrl || '/dashboard';
}
