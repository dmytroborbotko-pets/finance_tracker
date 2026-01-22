/**
 * Database Module
 *
 * Main entry point for all database operations
 */

// Re-export types
export type { FinanceTrackerDBSchema } from './stores';
export * from './types';

// Re-export connection functions
export {
  initDatabase,
  getDatabase,
  closeDatabase,
  isDatabaseInitialized,
  reinitDatabase,
  handleDatabaseError,
  withErrorHandling,
  checkDatabaseHealth,
  getDatabaseStats
} from './connection';

// Re-export migration functions
export {
  DB_VERSION,
  DB_NAME,
  runMigrations,
  checkDatabaseVersion,
  deleteDatabase,
  backupDatabase,
  exportDatabaseBackup
} from './migrations';

// Re-export seed functions
export {
  seedDefaultData,
  isDatabaseSeeded
} from './seed';

// Re-export utility functions
export type { DbResult } from './utils';
export {
  create,
  readById,
  readAll,
  update,
  deleteById,
  softDelete,
  restore,
  readAllActive,
  queryByIndex,
  queryByDateRange,
  count,
  batchCreate,
  batchUpdate,
  batchDelete,
  atomicTransaction,
  paginate
} from './utils';
