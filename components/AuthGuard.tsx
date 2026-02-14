'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAgent?: boolean;
  requireAdmin?: boolean;
}

export default function AuthGuard({
  children,
  fallback,
  requireAgent = false,
  requireAdmin = false,
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
      <div className="lg-page">
        <div className="lg-wrap" style={{ textAlign: 'center' }}>
          <div className="ap-spinner" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="lg-page">
        <div className="lg-wrap" style={{ textAlign: 'center' }}>
          <p className="ap-card-text">Please sign in to access this page</p>
          <button onClick={() => router.push('/login')} className="ap-btn-primary" style={{ marginTop: 16 }}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (requireAgent && !user?.user_metadata?.is_agent) {
    return (
      <div className="lg-page">
        <div className="lg-wrap" style={{ textAlign: 'center' }}>
          <p className="ap-card-text">This page requires agent access</p>
          <button onClick={() => router.push('/agents')} className="ap-btn-primary" style={{ marginTop: 16 }}>
            View Agents
          </button>
        </div>
      </div>
    );
  }

  if (requireAdmin) {
    const meta = (user?.user_metadata || {}) as any
    const isAdmin =
      meta?.role === 'admin' ||
      meta?.is_admin === true ||
      meta?.admin === true

    if (!isAdmin) {
      return (
        <div className="lg-page">
          <div className="lg-wrap" style={{ textAlign: 'center' }}>
            <p className="ap-card-text">Admin access required</p>
            <button onClick={() => router.push('/app')} className="ap-btn-primary" style={{ marginTop: 16 }}>
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
