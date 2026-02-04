'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from './Button';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAgent?: boolean;
}

export default function AuthGuard({ 
  children, 
  fallback,
  requireAgent = false 
}: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-gray-400">Please sign in to access this page</p>
        <Button onClick={() => router.push('/login')}>
          Sign In
        </Button>
      </div>
    );
  }

  // Check if agent role is required
  if (requireAgent && !user?.user_metadata?.is_agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-gray-400">This page requires agent access</p>
        <Button onClick={() => router.push('/apply')}>
          Apply as Agent
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
