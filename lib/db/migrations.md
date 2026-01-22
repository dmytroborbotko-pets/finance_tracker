# 🔄 Database Migration Strategy

## Overview

This document outlines the migration strategy for the Finance Tracker IndexedDB database. It covers version management, migration patterns, and best practices for evolving the schema over time.

---

## Migration Philosophy

### Key Principles

1. **Forward-Only Migrations**: No rollbacks (IndexedDB limitation)
2. **Backwards Compatibility**: New fields are optional
3. **Data Preservation**: Never lose user data
4. **Incremental Changes**: Small, tested migrations
5. **Seed Data Management**: Consistent default data

### Challenges with IndexedDB

- No `ALTER TABLE` equivalent
- Cannot modify existing object stores in-place
- Must recreate stores with new schema
- Version changes trigger `onupgradeneeded` event only once

---

## Version Numbering

```
Version Format: Integer (1, 2, 3, ...)

v1 - Initial schema (Sprint 1)
v2 - Future: Add new fields (TBD)
v3 - Future: Add new stores (TBD)
```

### Version History

| Version | Date | Changes |
|---------|------|---------|
| v1 | 2025-01-22 | Initial schema with 8 stores |
| v2 | TBD | Add sync fields (version, syncedAt, deviceId) |
| v3 | TBD | Add budgets store |

---

## Migration Implementation

### Core Migration Function

```typescript
// lib/db/migrations.ts

import { IDBPDatabase } from 'idb';
import { DBSchema } from './schema';

export async function runMigrations(
  db: IDBPDatabase<DBSchema>,
  oldVersion: number,
  newVersion: number
): Promise<void> {
  console.log(`Migrating database from v${oldVersion} to v${newVersion}`);

  // Run migrations sequentially
  if (oldVersion < 1) {
    await migrateToV1(db);
  }

  if (oldVersion < 2) {
    await migrateToV2(db);
  }

  if (oldVersion < 3) {
    await migrateToV3(db);
  }

  console.log(`Migration complete: v${newVersion}`);
}
```

---

## Migration v1: Initial Schema

### Goal
Create all 8 object stores with indexes and seed default data.

### Stores Created

1. **accounts**
   - Indexes: by-currency, by-deleted, by-type
2. **transactions**
   - Indexes: by-date, by-account, by-category, by-type, by-tags, by-deleted
3. **categories**
   - Indexes: by-deleted, by-type
4. **tags**
   - Indexes: by-name, by-usage
5. **currencies**
   - No indexes (small dataset)
6. **salaryPeriods**
   - Indexes: by-date
7. **exchangeRates**
   - Indexes: by-date
8. **user**
   - No indexes (single record)

### Implementation

```typescript
async function migrateToV1(db: IDBPDatabase): Promise<void> {
  // 1. Create accounts store
  const accountsStore = db.createObjectStore('accounts', { keyPath: 'id' });
  accountsStore.createIndex('by-currency', 'currency', { unique: false });
  accountsStore.createIndex('by-deleted', 'deletedAt', { unique: false });
  accountsStore.createIndex('by-type', 'type', { unique: false });

  // 2. Create transactions store
  const transactionsStore = db.createObjectStore('transactions', { keyPath: 'id' });
  transactionsStore.createIndex('by-date', 'date', { unique: false });
  transactionsStore.createIndex('by-account', ['fromAccountId', 'toAccountId'], { unique: false });
  transactionsStore.createIndex('by-category', 'categoryId', { unique: false });
  transactionsStore.createIndex('by-type', 'type', { unique: false });
  transactionsStore.createIndex('by-tags', 'tags', { unique: false, multiEntry: true });
  transactionsStore.createIndex('by-deleted', 'deletedAt', { unique: false });

  // 3. Create categories store
  const categoriesStore = db.createObjectStore('categories', { keyPath: 'id' });
  categoriesStore.createIndex('by-deleted', 'deletedAt', { unique: false });
  categoriesStore.createIndex('by-type', 'type', { unique: false });

  // 4. Create tags store
  const tagsStore = db.createObjectStore('tags', { keyPath: 'id' });
  tagsStore.createIndex('by-name', 'name', { unique: true });
  tagsStore.createIndex('by-usage', 'usageCount', { unique: false });

  // 5. Create currencies store
  db.createObjectStore('currencies', { keyPath: 'code' });

  // 6. Create salaryPeriods store
  const salaryPeriodsStore = db.createObjectStore('salaryPeriods', { keyPath: 'id' });
  salaryPeriodsStore.createIndex('by-date', 'startDate', { unique: false });

  // 7. Create exchangeRates store
  const exchangeRatesStore = db.createObjectStore('exchangeRates', { keyPath: 'id' });
  exchangeRatesStore.createIndex('by-date', 'date', { unique: false });

  // 8. Create user store
  db.createObjectStore('user', { keyPath: 'id' });

  // 9. Seed default data
  await seedDefaultData(db);
}
```

