# 🗄️ Database Layer

## Overview

Complete IndexedDB implementation with TypeScript, migrations, and utility functions for the Finance Tracker app.

---

## Quick Start

### Initialize Database

```typescript
import { initDatabase } from '@/lib/db';

// Initialize on app startup
await initDatabase();
```

### Basic CRUD Operations

```typescript
import { getDatabase, create, readById, update, deleteById } from '@/lib/db';
import type { Account, CreateAccountInput } from '@/lib/db/types';

// Create
const newAccount: Account = {
  id: crypto.randomUUID(),
  name: 'Приват24',
  type: 'bank',
  balance: 5000,
  currency: 'UAH',
  color: '#00FF00',
  icon: 'Wallet',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  deletedAt: null
};

await create('accounts', newAccount);

// Read
const result = await readById('accounts', newAccount.id);
if (result.success) {
  console.log(result.data);
}

// Update
newAccount.balance = 6000;
newAccount.updatedAt = Date.now();
await update('accounts', newAccount);

// Delete (soft delete recommended)
await softDelete('accounts', newAccount.id);
```

---

## Module Structure

```
lib/db/
├── index.ts          # Main exports
├── types.ts          # TypeScript interfaces and enums
├── stores.ts         # Object store definitions
├── connection.ts     # Database connection management
├── migrations.ts     # Migration system
├── seed.ts           # Default data seeding
├── utils.ts          # CRUD and query utilities
├── schema.md         # Schema documentation
└── README.md         # This file
```

---

## Connection Management

### Initialize Database

```typescript
import { initDatabase, getDatabase, closeDatabase } from '@/lib/db';

// Initialize (happens automatically on first getDatabase call)
const db = await initDatabase();

// Get existing connection
const db = await getDatabase();

// Close connection (cleanup on app unmount)
closeDatabase();
```

### Check Database Health

```typescript
import { checkDatabaseHealth, getDatabaseStats } from '@/lib/db';

// Health check
const health = await checkDatabaseHealth();
console.log('Healthy:', health.healthy);
console.log('Version:', health.version);
console.log('Errors:', health.errors);

// Statistics
const stats = await getDatabaseStats();
console.log('Accounts:', stats.accounts);
console.log('Transactions:', stats.transactions);
```

---

## CRUD Operations

### Create Records

```typescript
import { create, batchCreate } from '@/lib/db';

// Single create
const result = await create('accounts', newAccount);
if (result.success) {
  console.log('Created:', result.data);
}

// Batch create
const accounts = [account1, account2, account3];
await batchCreate('accounts', accounts);
```

### Read Records

```typescript
import { readById, readAll, readAllActive } from '@/lib/db';

// Read by ID
const account = await readById('accounts', accountId);

// Read all
const allAccounts = await readAll('accounts');

// Read all active (excludes soft-deleted)
const activeAccounts = await readAllActive('accounts');
```

### Update Records

```typescript
import { update, batchUpdate } from '@/lib/db';

// Single update
account.balance = 10000;
account.updatedAt = Date.now();
await update('accounts', account);

// Batch update
const accounts = [account1, account2];
await batchUpdate('accounts', accounts);
```

### Delete Records

```typescript
import { deleteById, softDelete, restore, batchDelete } from '@/lib/db';

// Soft delete (recommended)
await softDelete('accounts', accountId);

// Restore soft-deleted
await restore('accounts', accountId);

// Hard delete
await deleteById('accounts', accountId);

// Batch delete
await batchDelete('accounts', [id1, id2, id3]);
```

---

## Query Operations

### Query by Index

```typescript
import { queryByIndex } from '@/lib/db';

// Get all accounts in UAH
const uahAccounts = await queryByIndex('accounts', 'by-currency', 'UAH');

// Get all expense transactions
const expenses = await queryByIndex('transactions', 'by-type', 'expense');
```

### Query by Date Range

```typescript
import { queryByDateRange } from '@/lib/db';

// Get transactions from last 30 days
const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
const recentTransactions = await queryByDateRange(
  'transactions',
  'by-date',
  thirtyDaysAgo
);

// Get transactions for specific period
const startDate = new Date('2025-01-01').getTime();
const endDate = new Date('2025-01-31').getTime();
const januaryTransactions = await queryByDateRange(
  'transactions',
  'by-date',
  startDate,
  endDate
);
```

### Count Records

```typescript
import { count } from '@/lib/db';

const totalAccounts = await count('accounts');
const totalTransactions = await count('transactions');
```

### Pagination

