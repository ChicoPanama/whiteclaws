'use client';

import { PrivyProvider as PrivySetup } from '@privy-io/react-auth';
import { ReactNode } from 'react';

interface PrivyProviderProps {
  children: ReactNode;
}

// Simple wrapper that conditionally renders based on app ID availability
export default function PrivyProvider({ children }: PrivyProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // If no valid app ID, just render children without Privy
  // This allows the app to build and run without Privy configured
  if (!appId || appId === 'your-privy-app-id' || appId === '') {
    return <>{children}</>;
  }

  return (
    <PrivySetup
      appId={appId}
      config={{
        loginMethods: ['email', 'wallet', 'twitter'],
        appearance: {
          theme: 'dark',
          accentColor: '#6366f1',
          logo: '/logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivySetup>
  );
}
