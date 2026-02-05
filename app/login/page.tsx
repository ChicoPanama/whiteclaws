import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
