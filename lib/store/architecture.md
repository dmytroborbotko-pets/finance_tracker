# 🏗️ Global State Architecture

## Overview

This document outlines the global state management strategy for the Finance Tracker app. We use a **hybrid approach** combining React Context API for global state and custom hooks for feature-specific state.

---

## State Management Strategy

### Why This Approach?

1. **Simplicity**: No external state management library needed
2. **Performance**: Minimal re-renders with proper context splitting
3. **Type Safety**: Full TypeScript support
4. **Flexibility**: Easy to migrate to Redux/Zustand if needed

### State Layers

```
┌─────────────────────────────────────────┐
│         Global Context Layer            │
│  (User, Currency, Theme, Online Status) │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│      Feature Context Layer (Optional)   │
│    (Accounts, Transactions, etc.)       │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│         Custom Hooks Layer              │
│  (useAccounts, useTransactions, etc.)   │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│            IndexedDB Layer              │
│          (Persistent Storage)           │
└─────────────────────────────────────────┘
```

---

## Global Context

### Purpose
Store rarely-changing, app-wide state that many components need.

### What Belongs in Global Context?

✅ **User information** (id, isGuest, email)
✅ **Default currency** (used across the app)
✅ **Online status** (affects sync, API calls)
✅ **Theme** (dark/light mode)
✅ **Language/Locale** (for i18n)

❌ **Accounts list** (too specific, use hooks)
❌ **Transactions** (frequently updated, use hooks)
❌ **Form state** (local to component)

### File Structure

```
lib/store/
├── GlobalContext.tsx       # Main global context
├── ThemeContext.tsx        # Theme-specific context
├── OnlineStatusContext.tsx # Network status context
└── types.ts                # Context types
```

---

## GlobalContext Implementation

### Types

```typescript
// lib/store/types.ts

export interface GlobalState {
  user: User | null;
  defaultCurrency: string;
  isOnline: boolean;
  isLoading: boolean;
}

export interface GlobalContextType {
  state: GlobalState;
  setUser: (user: User | null) => void;
  setDefaultCurrency: (currency: string) => void;
  updateOnlineStatus: (isOnline: boolean) => void;
}
```

### Context Provider

```typescript
// lib/store/GlobalContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/db/types';
import { GlobalState, GlobalContextType } from './types';

// Create context
const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// Provider component
export function GlobalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GlobalState>({
    user: null,
    defaultCurrency: 'UAH',
    isOnline: navigator.onLine,
    isLoading: true
  });

  // Initialize user from IndexedDB
  useEffect(() => {
    async function loadUser() {
      try {
        const db = await getDatabase();
        const user = await db.get('user', 'current');
        setState(prev => ({ ...prev, user, isLoading: false }));
      } catch (error) {
        console.error('Failed to load user:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }

    loadUser();
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Actions
  const setUser = (user: User | null) => {
    setState(prev => ({ ...prev, user }));
  };

  const setDefaultCurrency = async (currency: string) => {
    setState(prev => ({ ...prev, defaultCurrency: currency }));

    // Persist to DB
    try {
      const db = await getDatabase();
      const user = await db.get('user', 'current');
      if (user) {
        user.defaultCurrency = currency;
        await db.put('user', user);
      }
    } catch (error) {
      console.error('Failed to update default currency:', error);
    }
  };

  const updateOnlineStatus = (isOnline: boolean) => {
    setState(prev => ({ ...prev, isOnline }));
  };

  const value: GlobalContextType = {
    state,
    setUser,
    setDefaultCurrency,
    updateOnlineStatus
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
}

// Custom hook
export function useGlobalContext() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobalContext must be used within GlobalProvider');
  }
  return context;
}

// Convenience hooks
export function useUser() {
  const { state } = useGlobalContext();
  return state.user;
}

export function useDefaultCurrency() {
  const { state, setDefaultCurrency } = useGlobalContext();
  return [state.defaultCurrency, setDefaultCurrency] as const;
}

export function useOnlineStatus() {
  const { state } = useGlobalContext();
  return state.isOnline;
}
```

### Usage

```typescript
// app/layout.tsx
import { GlobalProvider } from '@/lib/store/GlobalContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <GlobalProvider>
          {children}
        </GlobalProvider>
      </body>
    </html>
  );
}

// In any component
import { useGlobalContext, useUser, useDefaultCurrency } from '@/lib/store/GlobalContext';

function MyComponent() {
  const { state } = useGlobalContext();
  const user = useUser();
  const [defaultCurrency, setDefaultCurrency] = useDefaultCurrency();

  return (
    <div>
      <p>User: {user?.email || 'Guest'}</p>
      <p>Currency: {defaultCurrency}</p>
      <p>Status: {state.isOnline ? 'Online' : 'Offline'}</p>
    </div>
  );
}
```