### Seed Data

```typescript
import { v4 as uuidv4 } from 'uuid';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  SUPPORTED_CURRENCIES,
  DEFAULT_USER
} from './types';

async function seedDefaultData(db: IDBPDatabase): Promise<void> {
  const now = Date.now();

  // Seed currencies
  const currenciesTx = db.transaction('currencies', 'readwrite');
  for (const currency of SUPPORTED_CURRENCIES) {
    await currenciesTx.store.add(currency);
  }
  await currenciesTx.done;

  // Seed expense categories
  const expenseCategoriesTx = db.transaction('categories', 'readwrite');
  for (const category of DEFAULT_EXPENSE_CATEGORIES) {
    await expenseCategoriesTx.store.add({
      ...category,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    });
  }
  await expenseCategoriesTx.done;

  // Seed income categories
  const incomeCategoriesTx = db.transaction('categories', 'readwrite');
  for (const category of DEFAULT_INCOME_CATEGORIES) {
    await incomeCategoriesTx.store.add({
      ...category,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    });
  }
  await incomeCategoriesTx.done;

  // Seed user
  const userTx = db.transaction('user', 'readwrite');
  await userTx.store.add(DEFAULT_USER);
  await userTx.done;

  console.log('Default data seeded successfully');
}
```

---

## Migration v2: Add Sync Fields (Future)

### Goal
Add fields for cloud synchronization without breaking existing data.

### Changes
- Add `version`, `syncedAt`, `deviceId` to transactions
- Add `syncedAt` to accounts, categories

### Strategy: Backwards Compatible

Since IndexedDB doesn't support ALTER TABLE, we simply:
1. Update TypeScript interfaces with optional fields
2. Old records will have `undefined` for new fields
3. New records will have these fields populated

### Implementation

```typescript
async function migrateToV2(db: IDBPDatabase): Promise<void> {
  // NO database schema changes needed!
  // IndexedDB allows new fields to be added without migration

  // Optional: Initialize new fields on existing records
  const tx = db.transaction(['accounts', 'transactions', 'categories'], 'readwrite');

  // Update all transactions with default sync fields
  const transactions = await tx.objectStore('transactions').getAll();
  for (const transaction of transactions) {
    if (transaction.version === undefined) {
      transaction.version = 1;
      transaction.syncedAt = null;
      transaction.deviceId = null;
      await tx.objectStore('transactions').put(transaction);
    }
  }

  await tx.done;
  console.log('Migration to v2 complete: Sync fields added');
}
```

### TypeScript Changes

```typescript
// lib/db/types.ts

export interface Transaction {
  // ... existing fields
  version: number;              // NEW: default = 1
  syncedAt: number | null;      // NEW: default = null
  deviceId: string | null;      // NEW: default = null (v2)
}
```

---

## Migration v3: Add Budgets Store (Future)

### Goal
Add budgets feature without affecting existing data.

### Changes
- Create new `budgets` object store
- Add `budgetId` field to categories (optional)

### Implementation

```typescript
async function migrateToV3(db: IDBPDatabase): Promise<void> {
  // Create budgets store
  const budgetsStore = db.createObjectStore('budgets', { keyPath: 'id' });
  budgetsStore.createIndex('by-category', 'categoryId', { unique: false });
  budgetsStore.createIndex('by-period', 'period', { unique: false });

  console.log('Migration to v3 complete: Budgets store created');
}
```

