# 📡 Event-Driven Communication System

## Overview

This document outlines the event-driven architecture for cross-component communication in the Finance Tracker app. This pattern enables loose coupling between features while maintaining data consistency.

---

## Why Event-Driven Architecture?

### Problems Without Events

```typescript
// ❌ Problem: Tight coupling
function TransactionForm() {
  const { createTransaction } = useTransactions();
  const { updateBalance } = useAccounts(); // Tight coupling
  const { refreshStats } = useAnalytics(); // Tight coupling

  async function handleSubmit() {
    await createTransaction(data);
    await updateBalance(accountId); // Must know about accounts
    await refreshStats(); // Must know about analytics
  }
}
```

### Solution with Events

```typescript
// ✅ Solution: Loose coupling
function TransactionForm() {
  const { createTransaction } = useTransactions();

  async function handleSubmit() {
    await createTransaction(data);
    dispatchAppEvent('transaction-created', transaction);
    // Components listening to this event will update themselves
  }
}

// Accounts component listens
function AccountCard() {
  const { accounts, refresh } = useAccounts();

  useAppEvent('transaction-created', () => {
    refresh(); // Update balance when transaction created
  });
}

// Analytics component listens
function AnalyticsChart() {
  const { statistics, refresh } = useAnalytics();

  useAppEvent('transaction-created', () => {
    refresh(); // Update stats when transaction created
  });
}
```

---

## Event Types

### Core Events

```typescript
// lib/db/types.ts (already defined)

export enum AppEventType {
  // Account events
  ACCOUNT_CREATED = 'account-created',
  ACCOUNT_UPDATED = 'account-updated',
  ACCOUNT_DELETED = 'account-deleted',

  // Transaction events
  TRANSACTION_CREATED = 'transaction-created',
  TRANSACTION_UPDATED = 'transaction-updated',
  TRANSACTION_DELETED = 'transaction-deleted',

  // Category events
  CATEGORY_CREATED = 'category-created',
  CATEGORY_UPDATED = 'category-updated',
  CATEGORY_DELETED = 'category-deleted',

  // Tag events
  TAG_CREATED = 'tag-created',

  // Balance events
  BALANCE_UPDATED = 'balance-updated',

  // Salary period events
  SALARY_PERIOD_CREATED = 'salary-period-created',

  // Currency events
  CURRENCY_CHANGED = 'currency-changed',
  EXCHANGE_RATES_UPDATED = 'exchange-rates-updated'
}

export interface AppEvent<T = unknown> {
  type: AppEventType;
  payload: T;
  timestamp: number;
}
```

---

## Event System Implementation

### Core Functions

```typescript
// lib/events/index.ts

import { AppEventType, AppEvent } from '@/lib/db/types';

/**
 * Dispatch a custom app event
 */
export function dispatchAppEvent<T = unknown>(
  type: AppEventType,
  payload: T
): void {
  const event: AppEvent<T> = {
    type,
    payload,
    timestamp: Date.now()
  };

  const customEvent = new CustomEvent(type, {
    detail: event,
    bubbles: true,
    cancelable: true
  });

  window.dispatchEvent(customEvent);

  // Optional: Log events in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Event] ${type}`, payload);
  }
}

/**
 * Subscribe to an app event
 */
export function subscribeToAppEvent<T = unknown>(
  type: AppEventType,
  handler: (event: AppEvent<T>) => void
): () => void {
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<AppEvent<T>>;
    handler(customEvent.detail);
  };

  window.addEventListener(type, listener);

  // Return unsubscribe function
  return () => {
    window.removeEventListener(type, listener);
  };
}

/**
 * Subscribe to multiple events
 */
export function subscribeToAppEvents<T = unknown>(
  types: AppEventType[],
  handler: (event: AppEvent<T>) => void
): () => void {
  const unsubscribers = types.map(type => subscribeToAppEvent(type, handler));

  // Return function to unsubscribe from all
  return () => {
    unsubscribers.forEach(unsubscribe => unsubscribe());
  };
}
```

### React Hook

```typescript
// lib/events/useAppEvent.ts

import { useEffect, useRef } from 'react';
import { AppEventType, AppEvent } from '@/lib/db/types';
import { subscribeToAppEvent } from './index';

/**
 * React hook to subscribe to app events
 */
