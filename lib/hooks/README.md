# 🪝 Custom Hooks Strategy

## Overview

This document outlines the custom hooks strategy for the Finance Tracker app. Custom hooks encapsulate business logic, database operations, and state management for each feature.

---

## Hook Architecture

### Core Principles

1. **Single Responsibility**: Each hook manages one domain (accounts, transactions, etc.)
2. **Encapsulation**: Business logic hidden from components
3. **Reusability**: Same hook used across multiple components
4. **Type Safety**: Full TypeScript support
5. **Testability**: Easy to test without rendering components

### Hook Layers

```
┌──────────────────────────────────────┐
│      UI Components                   │
│  (Pure presentational logic)         │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│      Custom Hooks                    │
│  (Business logic + State)            │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│      Database Layer                  │
│  (IndexedDB operations)              │
└──────────────────────────────────────┘
```

---

## Hook Categories

### 1. Data Management Hooks

**Purpose**: CRUD operations for database entities

**Examples:**
- `useAccounts()` - Account management
- `useTransactions()` - Transaction management
- `useCategories()` - Category management
- `useTags()` - Tag management

**Pattern:**

```typescript
function useEntity() {
  return {
    data: Entity[],
    isLoading: boolean,
    error: string | null,
    create: (input) => Promise<Result>,
    update: (id, updates) => Promise<Result>,
    delete: (id) => Promise<Result>,
    refresh: () => Promise<void>
  }
}
```

### 2. Query/Filter Hooks

**Purpose**: Advanced queries and filtering

**Examples:**
- `useTransactionFilters()` - Transaction filtering
- `useAccountsByType()` - Filter accounts by type
- `useTransactionSearch()` - Search transactions

**Pattern:**

```typescript
function useEntityQuery(filters: Filters) {
  return {
    data: Entity[],
    isLoading: boolean,
    totalCount: number,
    hasMore: boolean,
    loadMore: () => Promise<void>
  }
}
```

### 3. Analytics/Statistics Hooks

**Purpose**: Derived data and calculations

**Examples:**
- `useAnalytics()` - General statistics
- `useCategoryExpenses()` - Expenses by category
- `useBalanceHistory()` - Balance over time
- `useSalaryPeriods()` - Salary period calculations

**Pattern:**

```typescript
function useAnalytics(period: AnalyticsPeriod) {
  return {
    statistics: Statistics,
    isLoading: boolean,
    comparison: Comparison | null
  }
}
```

### 4. Utility Hooks

**Purpose**: Reusable utilities

**Examples:**
- `useDebounce()` - Debounce values
- `useLocalStorage()` - Persistent state
- `usePagination()` - Pagination logic
- `useInfiniteScroll()` - Infinite scrolling

**Pattern:**

```typescript
function useUtility(input: Input) {
  return {
    value: Output,
    helpers: { ... }
  }
}
```

### 5. Integration Hooks

**Purpose**: External API integrations

**Examples:**
- `useExchangeRates()` - Currency exchange rates
- `useCurrencyConversion()` - Convert between currencies

**Pattern:**

```typescript
function useIntegration() {
  return {
    data: Data,
    isLoading: boolean,
    error: Error | null,
    refetch: () => Promise<void>
  }
}
```

---

## Standard Hook Structure

### Base Template

