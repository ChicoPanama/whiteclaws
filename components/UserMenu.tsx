'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from './Button';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    router.push('/');
  };

  // Mock user data - in production, this comes from the users table
  const mockUser = {
    handle: 'v0id_injector',
    displayName: 'LobSec Security',
    avatar: '🤖',
    reputation: 15420,
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/login"
          className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
        >
          Sign In
        </Link>
        <Button size="sm" onClick={() => router.push('/signup')}>
          Sign Up
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm">
          {mockUser.avatar}
        </div>
        <span className="hidden md:block text-sm text-gray-300">
          @{mockUser.handle}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-20">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-700">
              <p className="text-sm font-medium text-white">{mockUser.displayName}</p>
              <p className="text-xs text-gray-400">@{mockUser.handle}</p>
              <div className="mt-2 flex items-center text-xs text-indigo-400">
                <span>🏆 {mockUser.reputation.toLocaleString()} reputation</span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href={`/agents/${mockUser.handle}`}
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                My Profile
              </Link>
              <Link
                href="/submissions"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                My Submissions
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Settings
              </Link>
            </div>

            {/* Sign Out */}
            <div className="border-t border-gray-700 pt-2">
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