---

## ThemeContext Implementation

### Why Separate Context?

- Theme changes frequently (user toggles)
- Prevents unnecessary re-renders of components that don't use theme
- Can be easily removed if using a library like next-themes

### Implementation

```typescript
// lib/store/ThemeContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark'; // Actual theme after resolving 'system'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Load theme from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme;
    if (stored) {
      setThemeState(stored);
    }
  }, []);

  // Resolve theme (system -> light/dark)
  useEffect(() => {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedTheme(isDark ? 'dark' : 'light');

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

---

## Custom Hooks Strategy

### Why Custom Hooks?

- **Encapsulation**: Business logic separate from UI
- **Reusability**: Use same hook in multiple components
- **Testability**: Easier to test logic without UI
- **Direct DB Access**: No need for context overhead

### Hook Pattern

```typescript
// features/accounts/hooks/useAccounts.ts

import { useState, useEffect } from 'react';
import { Account, CreateAccountInput } from '@/lib/db/types';
import { getDatabase } from '@/lib/db';
import { dispatchAppEvent } from '@/lib/events';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load accounts
  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      setIsLoading(true);
      const db = await getDatabase();
      const allAccounts = await db.getAll('accounts');
      const activeAccounts = allAccounts.filter(a => !a.deletedAt);
      setAccounts(activeAccounts);
      setError(null);
    } catch (err) {
      setError('Failed to load accounts');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function createAccount(input: CreateAccountInput) {
    try {
      const db = await getDatabase();
      const account: Account = {
        id: crypto.randomUUID(),
        ...input,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null
      };

      await db.add('accounts', account);
      setAccounts(prev => [...prev, account]);

      // Dispatch event for other components
      dispatchAppEvent('account-created', account);

      return { success: true, data: account };
    } catch (err) {
      console.error('Failed to create account:', err);
      return { success: false, error: 'Failed to create account' };
    }
  }

  async function updateAccount(id: string, updates: Partial<Account>) {
    try {
      const db = await getDatabase();
      const existing = await db.get('accounts', id);
      if (!existing) throw new Error('Account not found');

      const updated = {
        ...existing,
        ...updates,
        updatedAt: Date.now()
      };

      await db.put('accounts', updated);
      setAccounts(prev => prev.map(a => a.id === id ? updated : a));

      dispatchAppEvent('account-updated', updated);

      return { success: true, data: updated };
    } catch (err) {
      console.error('Failed to update account:', err);
      return { success: false, error: 'Failed to update account' };
    }
  }

  async function deleteAccount(id: string) {
    try {
      const db = await getDatabase();
      const account = await db.get('accounts', id);
      if (!account) throw new Error('Account not found');

      // Soft delete
      account.deletedAt = Date.now();
      await db.put('accounts', account);
      setAccounts(prev => prev.filter(a => a.id !== id));

      dispatchAppEvent('account-deleted', account);

      return { success: true };
    } catch (err) {
      console.error('Failed to delete account:', err);
      return { success: false, error: 'Failed to delete account' };
    }
  }

  return {
    accounts,
    isLoading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    refresh: loadAccounts
  };
}
```

### Usage

```typescript
// components/AccountList.tsx

import { useAccounts } from '@/features/accounts/hooks/useAccounts';

function AccountList() {
  const { accounts, isLoading, createAccount } = useAccounts();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {accounts.map(account => (
        <div key={account.id}>{account.name}: {account.balance}</div>
      ))}
      <button onClick={() => createAccount({
        name: 'New Account',
        type: 'bank',
        balance: 0,
        currency: 'UAH',
        color: '#FF5733',
        icon: 'Wallet'
      })}>
        Add Account
      </button>
    </div>
  );
}
```

---

## Custom Hooks Library

### Core Hooks

```
features/
├── accounts/hooks/
│   └── useAccounts.ts          # Account CRUD operations
├── transactions/hooks/
│   ├── useTransactions.ts      # Transaction CRUD
│   ├── useTransactionFilters.ts # Filter logic
│   └── useTransactionStats.ts   # Statistics calculations
├── categories/hooks/
│   └── useCategories.ts        # Category CRUD
├── tags/hooks/
│   ├── useTags.ts              # Tag CRUD
│   └── useTagAutocomplete.ts   # Tag suggestions
├── currencies/hooks/
│   ├── useCurrencies.ts        # Currency list
│   └── useExchangeRates.ts     # Exchange rates
├── analytics/hooks/
│   ├── useAnalytics.ts         # General analytics
│   ├── useSalaryPeriods.ts     # Salary period logic
│   └── useBalanceHistory.ts    # Balance over time
└── settings/hooks/
    └── useSettings.ts          # App settings