```typescript
// features/[feature]/hooks/use[Feature].ts

import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/lib/db';
import { dispatchAppEvent } from '@/lib/events';
import type { Entity, CreateEntityInput, UpdateEntityInput } from '@/lib/db/types';

export function useEntity() {
  // State
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadEntities();
  }, []);

  // Load function
  const loadEntities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const db = await getDatabase();
      const allEntities = await db.getAll('entities');
      const activeEntities = allEntities.filter(e => !e.deletedAt);

      setEntities(activeEntities);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Failed to load entities:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create function
  const createEntity = useCallback(async (input: CreateEntityInput) => {
    try {
      const db = await getDatabase();

      const entity: Entity = {
        id: crypto.randomUUID(),
        ...input,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null
      };

      await db.add('entities', entity);

      // Optimistic update
      setEntities(prev => [...prev, entity]);

      // Dispatch event
      dispatchAppEvent('entity-created', entity);

      return { success: true, data: entity };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create';
      console.error('Create failed:', err);
      return { success: false, error: message };
    }
  }, []);

  // Update function
  const updateEntity = useCallback(async (id: string, updates: UpdateEntityInput) => {
    try {
      const db = await getDatabase();

      const existing = await db.get('entities', id);
      if (!existing) {
        throw new Error('Entity not found');
      }

      const updated: Entity = {
        ...existing,
        ...updates,
        updatedAt: Date.now()
      };

      await db.put('entities', updated);

      // Optimistic update
      setEntities(prev => prev.map(e => e.id === id ? updated : e));

      // Dispatch event
      dispatchAppEvent('entity-updated', updated);

      return { success: true, data: updated };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update';
      console.error('Update failed:', err);
      return { success: false, error: message };
    }
  }, []);

  // Delete function (soft delete)
  const deleteEntity = useCallback(async (id: string) => {
    try {
      const db = await getDatabase();

      const entity = await db.get('entities', id);
      if (!entity) {
        throw new Error('Entity not found');
      }

      entity.deletedAt = Date.now();
      await db.put('entities', entity);

      // Optimistic update
      setEntities(prev => prev.filter(e => e.id !== id));

      // Dispatch event
      dispatchAppEvent('entity-deleted', entity);

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      console.error('Delete failed:', err);
      return { success: false, error: message };
    }
  }, []);

  return {
    entities,
    isLoading,
    error,
    createEntity,
    updateEntity,
    deleteEntity,
    refresh: loadEntities
  };
}
```

---

## Example Hooks

### 1. useAccounts

```typescript
// features/accounts/hooks/useAccounts.ts

import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/lib/db';
import { dispatchAppEvent } from '@/lib/events';
import type { Account, CreateAccountInput } from '@/lib/db/types';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const db = await getDatabase();
      const allAccounts = await db.getAll('accounts');
      const active = allAccounts.filter(a => !a.deletedAt);
      setAccounts(active);
      setError(null);
    } catch (err) {
      setError('Failed to load accounts');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAccount = useCallback(async (input: CreateAccountInput) => {
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
      dispatchAppEvent('account-created', account);

      return { success: true, data: account };
    } catch (err) {
      console.error('Failed to create account:', err);
      return { success: false, error: 'Failed to create account' };
    }
  }, []);

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    try {
      const db = await getDatabase();
      const existing = await db.get('accounts', id);
      if (!existing) throw new Error('Account not found');

      const updated = { ...existing, ...updates, updatedAt: Date.now() };
      await db.put('accounts', updated);
      setAccounts(prev => prev.map(a => a.id === id ? updated : a));
      dispatchAppEvent('account-updated', updated);

      return { success: true, data: updated };
    } catch (err) {
      console.error('Failed to update account:', err);
      return { success: false, error: 'Failed to update account' };
    }
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    try {
      const db = await getDatabase();
      const account = await db.get('accounts', id);
      if (!account) throw new Error('Account not found');

      account.deletedAt = Date.now();
      await db.put('accounts', account);
      setAccounts(prev => prev.filter(a => a.id !== id));
      dispatchAppEvent('account-deleted', account);

      return { success: true };
    } catch (err) {
      console.error('Failed to delete account:', err);
      return { success: false, error: 'Failed to delete account' };
    }
  }, []);

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

### 2. useTransactionFilters

```typescript
// features/transactions/hooks/useTransactionFilters.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getDatabase } from '@/lib/db';
import type { Transaction, TransactionFilters } from '@/lib/db/types';

