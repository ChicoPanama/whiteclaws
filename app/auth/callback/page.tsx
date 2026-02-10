'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      router.push(isAuthenticated ? '/dashboard' : '/login')
    }
  }, [loading, isAuthenticated, router])

  return (
    <div className="lg-page">
      <div className="lg-wrap" style={{ textAlign: 'center' }}>
        <div className="ap-spinner" />
        <p className="ap-card-text" style={{ marginTop: 16 }}>Completing sign in...</p>
      </div>
    </div>
  )
}
