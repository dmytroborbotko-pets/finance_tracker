/**
 * Database Migration System
 *
 * Handles database version upgrades and schema changes
 */

import { IDBPDatabase } from 'idb';
import type { FinanceTrackerDBSchema } from './stores';
import { createAllStores } from './stores';
import { seedDefaultData } from './seed';

/**
 * Current database version
 */
export const DB_VERSION = 1;

/**
 * Database name
 */
export const DB_NAME = 'FinanceTrackerDB';

/**
 * Run database migrations
 * Called during onupgradeneeded event
 */
export async function runMigrations(
  db: IDBPDatabase<FinanceTrackerDBSchema>,
  oldVersion: number,
  newVersion: number | null
): Promise<void> {
  console.log(`Migrating database from v${oldVersion} to v${newVersion}`);

  try {
    // Migration to v1: Initial schema
    if (oldVersion < 1) {
      await migrateToV1(db);
    }

    // Future migrations will go here
    // if (oldVersion < 2) {
    //   await migrateToV2(db);
    // }

    console.log(`✓ Migration completed successfully to v${newVersion}`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Migration to v1: Initial schema
 * Creates all stores and seeds default data
 */
async function migrateToV1(db: IDBPDatabase<FinanceTrackerDBSchema>): Promise<void> {
  console.log('Running migration to v1...');

  // Create all object stores
  createAllStores(db);

  // Note: Seed data will be called after upgrade completes
  // because we need the transaction to finish first

  console.log('✓ Migration to v1 completed');
}

/**
 * Future migration to v2 (example)
 * Add sync fields to existing records
 */
// async function migrateToV2(db: IDBPDatabase<FinanceTrackerDBSchema>): Promise<void> {
//   console.log('Running migration to v2...');
//
//   // IndexedDB allows adding new fields without schema changes
//   // Just update TypeScript interfaces and new records will have the fields
//
//   // Optionally, initialize new fields on existing records
//   const tx = db.transaction(['accounts', 'transactions', 'categories'], 'readwrite');
//
//   // Update existing transactions with default sync fields
//   const transactionStore = tx.objectStore('transactions');
//   let cursor = await transactionStore.openCursor();
//
//   while (cursor) {
//     const transaction = cursor.value;
//     if (transaction.version === undefined) {
//       transaction.version = 1;
//       transaction.syncedAt = null;
//       transaction.deviceId = null;
//       await cursor.update(transaction);
//     }
//     cursor = await cursor.continue();
//   }
//
//   await tx.done;
//   console.log('✓ Migration to v2 completed');
// }

/**
 * Handle database blocked event
 * Occurs when another tab has an older version open
 */
export function handleDatabaseBlocked(): void {
  console.warn('Database upgrade blocked by another tab');
  alert(
    'Please close all other tabs with Finance Tracker open to continue.\n\n' +
    'Будь ласка, закрийте всі інші вкладки з Finance Tracker для продовження.'
  );
}

/**
 * Handle database blocking event
 * Occurs when current tab is blocking a newer version
 */
export function handleDatabaseBlocking(): void {
  console.warn('This tab is blocking a database upgrade');
  // Optionally reload the page to allow upgrade
  if (confirm('A new version is available. Reload to update?\n\nДоступна нова версія. Перезавантажити?')) {
    window.location.reload();
  }
}

/**
 * Handle database version error
 */
export function handleVersionError(error: Error): void {
  console.error('Database version error:', error);

  // Check if error is due to version conflict
  if (error.name === 'VersionError') {
    alert(
      'Database version conflict. Please reload the page.\n\n' +
      'Конфлікт версій бази даних. Будь ласка, перезавантажте сторінку.'
    );
    window.location.reload();
  }
}

/**
 * Delete database (for testing or reset)
 */
export async function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => {
      console.log('✓ Database deleted successfully');
      resolve();
    };

    request.onerror = () => {
      console.error('Failed to delete database:', request.error);
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn('Database deletion blocked');
      reject(new Error('Database deletion blocked'));
    };
  });
}

/**
 * Check database version
 */
export async function checkDatabaseVersion(): Promise<{
  current: number | null;
  latest: number;
  needsMigration: boolean;
}> {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME);

    request.onsuccess = () => {
      const db = request.result;
      const current = db.version;
      db.close();

      resolve({
        current,
        latest: DB_VERSION,
        needsMigration: current < DB_VERSION
      });
    };

    request.onerror = () => {
      resolve({
        current: null,
        latest: DB_VERSION,
        needsMigration: true
      });
    };
  });
}

/**
 * Backup database to JSON
 * Useful before migrations
 */
export async function backupDatabase(db: IDBPDatabase<FinanceTrackerDBSchema>): Promise<string> {
  const data: Record<string, unknown[]> = {};
  const storeNames = Array.from(db.objectStoreNames);

  for (const storeName of storeNames) {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const storeData = await store.getAll();
    data[storeName] = storeData;
    await tx.done;
  }

  const backup = {
    version: db.version,
    timestamp: Date.now(),
    data
  };

  const json = JSON.stringify(backup, null, 2);
  console.log('✓ Database backup created');

  return json;
}

/**
 * Export database backup as downloadable file
 */
export async function exportDatabaseBackup(db: IDBPDatabase<FinanceTrackerDBSchema>): Promise<void> {
  const json = await backupDatabase(db);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `finance-tracker-backup-${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
  console.log('✓ Database backup exported');
}