export function useTransactionFilters(initialFilters: TransactionFilters = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);

  // Load and filter transactions
  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const db = await getDatabase();

      // Start with all transactions
      let result = await db.getAll('transactions');

      // Filter by date range
      if (filters.startDate) {
        result = result.filter(t => t.date >= filters.startDate!);
      }
      if (filters.endDate) {
        result = result.filter(t => t.date <= filters.endDate!);
      }

      // Filter by accounts
      if (filters.accountIds && filters.accountIds.length > 0) {
        result = result.filter(t =>
          filters.accountIds!.includes(t.fromAccountId || '') ||
          filters.accountIds!.includes(t.toAccountId || '')
        );
      }

      // Filter by categories
      if (filters.categoryIds && filters.categoryIds.length > 0) {
        result = result.filter(t =>
          t.categoryId && filters.categoryIds!.includes(t.categoryId)
        );
      }

      // Filter by tags
      if (filters.tagIds && filters.tagIds.length > 0) {
        result = result.filter(t =>
          t.tags.some(tag => filters.tagIds!.includes(tag))
        );
      }

      // Filter by type
      if (filters.types && filters.types.length > 0) {
        result = result.filter(t => filters.types!.includes(t.type));
      }

      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        result = result.filter(t =>
          t.description.toLowerCase().includes(query)
        );
      }

      // Exclude deleted
      if (!filters.includeDeleted) {
        result = result.filter(t => !t.deletedAt);
      }

      setTransactions(result);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Computed values
  const totalAmount = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  return {
    transactions,
    filters,
    isLoading,
    totalAmount,
    updateFilters,
    clearFilters,
    refresh: loadTransactions
  };
}
```

### 3. useAnalytics

```typescript
// features/analytics/hooks/useAnalytics.ts

import { useState, useEffect, useMemo } from 'react';
import { getDatabase } from '@/lib/db';
import { useDefaultCurrency } from '@/lib/store/GlobalContext';
import type { AnalyticsPeriod, PeriodStatistics, CategoryExpense } from '@/lib/db/types';

export function useAnalytics(period: AnalyticsPeriod) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultCurrency] = useDefaultCurrency();

  useEffect(() => {
    loadData();
  }, [period]);

  async function loadData() {
    try {
      setIsLoading(true);
      const db = await getDatabase();

      // Load transactions for period
      const allTransactions = await db.getAll('transactions');
      const filtered = allTransactions.filter(t => {
        if (t.deletedAt) return false;
        if (t.date < period.startDate) return false;
        if (period.endDate && t.date > period.endDate) return false;
        return true;
      });

      const allCategories = await db.getAll('categories');

      setTransactions(filtered);
      setCategories(allCategories);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate total income
  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income' || t.type === 'debt_return')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' || t.type === 'debt_payment')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Calculate expenses by category
  const categoryBreakdown = useMemo((): CategoryExpense[] => {
    const expensesByCategory = new Map<string, number>();
    const refundsByCategory = new Map<string, number>();
    const countsByCategory = new Map<string, number>();

    transactions.forEach(t => {
      if (t.type === 'expense' && t.categoryId) {
        const current = expensesByCategory.get(t.categoryId) || 0;
        expensesByCategory.set(t.categoryId, current + t.amount);

        const count = countsByCategory.get(t.categoryId) || 0;
        countsByCategory.set(t.categoryId, count + 1);
      }

      if (t.isRefund && t.refundCategoryId) {
        const current = refundsByCategory.get(t.refundCategoryId) || 0;
        refundsByCategory.set(t.refundCategoryId, current + t.amount);
      }
    });

    return Array.from(expensesByCategory.entries()).map(([categoryId, amount]) => {
      const category = categories.find(c => c.id === categoryId);
      const refundAmount = refundsByCategory.get(categoryId) || 0;
      const netAmount = amount - refundAmount;
      const percentage = (netAmount / totalExpenses) * 100;

      return {
        categoryId,
        categoryName: category?.name || 'Unknown',
        categoryColor: category?.color || '#000000',
        categoryIcon: category?.icon || 'Package',
        totalAmount: amount,
        refundAmount,
        netAmount,
        percentage,
        transactionCount: countsByCategory.get(categoryId) || 0
      };
    }).sort((a, b) => b.netAmount - a.netAmount);
  }, [transactions, categories, totalExpenses]);

  const statistics: PeriodStatistics = {
    period,
    totalIncome,
    totalExpenses,
    netSavings: totalIncome - totalExpenses,
    transactionCount: transactions.length,
    categoryBreakdown
  };

  return {
    statistics,
    isLoading,
    refresh: loadData
  };
}
```

---

## Hook Best Practices

### 1. Memoization

Use `useMemo` for expensive calculations:

```typescript
const sortedAccounts = useMemo(() => {
  return accounts.sort((a, b) => a.name.localeCompare(b.name));
}, [accounts]);
```

Use `useCallback` for function references:

```typescript
const handleCreate = useCallback(async (input: CreateInput) => {
  await createEntity(input);
}, [createEntity]);
```

### 2. Error Handling

Always handle errors gracefully:

```typescript
try {
  // Operation
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  setError(message);
  console.error('Operation failed:', err);
  return { success: false, error: message };
}
```

### 3. Loading States

Provide loading feedback:

```typescript
const [isLoading, setIsLoading] = useState(true);

