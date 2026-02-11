'use client';

import { PrivyProvider as PrivySetup } from '@privy-io/react-auth';
import { ReactNode } from 'react';

interface PrivyProviderProps {
  children: ReactNode;
}

export default function PrivyProvider({ children }: PrivyProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId || appId === 'your-privy-app-id' || appId === '') {
    return <>{children}</>;
  }

  return (
    <PrivySetup
      appId={appId}
      config={{
        loginMethods: ['email', 'wallet', 'twitter', 'github'],
        appearance: {
          theme: 'dark',
          accentColor: '#89E06D',
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
