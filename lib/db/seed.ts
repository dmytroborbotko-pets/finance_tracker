/**
 * Database Seed Data
 *
 * Default data for currencies, categories, and initial user
 */

import { IDBPDatabase } from 'idb';
import type { FinanceTrackerDBSchema } from './stores';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  SUPPORTED_CURRENCIES,
  DEFAULT_USER
} from './types';

/**
 * Seed default currencies
 */
async function seedCurrencies(db: IDBPDatabase<FinanceTrackerDBSchema>): Promise<void> {
  const tx = db.transaction('currencies', 'readwrite');
  const store = tx.objectStore('currencies');

  for (const currency of SUPPORTED_CURRENCIES) {
    await store.add(currency);
  }

  await tx.done;
  console.log(`✓ Seeded ${SUPPORTED_CURRENCIES.length} currencies`);
}

/**
 * Seed default expense categories
 */
async function seedExpenseCategories(db: IDBPDatabase<FinanceTrackerDBSchema>): Promise<void> {
  const tx = db.transaction('categories', 'readwrite');
  const store = tx.objectStore('categories');
  const now = Date.now();

  for (const category of DEFAULT_EXPENSE_CATEGORIES) {
    await store.add({
      ...category,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    });
  }

  await tx.done;
  console.log(`✓ Seeded ${DEFAULT_EXPENSE_CATEGORIES.length} expense categories`);
}

/**
 * Seed default income categories
 */
async function seedIncomeCategories(db: IDBPDatabase<FinanceTrackerDBSchema>): Promise<void> {
  const tx = db.transaction('categories', 'readwrite');
  const store = tx.objectStore('categories');
  const now = Date.now();

  for (const category of DEFAULT_INCOME_CATEGORIES) {
    await store.add({
      ...category,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    });
  }

  await tx.done;
  console.log(`✓ Seeded ${DEFAULT_INCOME_CATEGORIES.length} income categories`);
}

/**
 * Seed initial user
 */
async function seedUser(db: IDBPDatabase<FinanceTrackerDBSchema>): Promise<void> {
  const tx = db.transaction('user', 'readwrite');
  const store = tx.objectStore('user');

  await store.add(DEFAULT_USER);

  await tx.done;
  console.log('✓ Seeded user');
}

/**
 * Seed all default data
 */
export async function seedDefaultData(db: IDBPDatabase<FinanceTrackerDBSchema>): Promise<void> {
  console.log('Seeding default data...');

  try {
    await seedCurrencies(db);
    await seedExpenseCategories(db);
    await seedIncomeCategories(db);
    await seedUser(db);

    console.log('✓ All default data seeded successfully');
  } catch (error) {
    console.error('Failed to seed default data:', error);
    throw error;
  }
}

/**
 * Check if database has been seeded
 */
export async function isDatabaseSeeded(db: IDBPDatabase<FinanceTrackerDBSchema>): Promise<boolean> {
  try {
    const tx = db.transaction(['currencies', 'categories', 'user'], 'readonly');

    const currenciesCount = await tx.objectStore('currencies').count();
    const categoriesCount = await tx.objectStore('categories').count();
    const userExists = await tx.objectStore('user').get('current');

    await tx.done;

    return currenciesCount > 0 && categoriesCount > 0 && !!userExists;
  } catch (error) {
    console.error('Failed to check if database is seeded:', error);
    return false;
  }
}