async function loadData() {
  try {
    setIsLoading(true);
    // Load data
  } finally {
    setIsLoading(false);
  }
}
```

### 4. Cleanup

Clean up subscriptions and listeners:

```typescript
useEffect(() => {
  const handler = (event: CustomEvent) => {
    // Handle event
  };

  window.addEventListener('custom-event', handler);

  return () => {
    window.removeEventListener('custom-event', handler);
  };
}, []);
```

### 5. TypeScript

Always type your hooks:

```typescript
export function useEntity(): {
  entities: Entity[];
  isLoading: boolean;
  error: string | null;
  createEntity: (input: CreateInput) => Promise<Result>;
  updateEntity: (id: string, updates: Partial<Entity>) => Promise<Result>;
  deleteEntity: (id: string) => Promise<Result>;
  refresh: () => Promise<void>;
} {
  // Implementation
}
```

---

## Testing Hooks

### Setup

```typescript
// setupTests.ts
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
```

### Test Example

```typescript
// features/accounts/hooks/useAccounts.test.ts

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAccounts } from './useAccounts';

describe('useAccounts', () => {
  beforeEach(async () => {
    // Clear database before each test
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });

  it('should load accounts on mount', async () => {
    const { result } = renderHook(() => useAccounts());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.accounts).toBeDefined();
  });

  it('should create account', async () => {
    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let response;
    await act(async () => {
      response = await result.current.createAccount({
        name: 'Test Account',
        type: 'bank',
        balance: 1000,
        currency: 'UAH',
        color: '#FF5733',
        icon: 'Wallet'
      });
    });

    expect(response.success).toBe(true);
    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.accounts[0].name).toBe('Test Account');
  });

  it('should update account', async () => {
    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Create account
    let accountId;
    await act(async () => {
      const response = await result.current.createAccount({
        name: 'Test Account',
        type: 'bank',
        balance: 1000,
        currency: 'UAH',
        color: '#FF5733',
        icon: 'Wallet'
      });
      accountId = response.data.id;
    });

    // Update account
    await act(async () => {
      await result.current.updateAccount(accountId, { name: 'Updated Account' });
    });

    expect(result.current.accounts[0].name).toBe('Updated Account');
  });

  it('should delete account (soft delete)', async () => {
    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Create account
    let accountId;
    await act(async () => {
      const response = await result.current.createAccount({
        name: 'Test Account',
        type: 'bank',
        balance: 1000,
        currency: 'UAH',
        color: '#FF5733',
        icon: 'Wallet'
      });
      accountId = response.data.id;
    });

    expect(result.current.accounts).toHaveLength(1);

    // Delete account
    await act(async () => {
      await result.current.deleteAccount(accountId);
    });

    expect(result.current.accounts).toHaveLength(0);
  });
});
```

---

## Summary

✅ **Standard Structure** for all hooks
✅ **CRUD Operations** encapsulated
✅ **Error Handling** built-in
✅ **Loading States** managed
✅ **Type Safety** with TypeScript
✅ **Optimistic Updates** for instant UI
✅ **Event Dispatch** for cross-component sync
✅ **Memoization** for performance
✅ **Testing Strategy** with examples

This hooks strategy provides a consistent, maintainable approach to state management! 🪝
