import { Suspense } from 'react';
import DashboardContent from './DashboardContent';

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-800 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6 h-32"></div>
              <div className="bg-gray-800 rounded-lg p-6 h-32"></div>
              <div className="bg-gray-800 rounded-lg p-6 h-32"></div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 h-48 mb-8"></div>
            <div className="bg-gray-800 rounded-lg p-4 h-40"></div>
          </div>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}