```

### Hook Template

```typescript
// Template for creating new hooks

import { useState, useEffect } from 'react';
import { getDatabase } from '@/lib/db';

export function useFeature() {
  const [data, setData] = useState<Type[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const db = await getDatabase();
      const result = await db.getAll('storeName');
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function createItem(input: CreateInput) {
    // Implementation
  }

  async function updateItem(id: string, updates: Partial<Type>) {
    // Implementation
  }

  async function deleteItem(id: string) {
    // Implementation
  }

  return {
    data,
    isLoading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refresh: loadData
  };
}
```

---

## Performance Considerations

### 1. Context Splitting

Split contexts to minimize re-renders:

```typescript
// ❌ BAD: One large context
<AppContext.Provider value={{ user, theme, accounts, transactions }}>

// ✅ GOOD: Multiple focused contexts
<GlobalProvider>
  <ThemeProvider>
    {children}
  </ThemeProvider>
</GlobalProvider>
```

### 2. Memoization

```typescript
// Use useMemo for expensive calculations
const sortedAccounts = useMemo(() => {
  return accounts.sort((a, b) => a.name.localeCompare(b.name));
}, [accounts]);

// Use useCallback for event handlers passed to children
const handleCreate = useCallback(async (input: CreateAccountInput) => {
  await createAccount(input);
}, [createAccount]);
```

### 3. Selective Subscriptions

```typescript
// Only subscribe to what you need
function MyComponent() {
  const { accounts } = useAccounts(); // Only re-renders on account changes
  // Don't subscribe to everything unnecessarily
}
```

### 4. Optimistic Updates

```typescript
async function createTransaction(input: CreateTransactionInput) {
  // 1. Optimistically update UI
  const optimisticTransaction = {
    id: 'temp-' + Date.now(),
    ...input,
    createdAt: Date.now()
  };
  setTransactions(prev => [optimisticTransaction, ...prev]);

  try {
    // 2. Save to DB
    const db = await getDatabase();
    const transaction = { ...optimisticTransaction, id: crypto.randomUUID() };
    await db.add('transactions', transaction);

    // 3. Replace optimistic with real
    setTransactions(prev => prev.map(t =>
      t.id === optimisticTransaction.id ? transaction : t
    ));
  } catch (err) {
    // 4. Rollback on error
    setTransactions(prev => prev.filter(t => t.id !== optimisticTransaction.id));
    throw err;
  }
}
```

---

## State Synchronization

### Problem
Different components may have stale data if they don't coordinate.

### Solution: Event-Driven Architecture
(See `lib/events/README.md` for details)

```typescript
// Component A: Creates transaction
async function handleCreate() {
  await createTransaction(input);
  dispatchAppEvent('transaction-created', transaction);
}

// Component B: Listens for updates
useEffect(() => {
  const handler = (event: CustomEvent) => {
    const transaction = event.detail;
    // Update local state
    refreshBalance();
  };

  window.addEventListener('transaction-created', handler);
  return () => window.removeEventListener('transaction-created', handler);
}, []);
```

---

## Testing Strategy

### Unit Testing Hooks

```typescript
// features/accounts/hooks/useAccounts.test.ts

import { renderHook, act } from '@testing-library/react';
import { useAccounts } from './useAccounts';

describe('useAccounts', () => {
  it('should load accounts on mount', async () => {
    const { result } = renderHook(() => useAccounts());

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.accounts).toBeDefined();
  });

  it('should create account', async () => {
    const { result } = renderHook(() => useAccounts());

    await act(async () => {
      const response = await result.current.createAccount({
        name: 'Test Account',
        type: 'bank',
        balance: 1000,
        currency: 'UAH',
        color: '#FF5733',
        icon: 'Wallet'
      });

      expect(response.success).toBe(true);
    });

    expect(result.current.accounts).toHaveLength(1);
  });
});
```

---

## Summary

✅ **Global Context** for app-wide, rarely-changing state
✅ **Custom Hooks** for feature-specific logic and DB access
✅ **Context Splitting** to minimize re-renders
✅ **Event System** for cross-component communication
✅ **Type Safety** with TypeScript
✅ **Optimistic Updates** for instant UI feedback
✅ **Testing** strategy for hooks

This architecture provides a scalable, performant state management solution! 🚀