---

## Migration Best Practices

### 1. Test Migrations Thoroughly

```typescript
// lib/db/migrations.test.ts

describe('Database Migrations', () => {
  it('should migrate from v0 to v1', async () => {
    const db = await openDB('test-db', 1, {
      upgrade(db, oldVersion, newVersion) {
        runMigrations(db, oldVersion, newVersion);
      }
    });

    // Verify stores exist
    expect(db.objectStoreNames.contains('accounts')).toBe(true);
    expect(db.objectStoreNames.contains('transactions')).toBe(true);
    // ... test all stores

    // Verify seed data
    const categories = await db.getAll('categories');
    expect(categories.length).toBeGreaterThan(0);
  });

  it('should migrate from v1 to v2', async () => {
    // Test v1 -> v2 migration
  });
});
```

### 2. Backup Before Migration

```typescript
async function backupDatabase(db: IDBPDatabase): Promise<string> {
  const backup = {
    version: db.version,
    timestamp: Date.now(),
    data: {}
  };

  for (const storeName of db.objectStoreNames) {
    const tx = db.transaction(storeName, 'readonly');
    backup.data[storeName] = await tx.store.getAll();
  }

  return JSON.stringify(backup);
}
```

### 3. Handle Migration Errors

```typescript
const dbPromise = openDB<DBSchema>('FinanceTrackerDB', DB_VERSION, {
  upgrade(db, oldVersion, newVersion, transaction) {
    try {
      runMigrations(db, oldVersion, newVersion);
    } catch (error) {
      console.error('Migration failed:', error);
      transaction.abort(); // Abort transaction
      throw error;
    }
  },
  blocked() {
    alert('Please close all other tabs with this app open');
  },
  blocking() {
    // Current tab is blocking a newer version
    window.location.reload();
  }
});
```

### 4. Version Checking

```typescript
export async function checkDatabaseVersion(): Promise<{
  current: number;
  latest: number;
  needsMigration: boolean;
}> {
  const db = await openDB('FinanceTrackerDB', DB_VERSION);
  const currentVersion = db.version;
  db.close();

  return {
    current: currentVersion,
    latest: DB_VERSION,
    needsMigration: currentVersion < DB_VERSION
  };
}
```

---

## Handling Schema Changes

### Adding a New Field (Easy)

```typescript
// Old interface
interface Account {
  id: string;
  name: string;
  balance: number;
}

// New interface (backwards compatible)
interface Account {
  id: string;
  name: string;
  balance: number;
  description?: string; // NEW: Optional field
}

// No migration needed!
// Old records: { id, name, balance }
// New records: { id, name, balance, description }
```

### Removing a Field (Easy)

```typescript
// Old interface
interface Account {
  id: string;
  name: string;
  balance: number;
  deprecated: string; // To be removed
}

// New interface
interface Account {
  id: string;
  name: string;
  balance: number;
  // deprecated field removed
}

// No migration needed!
// Old records still have 'deprecated' field (ignored)
// New records won't have it
```

### Renaming a Field (Requires Migration)

```typescript
async function renameField(db: IDBPDatabase): Promise<void> {
  const tx = db.transaction('accounts', 'readwrite');
  const accounts = await tx.store.getAll();

  for (const account of accounts) {
    if ('oldFieldName' in account) {
      account.newFieldName = account.oldFieldName;
      delete account.oldFieldName;
      await tx.store.put(account);
    }
  }

  await tx.done;
}
```

### Changing Field Type (Requires Migration)

```typescript
async function changeFieldType(db: IDBPDatabase): Promise<void> {
  const tx = db.transaction('transactions', 'readwrite');
  const transactions = await tx.store.getAll();

  for (const transaction of transactions) {
    // Old: date was string "2025-01-22"
    // New: date is Unix timestamp
    if (typeof transaction.date === 'string') {
      transaction.date = new Date(transaction.date).getTime();
      await tx.store.put(transaction);
    }
  }

  await tx.done;
}
```

---

## Migration Rollback Strategy

### Problem
IndexedDB doesn't support rollbacks. If a migration fails, the database is in an inconsistent state.

### Solution: Backup and Restore