export function useAppEvent<T = unknown>(
  type: AppEventType,
  handler: (event: AppEvent<T>) => void,
  deps: React.DependencyList = []
) {
  // Use ref to avoid re-subscribing unnecessarily
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const unsubscribe = subscribeToAppEvent<T>(type, (event) => {
      handlerRef.current(event);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, ...deps]);
}

/**
 * React hook to subscribe to multiple events
 */
export function useAppEvents<T = unknown>(
  types: AppEventType[],
  handler: (event: AppEvent<T>) => void,
  deps: React.DependencyList = []
) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const unsubscribers = types.map(type =>
      subscribeToAppEvent<T>(type, (event) => {
        handlerRef.current(event);
      })
    );

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types.join(','), ...deps]);
}
```

---

## Usage Examples

### 1. Dispatching Events

#### In Custom Hooks

```typescript
// features/transactions/hooks/useTransactions.ts

import { dispatchAppEvent } from '@/lib/events';

export function useTransactions() {
  async function createTransaction(input: CreateTransactionInput) {
    try {
      const transaction = await db.add('transactions', newTransaction);

      // Dispatch event
      dispatchAppEvent('transaction-created', transaction);

      return { success: true, data: transaction };
    } catch (err) {
      return { success: false, error: 'Failed to create' };
    }
  }

  async function updateTransaction(id: string, updates: Partial<Transaction>) {
    try {
      const updated = await db.put('transactions', updatedTransaction);

      // Dispatch event
      dispatchAppEvent('transaction-updated', updated);

      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: 'Failed to update' };
    }
  }

  async function deleteTransaction(id: string) {
    try {
      await db.put('transactions', deletedTransaction);

      // Dispatch event
      dispatchAppEvent('transaction-deleted', deletedTransaction);

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to delete' };
    }
  }

  return { createTransaction, updateTransaction, deleteTransaction };
}
```

#### In Components

```typescript
// components/TransactionForm.tsx

import { dispatchAppEvent } from '@/lib/events';

