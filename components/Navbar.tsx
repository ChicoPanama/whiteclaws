'use client';

import Link from 'next/link';
import UserMenu from './UserMenu';

export default function Navbar() {
  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-white">
              WhiteClaws
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/protocols"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Protocols
            </Link>
            <Link
              href="/leaderboard"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="/worldboard"
              className="text-gray-300 hover:text-white transition-colors"
            >
              World Board
            </Link>
            <Link
              href="/resources"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Resources
            </Link>
          </div>

          {/* Mobile menu button - simplified */}
          <div className="md:hidden">
            <button className="text-gray-300 hover:text-white p-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* User Menu */}
          <div className="hidden md:block">
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