```typescript
async function safeUpgrade(
  db: IDBPDatabase,
  oldVersion: number,
  newVersion: number
): Promise<void> {
  // 1. Create backup
  const backup = await backupDatabase(db);
  localStorage.setItem(`db-backup-v${oldVersion}`, backup);

  try {
    // 2. Run migration
    await runMigrations(db, oldVersion, newVersion);
  } catch (error) {
    // 3. If migration fails, restore from backup
    console.error('Migration failed, restoring backup:', error);
    await restoreFromBackup(backup);
    throw error;
  }
}

async function restoreFromBackup(backupJson: string): Promise<void> {
  const backup = JSON.parse(backupJson);

  // Delete current database
  await deleteDB('FinanceTrackerDB');

  // Recreate with old version
  const db = await openDB('FinanceTrackerDB', backup.version);

  // Restore data
  for (const [storeName, records] of Object.entries(backup.data)) {
    const tx = db.transaction(storeName, 'readwrite');
    for (const record of records) {
      await tx.store.add(record);
    }
    await tx.done;
  }

  db.close();
  window.location.reload();
}
```

---

## Migration Checklist

Before deploying a new database version:

- [ ] Update `DB_VERSION` constant
- [ ] Write migration function
- [ ] Update TypeScript interfaces
- [ ] Add migration to `runMigrations()`
- [ ] Test migration with real data
- [ ] Test backwards compatibility
- [ ] Create backup mechanism
- [ ] Update documentation
- [ ] Test in all supported browsers
- [ ] Deploy with feature flag (optional)

---

## Testing Migrations

### Unit Tests

```typescript
describe('Migration v1 to v2', () => {
  let db: IDBPDatabase;

  beforeEach(async () => {
    // Create v1 database
    db = await openDB('test-db', 1, {
      upgrade: migrateToV1
    });

    // Add test data
    await db.add('transactions', mockTransaction);
  });

  afterEach(async () => {
    await db.close();
    await deleteDB('test-db');
  });

  it('should add sync fields to existing transactions', async () => {
    // Close and reopen with v2
    await db.close();
    db = await openDB('test-db', 2, {
      upgrade: (db, oldVersion, newVersion) => {
        if (oldVersion < 2) migrateToV2(db);
      }
    });

    const transaction = await db.get('transactions', mockTransaction.id);
    expect(transaction.version).toBe(1);
    expect(transaction.syncedAt).toBeNull();
  });
});
```

### Manual Testing

1. Create v1 database with sample data
2. Add transactions, accounts, categories
3. Close app
4. Deploy v2
5. Open app
6. Verify migration runs
7. Verify all data intact
8. Verify new fields present

---

## Future Considerations

### Large Dataset Migrations

For large datasets (100k+ records), consider:
- Batch processing (1000 records at a time)
- Progress indicator for users
- Background migration (Web Worker)

```typescript
async function batchMigration(
  db: IDBPDatabase,
  storeName: string,
  batchSize: number = 1000
): Promise<void> {
  let cursor = await db.transaction(storeName).store.openCursor();
  let batch = [];

  while (cursor) {
    batch.push(cursor.value);

    if (batch.length >= batchSize) {
      await processBatch(db, storeName, batch);
      batch = [];
    }

    cursor = await cursor.continue();
  }

  // Process remaining
  if (batch.length > 0) {
    await processBatch(db, storeName, batch);
  }
}
```

### Schema Validation

```typescript
export function validateSchema(db: IDBPDatabase): boolean {
  const requiredStores = [
    'accounts',
    'transactions',
    'categories',
    'tags',
    'currencies',
    'salaryPeriods',
    'exchangeRates',
    'user'
  ];

  for (const storeName of requiredStores) {
    if (!db.objectStoreNames.contains(storeName)) {
      console.error(`Missing store: ${storeName}`);
      return false;
    }
  }

  return true;
}
```

---

## Summary

✅ **Version-based migrations** with incremental changes
✅ **Backwards compatible** field additions
✅ **Seed data** management
✅ **Error handling** with backups
✅ **Testing strategy** for migrations
✅ **Future-proof** architecture

This migration strategy ensures smooth database evolution while preserving user data! 🚀