```typescript
import { paginate } from '@/lib/db';

// Get first 50 transactions
const page1 = await paginate('transactions', 0, 50);

// Get next 50 transactions
const page2 = await paginate('transactions', 50, 50);
```

---

## Atomic Transactions

Execute multiple operations in a single transaction to ensure data consistency.

```typescript
import { atomicTransaction, getDatabase } from '@/lib/db';

// Transfer money between accounts
const result = await atomicTransaction(['accounts', 'transactions'], async (db) => {
  const tx = db.transaction(['accounts', 'transactions'], 'readwrite');

  // Deduct from source account
  const sourceAccount = await tx.objectStore('accounts').get(fromAccountId);
  if (!sourceAccount) throw new Error('Source account not found');
  sourceAccount.balance -= amount;
  await tx.objectStore('accounts').put(sourceAccount);

  // Add to destination account
  const destAccount = await tx.objectStore('accounts').get(toAccountId);
  if (!destAccount) throw new Error('Destination account not found');
  destAccount.balance += amount;
  await tx.objectStore('accounts').put(destAccount);

  // Create transaction record
  const transaction: Transaction = {
    id: crypto.randomUUID(),
    type: 'transfer',
    amount,
    currency: sourceAccount.currency,
    date: Date.now(),
    fromAccountId,
    toAccountId,
    categoryId: null,
    tags: [],
    description: 'Transfer',
    isSalary: false,
    isRefund: false,
    refundCategoryId: null,
    debtAccountId: null,
    version: 1,
    syncedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deletedAt: null
  };
  await tx.objectStore('transactions').add(transaction);

  await tx.done;
  return transaction;
});

if (result.success) {
  console.log('Transfer completed:', result.data);
}
```

---

## Advanced Database Access

### Direct Database Access

For complex queries, access the database directly:

```typescript
import { getDatabase } from '@/lib/db';

const db = await getDatabase();

// Use cursor for efficient iteration
const tx = db.transaction('transactions', 'readonly');
const store = tx.objectStore('transactions');
let cursor = await store.openCursor();

while (cursor) {
  const transaction = cursor.value;
  // Process transaction
  console.log(transaction);
  cursor = await cursor.continue();
}

await tx.done;
```

### Index Queries with Key Ranges

```typescript
import { getDatabase } from '@/lib/db';

const db = await getDatabase();
const tx = db.transaction('transactions', 'readonly');
const index = tx.objectStore('transactions').index('by-date');

// Get transactions from specific date range
const startDate = new Date('2025-01-01').getTime();
const endDate = new Date('2025-01-31').getTime();
const range = IDBKeyRange.bound(startDate, endDate);

const transactions = await index.getAll(range);
await tx.done;
```

---

## Migrations

### Current Version

```typescript
import { DB_VERSION } from '@/lib/db';

console.log('Current DB version:', DB_VERSION); // 1
```

### Check Migration Status

```typescript
import { checkDatabaseVersion } from '@/lib/db';

const versionInfo = await checkDatabaseVersion();
console.log('Current:', versionInfo.current);
console.log('Latest:', versionInfo.latest);
console.log('Needs migration:', versionInfo.needsMigration);
```

### Backup Database

```typescript
import { backupDatabase, exportDatabaseBackup, getDatabase } from '@/lib/db';

// Create JSON backup
const db = await getDatabase();
const json = await backupDatabase(db);
localStorage.setItem('db-backup', json);

// Export as downloadable file
await exportDatabaseBackup(db);
```

---

## Error Handling

All database operations return a `DbResult` type:

```typescript
interface DbResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### Handle Errors

```typescript
import { readById } from '@/lib/db';

const result = await readById('accounts', accountId);

if (result.success) {
  console.log('Account:', result.data);
} else {
  console.error('Error:', result.error);
  // Show user-friendly error message
  toast.error(result.error || 'Failed to load account');
}
```

### Error Handling Wrapper

```typescript
import { withErrorHandling } from '@/lib/db';

async function loadAccount(id: string) {
  return withErrorHandling('load account', async () => {
    const db = await getDatabase();
    return await db.get('accounts', id);
  });
}
```

---

## Usage in React Components

### With Custom Hooks

```typescript
// features/accounts/hooks/useAccounts.ts
import { useState, useEffect } from 'react';
import { readAllActive, create, update, softDelete } from '@/lib/db';
import type { Account, CreateAccountInput } from '@/lib/db/types';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setIsLoading(true);
    const result = await readAllActive('accounts');
    if (result.success && result.data) {
      setAccounts(result.data);
    }
    setIsLoading(false);
  }

  async function createAccount(input: CreateAccountInput) {
    const account: Account = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null
    };

    const result = await create('accounts', account);
    if (result.success) {
      setAccounts(prev => [...prev, account]);
    }
    return result;
  }

  return { accounts, isLoading, createAccount, refresh: loadAccounts };
}
```

### In Components

```typescript
// components/AccountList.tsx
import { useAccounts } from '@/features/accounts/hooks/useAccounts';

