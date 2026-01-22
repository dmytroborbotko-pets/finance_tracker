/**
 * IndexedDB Connection Manager
 *
 * Handles database initialization and connection management
 */

import { openDB, IDBPDatabase } from 'idb';
import type { FinanceTrackerDBSchema } from './stores';
import {
  DB_NAME,
  DB_VERSION,
  runMigrations,
  handleDatabaseBlocked,
  handleDatabaseBlocking,
  handleVersionError
} from './migrations';
import { seedDefaultData, isDatabaseSeeded } from './seed';

/**
 * Database instance cache
 */
let dbInstance: IDBPDatabase<FinanceTrackerDBSchema> | null = null;

/**
 * Database initialization promise
 * Prevents multiple simultaneous initialization attempts
 */
let dbInitPromise: Promise<IDBPDatabase<FinanceTrackerDBSchema>> | null = null;

/**
 * Initialize and open database connection
 *
 * @returns Promise resolving to database instance
 */
export async function initDatabase(): Promise<IDBPDatabase<FinanceTrackerDBSchema>> {
  // Return existing instance if available
  if (dbInstance) {
    return dbInstance;
  }

  // Return existing initialization promise if in progress
  if (dbInitPromise) {
    return dbInitPromise;
  }

  // Start new initialization
  dbInitPromise = openDB<FinanceTrackerDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log('Database upgrade needed');
      console.log(`Old version: ${oldVersion}, New version: ${newVersion}`);

      try {
        // Run migrations synchronously during upgrade
        // Note: runMigrations returns a Promise but upgrade is synchronous
        // So we use the synchronous parts only (store creation)
        runMigrations(db, oldVersion, newVersion);
      } catch (error) {
        console.error('Migration failed:', error);
        transaction.abort();
        throw error;
      }
    },

    blocked() {
      handleDatabaseBlocked();
    },

    blocking() {
      handleDatabaseBlocking();
    },

    terminated() {
      console.warn('Database connection terminated unexpectedly');
      dbInstance = null;
      dbInitPromise = null;
    }
  })
    .then(async (db) => {
      console.log('✓ Database connection established');

      // Seed default data if needed (after upgrade transaction completes)
      const seeded = await isDatabaseSeeded(db);
      if (!seeded) {
        console.log('Database not seeded, seeding now...');
        await seedDefaultData(db);
      }

      // Cache instance
      dbInstance = db;
      return db;
    })
    .catch((error) => {
      console.error('Failed to initialize database:', error);
      handleVersionError(error);
      dbInitPromise = null;
      throw error;
    });

  return dbInitPromise;
}

/**
 * Get database instance
 * Initializes connection if not already done
 *
 * @returns Promise resolving to database instance
 */
export async function getDatabase(): Promise<IDBPDatabase<FinanceTrackerDBSchema>> {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    dbInitPromise = null;
    console.log('✓ Database connection closed');
  }
}

/**
 * Check if database is initialized
 */
export function isDatabaseInitialized(): boolean {
  return dbInstance !== null;
}

/**
 * Re-initialize database connection
 * Useful after errors or version conflicts
 */
export async function reinitDatabase(): Promise<IDBPDatabase<FinanceTrackerDBSchema>> {
  closeDatabase();
  return initDatabase();
}

/**
 * Database error handler
 * Centralized error handling for database operations
 */
export function handleDatabaseError(error: unknown, operation: string): never {
  console.error(`Database operation failed: ${operation}`, error);

  if (error instanceof Error) {
    // Handle specific error types
    switch (error.name) {
      case 'NotFoundError':
        throw new Error(`Record not found during ${operation}`);

      case 'ConstraintError':
        throw new Error(`Constraint violation during ${operation}`);

      case 'QuotaExceededError':
        throw new Error('Storage quota exceeded. Please free up space.');

      case 'VersionError':
        throw new Error('Database version conflict. Please reload the page.');

      case 'InvalidStateError':
        throw new Error('Invalid database state. Please reload the page.');

      case 'TransactionInactiveError':
        throw new Error('Database transaction is inactive.');

      default:
        throw new Error(`Database error during ${operation}: ${error.message}`);
    }
  }

  throw new Error(`Unknown database error during ${operation}`);
}

/**
 * Execute operation with automatic error handling
 *
 * @param operation - Description of operation for error messages
 * @param fn - Function to execute
 * @returns Result of operation
 */
export async function withErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    handleDatabaseError(error, operation);
  }
}

/**
 * Check database health
 * Verifies database is accessible and has expected stores
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  version: number;
  storeCount: number;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    const db = await getDatabase();

    const expectedStores = [
      'accounts',
      'transactions',
      'categories',
      'tags',
      'currencies',
      'salaryPeriods',
      'exchangeRates',
      'user'
    ];

    for (const storeName of expectedStores) {
      if (!db.objectStoreNames.contains(storeName)) {
        errors.push(`Missing store: ${storeName}`);
      }
    }

    return {
      healthy: errors.length === 0,
      version: db.version,
      storeCount: db.objectStoreNames.length,
      errors
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');

    return {
      healthy: false,
      version: 0,
      storeCount: 0,
      errors
    };
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  accounts: number;
  transactions: number;
  categories: number;
  tags: number;
  salaryPeriods: number;
}> {
  const db = await getDatabase();
  const tx = db.transaction(
    ['accounts', 'transactions', 'categories', 'tags', 'salaryPeriods'],
    'readonly'
  );

  const [accounts, transactions, categories, tags, salaryPeriods] = await Promise.all([
    tx.objectStore('accounts').count(),
    tx.objectStore('transactions').count(),
    tx.objectStore('categories').count(),
    tx.objectStore('tags').count(),
    tx.objectStore('salaryPeriods').count()
  ]);

  await tx.done;

  return {
    accounts,
    transactions,
    categories,
    tags,
    salaryPeriods
  };
}
