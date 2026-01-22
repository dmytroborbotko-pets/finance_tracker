/**
 * IndexedDB Object Stores Definition
 *
 * Defines all object stores (tables) and their indexes
 */

import { IDBPDatabase } from 'idb';
import type { DBSchema } from 'idb';
import type {
  Account,
  Transaction,
  Category,
  Tag,
  Currency,
  SalaryPeriod,
  ExchangeRate,
  User
} from './types';

/**
 * Database Schema Definition
 * Maps store names to their types
 */
export interface FinanceTrackerDBSchema extends DBSchema {
  accounts: {
    key: string;
    value: Account;
    indexes: {
      'by-currency': string;
      'by-deleted': number | null;
      'by-type': string;
    };
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-date': number;
      'by-category': string | null;
      'by-type': string;
      'by-tags': string;
      'by-deleted': number | null;
    };
  };
  categories: {
    key: string;
    value: Category;
    indexes: {
      'by-deleted': number | null;
      'by-type': string;
    };
  };
  tags: {
    key: string;
    value: Tag;
    indexes: {
      'by-name': string;
      'by-usage': number;
    };
  };
  currencies: {
    key: string;
    value: Currency;
  };
  salaryPeriods: {
    key: string;
    value: SalaryPeriod;
    indexes: {
      'by-date': number;
    };
  };
  exchangeRates: {
    key: string;
    value: ExchangeRate;
    indexes: {
      'by-date': number;
    };
  };
  user: {
    key: string;
    value: User;
  };
}

/**
 * Create accounts store with indexes
 */
export function createAccountsStore(db: IDBPDatabase<FinanceTrackerDBSchema>): void {
  const store = db.createObjectStore('accounts', { keyPath: 'id' });

  store.createIndex('by-currency', 'currency', { unique: false });
  store.createIndex('by-deleted', 'deletedAt', { unique: false });
  store.createIndex('by-type', 'type', { unique: false });

  console.log('✓ Created accounts store');
}

/**
 * Create transactions store with indexes
 */
export function createTransactionsStore(db: IDBPDatabase<FinanceTrackerDBSchema>): void {
  const store = db.createObjectStore('transactions', { keyPath: 'id' });

  store.createIndex('by-date', 'date', { unique: false });
  store.createIndex('by-category', 'categoryId', { unique: false });
  store.createIndex('by-type', 'type', { unique: false });
  store.createIndex('by-tags', 'tags', { unique: false, multiEntry: true });
  store.createIndex('by-deleted', 'deletedAt', { unique: false });

  console.log('✓ Created transactions store');
}

/**
 * Create categories store with indexes
 */
export function createCategoriesStore(db: IDBPDatabase<FinanceTrackerDBSchema>): void {
  const store = db.createObjectStore('categories', { keyPath: 'id' });

  store.createIndex('by-deleted', 'deletedAt', { unique: false });
  store.createIndex('by-type', 'type', { unique: false });

  console.log('✓ Created categories store');
}

/**
 * Create tags store with indexes
 */
export function createTagsStore(db: IDBPDatabase<FinanceTrackerDBSchema>): void {
  const store = db.createObjectStore('tags', { keyPath: 'id' });

  store.createIndex('by-name', 'name', { unique: true });
  store.createIndex('by-usage', 'usageCount', { unique: false });

  console.log('✓ Created tags store');
}

/**
 * Create currencies store (no indexes - small dataset)
 */
export function createCurrenciesStore(db: IDBPDatabase<FinanceTrackerDBSchema>): void {
  db.createObjectStore('currencies', { keyPath: 'code' });

  console.log('✓ Created currencies store');
}

/**
 * Create salaryPeriods store with indexes
 */
export function createSalaryPeriodsStore(db: IDBPDatabase<FinanceTrackerDBSchema>): void {
  const store = db.createObjectStore('salaryPeriods', { keyPath: 'id' });

  store.createIndex('by-date', 'startDate', { unique: false });

  console.log('✓ Created salaryPeriods store');
}

/**
 * Create exchangeRates store with indexes
 */
export function createExchangeRatesStore(db: IDBPDatabase<FinanceTrackerDBSchema>): void {
  const store = db.createObjectStore('exchangeRates', { keyPath: 'id' });

  store.createIndex('by-date', 'date', { unique: false });

  console.log('✓ Created exchangeRates store');
}

/**
 * Create user store (no indexes - single record)
 */
export function createUserStore(db: IDBPDatabase<FinanceTrackerDBSchema>): void {
  db.createObjectStore('user', { keyPath: 'id' });

  console.log('✓ Created user store');
}

/**
 * Create all stores for initial setup (v1)
 */
export function createAllStores(db: IDBPDatabase<FinanceTrackerDBSchema>): void {
  console.log('Creating all object stores...');

  createAccountsStore(db);
  createTransactionsStore(db);
  createCategoriesStore(db);
  createTagsStore(db);
  createCurrenciesStore(db);
  createSalaryPeriodsStore(db);
  createExchangeRatesStore(db);
  createUserStore(db);

  console.log('✓ All stores created successfully');
}