function TransactionForm() {
  async function handleSubmit(values: FormValues) {
    const result = await createTransaction(values);

    if (result.success) {
      // Event already dispatched in hook
      toast.success('Transaction created!');
      onClose();
    }
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 2. Listening to Events

#### Refresh Data on Events

```typescript
// components/AccountCard.tsx

import { useAppEvent } from '@/lib/events/useAppEvent';

function AccountCard({ accountId }: { accountId: string }) {
  const { account, refresh } = useAccount(accountId);

  // Refresh account when transactions change
  useAppEvent('transaction-created', (event) => {
    const transaction = event.payload;
    if (transaction.fromAccountId === accountId ||
        transaction.toAccountId === accountId) {
      refresh();
    }
  });

  useAppEvent('transaction-updated', (event) => {
    const transaction = event.payload;
    if (transaction.fromAccountId === accountId ||
        transaction.toAccountId === accountId) {
      refresh();
    }
  });

  useAppEvent('transaction-deleted', (event) => {
    const transaction = event.payload;
    if (transaction.fromAccountId === accountId ||
        transaction.toAccountId === accountId) {
      refresh();
    }
  });

  return (
    <div>
      <h3>{account.name}</h3>
      <p>Balance: {account.balance}</p>
    </div>
  );
}
```

#### Update Multiple Components

```typescript
// components/AnalyticsDashboard.tsx

import { useAppEvents } from '@/lib/events/useAppEvent';

function AnalyticsDashboard() {
  const { statistics, refresh } = useAnalytics();

  // Listen to multiple transaction events
  useAppEvents(
    [
      'transaction-created',
      'transaction-updated',
      'transaction-deleted'
    ],
    () => {
      refresh(); // Recalculate statistics
    }
  );

  return (
    <div>
      <h2>Analytics</h2>
      <p>Total Expenses: {statistics.totalExpenses}</p>
      <p>Total Income: {statistics.totalIncome}</p>
    </div>
  );
}
```

#### Conditional Logic

```typescript
// components/CategoryExpenses.tsx

import { useAppEvent } from '@/lib/events/useAppEvent';

function CategoryExpenses({ categoryId }: { categoryId: string }) {
  const { expenses, refresh } = useCategoryExpenses(categoryId);

  useAppEvent('transaction-created', (event) => {
    const transaction = event.payload;

    // Only refresh if transaction belongs to this category
    if (transaction.categoryId === categoryId) {
      refresh();
    }
  });

  return <div>...</div>;
}
```

### 3. Complex Event Flows

#### Salary Period Creation

```typescript
// features/transactions/hooks/useTransactions.ts

async function createTransaction(input: CreateTransactionInput) {
  const transaction = await db.add('transactions', newTransaction);

  // Dispatch main event
  dispatchAppEvent('transaction-created', transaction);

  // If salary, create salary period and dispatch additional event
  if (transaction.isSalary) {
    const salaryPeriod = await createSalaryPeriod(transaction);
    dispatchAppEvent('salary-period-created', salaryPeriod);
  }

  return { success: true, data: transaction };
}

// Components can listen to either event
function SalaryPeriodList() {
  const { periods, refresh } = useSalaryPeriods();

  useAppEvent('salary-period-created', () => {
    refresh();
  });

  return <div>...</div>;
}
```

#### Balance Updates

```typescript
// features/accounts/hooks/useAccounts.ts

async function updateAccountBalance(accountId: string, amount: number) {
  const account = await db.get('accounts', accountId);
  account.balance += amount;
  await db.put('accounts', account);

  // Dispatch balance update event
  dispatchAppEvent('balance-updated', {
    accountId,
    oldBalance: account.balance - amount,
    newBalance: account.balance
  });
}

// Components listening for balance changes
function BalanceChart() {
  const { balanceHistory, refresh } = useBalanceHistory();

  useAppEvent('balance-updated', () => {
    refresh();
  });

  return <LineChart data={balanceHistory} />;
}
```

---

## Event Flow Diagrams

### Transaction Creation Flow

```
User Action
    ↓
TransactionForm
    ↓
createTransaction()
    ↓
IndexedDB.add()
    ↓
dispatchAppEvent('transaction-created')
    ↓
    ├─→ AccountCard (refresh balance)
    ├─→ AnalyticsDashboard (refresh stats)
    ├─→ TransactionList (add to list)
    ├─→ CategoryChart (update chart)
    └─→ BalanceHistory (update history)
```

### Account Update Flow

```
User Action
    ↓
AccountEditForm
    ↓
updateAccount()
    ↓
IndexedDB.put()
    ↓
dispatchAppEvent('account-updated')
    ↓
    ├─→ AccountList (update item)
    ├─→ AccountSelector (update dropdown)
    ├─→ TransactionList (update account names)
    └─→ Dashboard (update total balance)
```

---

## Best Practices

### 1. Event Naming

Use clear, descriptive names:

```typescript
// ✅ Good
'transaction-created'
'account-updated'
'balance-updated'

// ❌ Bad
'create'
'update'
'change'
```

### 2. Event Payload

Include all necessary data in payload:

```typescript
// ✅ Good
dispatchAppEvent('transaction-created', {
  transaction: newTransaction,
  affectedAccountIds: [fromAccountId, toAccountId]
});

// ❌ Bad
dispatchAppEvent('transaction-created', transactionId); // Need to fetch full data
```

### 3. Avoid Event Chains

Don't create events that trigger other events (can cause infinite loops):

```typescript
// ❌ Bad
useAppEvent('transaction-created', () => {
  createAccount(); // Creates account, which fires 'account-created'
});

useAppEvent('account-created', () => {
  createTransaction(); // Creates transaction, which fires 'transaction-created'
});
// Infinite loop!
```

### 4. Debounce High-Frequency Events

```typescript
import { debounce } from 'lodash';

function SearchResults() {
  const { search } = useSearch();

  const debouncedRefresh = useMemo(
    () => debounce(() => search(), 300),
    [search]
  );

  useAppEvent('transaction-created', debouncedRefresh);
  useAppEvent('transaction-updated', debouncedRefresh);

  return <div>...</div>;
}
```

### 5. Clean Up Listeners

Always clean up in useEffect:

```typescript
useEffect(() => {
  const unsubscribe = subscribeToAppEvent('transaction-created', handler);

  return () => {
    unsubscribe(); // Clean up on unmount
  };
}, []);
```

### 6. Type Safety

Use TypeScript generics for type-safe events:

```typescript
// Define event payload types
interface TransactionCreatedPayload {
  transaction: Transaction;
  affectedAccountIds: string[];
}

// Dispatch with type
dispatchAppEvent<TransactionCreatedPayload>('transaction-created', {
  transaction: newTransaction,
  affectedAccountIds: [fromAccountId, toAccountId]
});

// Listen with type
useAppEvent<TransactionCreatedPayload>('transaction-created', (event) => {
  const { transaction, affectedAccountIds } = event.payload;
  // TypeScript knows the structure
});
```

---

## Testing Events

### Test Event Dispatch

```typescript
// features/transactions/hooks/useTransactions.test.ts

import { dispatchAppEvent } from '@/lib/events';

jest.mock('@/lib/events', () => ({
  dispatchAppEvent: jest.fn()
}));

describe('useTransactions', () => {
  it('should dispatch event on create', async () => {
    const { result } = renderHook(() => useTransactions());

    await act(async () => {
      await result.current.createTransaction(mockInput);
    });

    expect(dispatchAppEvent).toHaveBeenCalledWith(
      'transaction-created',
      expect.objectContaining({ id: expect.any(String) })
    );
  });
});
```

### Test Event Listeners

```typescript
// components/AccountCard.test.tsx

import { dispatchAppEvent } from '@/lib/events';

describe('AccountCard', () => {
  it('should refresh on transaction-created event', async () => {
    const mockRefresh = jest.fn();
    const { result } = renderHook(() => useAccount('account-1'));
    result.current.refresh = mockRefresh;

    // Dispatch event
    act(() => {
      dispatchAppEvent('transaction-created', mockTransaction);
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
```

---

## Event Debugging

### Event Logger

```typescript
// lib/events/logger.ts

export function enableEventLogging() {
  if (process.env.NODE_ENV !== 'development') return;

  const allEvents = Object.values(AppEventType);

  allEvents.forEach(eventType => {
    subscribeToAppEvent(eventType, (event) => {
      console.group(`[Event] ${event.type}`);
      console.log('Timestamp:', new Date(event.timestamp).toISOString());
      console.log('Payload:', event.payload);
      console.trace('Stack trace');
      console.groupEnd();
    });
  });

  console.log('Event logging enabled');
}

// In development
if (typeof window !== 'undefined') {
  enableEventLogging();
}
```

### Event Monitor Component

```typescript
// components/dev/EventMonitor.tsx

'use client';

import { useState, useEffect } from 'react';
import { AppEventType } from '@/lib/db/types';
import { subscribeToAppEvents } from '@/lib/events';

export function EventMonitor() {
  const [events, setEvents] = useState<Array<{ type: string; timestamp: number }>>([]);

  useEffect(() => {
    const unsubscribe = subscribeToAppEvents(
      Object.values(AppEventType),
      (event) => {
        setEvents(prev => [...prev, { type: event.type, timestamp: event.timestamp }].slice(-50));
      }
    );

    return unsubscribe;
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-0 right-0 bg-black text-white p-4 max-h-60 overflow-auto">
      <h3>Event Monitor</h3>
      {events.map((event, i) => (
        <div key={i} className="text-xs">
          {new Date(event.timestamp).toLocaleTimeString()} - {event.type}
        </div>
      ))}
    </div>
  );
}
```

---

## Performance Considerations

### 1. Event Batching

For high-frequency updates, batch events:

```typescript
let batchTimer: NodeJS.Timeout | null = null;
const pendingEvents: AppEvent[] = [];

export function dispatchBatchedEvent(type: AppEventType, payload: unknown) {
  pendingEvents.push({ type, payload, timestamp: Date.now() });

  if (batchTimer) clearTimeout(batchTimer);

  batchTimer = setTimeout(() => {
    dispatchAppEvent('batch-update', pendingEvents);
    pendingEvents.length = 0;
    batchTimer = null;
  }, 100);
}
```

### 2. Selective Updates

Only update when necessary:

```typescript
useAppEvent('transaction-updated', (event) => {
  const transaction = event.payload;

  // Only refresh if this transaction affects current view
  if (shouldRefresh(transaction)) {
    refresh();
  }
});
```

### 3. Memoized Handlers

```typescript
const handleTransactionCreated = useCallback((event: AppEvent) => {
  // Handler logic
}, [/* dependencies */]);

useAppEvent('transaction-created', handleTransactionCreated);
```

---

## Summary

✅ **Loose Coupling** between components
✅ **Type-Safe Events** with TypeScript
✅ **React Hooks** for easy integration
✅ **Event Debugging** tools
✅ **Performance** optimizations
✅ **Testing** strategies
✅ **Best Practices** documented

This event system enables scalable, maintainable cross-component communication! 📡
