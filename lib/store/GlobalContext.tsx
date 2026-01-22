'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/db/types';

interface GlobalContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  defaultCurrency: string;
  setDefaultCurrency: (currency: string) => void;
  isOnline: boolean;
  lastOnlineAt: number | null;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [defaultCurrency, setDefaultCurrency] = useState<string>('UAH');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load user data from IndexedDB on mount
  useEffect(() => {
    setMounted(true);

    async function loadUserData() {
      try {
        // Import dynamically to avoid SSR issues
        const { readById } = await import('@/lib/db/utils');
        const result = await readById('user', 'default-user');

        if (result.success && result.data) {
          setUser(result.data);
          setDefaultCurrency(result.data.defaultCurrency);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    }

    if (typeof window !== 'undefined') {
      loadUserData();
    }
  }, []);

  // Track online/offline status
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineAt(Date.now());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Set initial online status
    setIsOnline(navigator.onLine);
    if (navigator.onLine) {
      setLastOnlineAt(Date.now());
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [mounted]);

  // Prevent flash during SSR
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <GlobalContext.Provider
      value={{
        user,
        setUser,
        defaultCurrency,
        setDefaultCurrency,
        isOnline,
        lastOnlineAt,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    // Return default values during SSR to avoid errors
    return {
      user: null,
      setUser: () => {},
      defaultCurrency: 'UAH',
      setDefaultCurrency: () => {},
      isOnline: true,
      lastOnlineAt: null,
    };
  }
  return context;
}