function AccountList() {
  const { accounts, isLoading, createAccount } = useAccounts();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {accounts.map(account => (
        <div key={account.id}>
          {account.name}: {account.balance} {account.currency}
        </div>
      ))}
    </div>
  );
}
```

---

## Testing

### Setup Test Database

```typescript
// setupTests.ts
import 'fake-indexeddb/auto';

beforeEach(async () => {
  // Clear database before each test
  const dbs = await indexedDB.databases();
  for (const db of dbs) {
    if (db.name) {
      indexedDB.deleteDatabase(db.name);
    }
  }
});
```

### Test CRUD Operations

```typescript
import { initDatabase, create, readById, update, deleteById } from '@/lib/db';

describe('Database CRUD', () => {
  beforeEach(async () => {
    await initDatabase();
  });

  it('should create and read account', async () => {
    const account: Account = {
      id: 'test-1',
      name: 'Test Account',
      type: 'bank',
      balance: 1000,
      currency: 'UAH',
      color: '#FF0000',
      icon: 'Wallet',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null
    };

    await create('accounts', account);
    const result = await readById('accounts', 'test-1');

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('Test Account');
  });
});
```

---

## Performance Tips

### 1. Use Indexes for Queries

Always query by indexed fields for better performance:

```typescript
// ✅ Good: Uses index
await queryByIndex('transactions', 'by-date', date);

// ❌ Bad: Full table scan
const all = await readAll('transactions');
const filtered = all.filter(t => t.date === date);
```

### 2. Batch Operations

Use batch operations instead of loops:

```typescript
// ✅ Good: Single transaction
await batchCreate('accounts', [account1, account2, account3]);

// ❌ Bad: Multiple transactions
for (const account of accounts) {
  await create('accounts', account);
}
```

### 3. Use Cursors for Large Datasets

```typescript
// ✅ Good: Memory efficient
const db = await getDatabase();
const tx = db.transaction('transactions', 'readonly');
let cursor = await tx.objectStore('transactions').openCursor();

while (cursor) {
  processTransaction(cursor.value);
  cursor = await cursor.continue();
}

// ❌ Bad: Loads all into memory
const all = await readAll('transactions');
all.forEach(processTransaction);
```

### 4. Cache Frequently Used Data

```typescript
let categoriesCache: Category[] | null = null;

async function getCategories(): Promise<Category[]> {
  if (!categoriesCache) {
    const result = await readAllActive('categories');
    categoriesCache = result.data || [];
  }
  return categoriesCache;
}

// Invalidate cache on updates
function invalidateCategoriesCache() {
  categoriesCache = null;
}
```

---

## Troubleshooting

### Database Not Opening

```typescript
import { checkDatabaseHealth, reinitDatabase } from '@/lib/db';

const health = await checkDatabaseHealth();
if (!health.healthy) {
  console.error('Database issues:', health.errors);
  // Try reinitializing
  await reinitDatabase();
}
```

### Quota Exceeded Error

```typescript
// Check storage usage
if ('storage' in navigator && 'estimate' in navigator.storage) {
  const estimate = await navigator.storage.estimate();
  console.log('Usage:', estimate.usage);
  console.log('Quota:', estimate.quota);

  if (estimate.usage && estimate.quota) {
    const percentUsed = (estimate.usage / estimate.quota) * 100;
    if (percentUsed > 80) {
      alert('Storage almost full. Please export and clear old data.');
    }
  }
}
```

### Version Conflicts

```typescript
// If you see version errors, check version status
const versionInfo = await checkDatabaseVersion();
console.log('Version info:', versionInfo);

// Force reload if version mismatch
if (versionInfo.needsMigration) {
  window.location.reload();
}
```

---

## Summary

✅ **TypeScript-first** - Full type safety
✅ **Migration System** - Version controlled schema
✅ **CRUD Utilities** - Generic operations
✅ **Soft Delete** - Data preservation
✅ **Atomic Transactions** - Data consistency
✅ **Query Builders** - Efficient queries
✅ **Error Handling** - Robust error management
✅ **React Integration** - Custom hooks pattern
✅ **Testing** - Test helpers included

The database layer provides everything needed for a production-ready IndexedDB implementation! 🚀
