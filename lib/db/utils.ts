/**
 * Database Utility Functions
 *
 * Generic CRUD helpers, query builders, and transaction utilities
 */

import { IDBPDatabase, StoreNames, StoreValue } from 'idb';
import type { FinanceTrackerDBSchema } from './stores';
import { getDatabase } from './connection';

/**
 * Generic result type for database operations
 */
export interface DbResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Generic create operation
 *
 * @param storeName - Name of the object store
 * @param value - Value to insert
 * @returns Result with created record
 */
export async function create<StoreName extends StoreNames<FinanceTrackerDBSchema>>(
  storeName: StoreName,
  value: StoreValue<FinanceTrackerDBSchema, StoreName>
): Promise<DbResult<StoreValue<FinanceTrackerDBSchema, StoreName>>> {
  try {
    const db = await getDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    await store.add(value);
    await tx.done;

    return {
      success: true,
      data: value
    };
  } catch (error) {
    console.error(`Failed to create record in ${storeName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generic read operation by ID
 *
 * @param storeName - Name of the object store
 * @param id - Primary key value
 * @returns Result with found record or error
 */
export async function readById<StoreName extends StoreNames<FinanceTrackerDBSchema>>(
  storeName: StoreName,
  id: string
): Promise<DbResult<StoreValue<FinanceTrackerDBSchema, StoreName>>> {
  try {
    const db = await getDatabase();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    const record = await store.get(id);
    await tx.done;

    if (!record) {
      return {
        success: false,
        error: 'Record not found'
      };
    }

    return {
      success: true,
      data: record
    };
  } catch (error) {
    console.error(`Failed to read record from ${storeName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generic read all operation
 *
 * @param storeName - Name of the object store
 * @returns Result with all records
 */
export async function readAll<StoreName extends StoreNames<FinanceTrackerDBSchema>>(
  storeName: StoreName
): Promise<DbResult<Array<StoreValue<FinanceTrackerDBSchema, StoreName>>>> {
  try {
    const db = await getDatabase();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    const records = await store.getAll();
    await tx.done;

    return {
      success: true,
      data: records
    };
  } catch (error) {
    console.error(`Failed to read all records from ${storeName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generic update operation
 *
 * @param storeName - Name of the object store
 * @param value - Updated value (must include primary key)
 * @returns Result with updated record
 */
export async function update<StoreName extends StoreNames<FinanceTrackerDBSchema>>(
  storeName: StoreName,
  value: StoreValue<FinanceTrackerDBSchema, StoreName>
): Promise<DbResult<StoreValue<FinanceTrackerDBSchema, StoreName>>> {
  try {
    const db = await getDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    await store.put(value);
    await tx.done;

    return {
      success: true,
      data: value
    };
  } catch (error) {
    console.error(`Failed to update record in ${storeName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generic delete operation (hard delete)
 *
 * @param storeName - Name of the object store
 * @param id - Primary key value
 * @returns Result indicating success or failure
 */
export async function deleteById<StoreName extends StoreNames<FinanceTrackerDBSchema>>(
  storeName: StoreName,
  id: string
): Promise<DbResult<void>> {
  try {
    const db = await getDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    await store.delete(id);
    await tx.done;

    return {
      success: true
    };
  } catch (error) {
    console.error(`Failed to delete record from ${storeName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// SOFT DELETE OPERATIONS
// ============================================================================

/**
 * Soft delete a record
 * Sets deletedAt timestamp instead of removing from database
 *
 * @param storeName - Name of the object store
 * @param id - Primary key value
 * @returns Result indicating success or failure
 */
export async function softDelete<StoreName extends StoreNames<FinanceTrackerDBSchema>>(
  storeName: StoreName,
  id: string
): Promise<DbResult<void>> {
  try {
    const db = await getDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    const record = await store.get(id);
    if (!record) {
      return {
        success: false,
        error: 'Record not found'
      };
    }

    // Set deletedAt timestamp
    (record as { deletedAt?: number | null }).deletedAt = Date.now();
    await store.put(record);
    await tx.done;

    return {
      success: true
    };
  } catch (error) {
    console.error(`Failed to soft delete record from ${storeName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Restore a soft-deleted record
 *
 * @param storeName - Name of the object store
 * @param id - Primary key value
 * @returns Result indicating success or failure
 */
export async function restore<StoreName extends StoreNames<FinanceTrackerDBSchema>>(
  storeName: StoreName,
  id: string
): Promise<DbResult<void>> {
  try {
    const db = await getDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    const record = await store.get(id);
    if (!record) {
      return {
        success: false,
        error: 'Record not found'
      };
    }

    // Remove deletedAt timestamp
    (record as { deletedAt?: number | null }).deletedAt = null;
    await store.put(record);
    await tx.done;

    return {
      success: true
    };
  } catch (error) {
    console.error(`Failed to restore record in ${storeName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all active (non-deleted) records
 *
 * @param storeName - Name of the object store
 * @returns Result with active records
 */
export async function readAllActive<StoreName extends StoreNames<FinanceTrackerDBSchema>>(
  storeName: StoreName
): Promise<DbResult<Array<StoreValue<FinanceTrackerDBSchema, StoreName>>>> {
  try {
    const result = await readAll(storeName);
    if (!result.success || !result.data) {
      return result;
    }

    // Filter out soft-deleted records
    const active = result.data.filter(record => {
      const deletedAt = (record as { deletedAt?: number | null }).deletedAt;
      return deletedAt === null || deletedAt === undefined;
    });

    return {
      success: true,
      data: active
    };
  } catch (error) {
    console.error(`Failed to read active records from ${storeName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// QUERY BUILDERS
// ============================================================================

/**
 * Query records by index
 *
 * @param storeName - Name of the object store
 * @param indexName - Name of the index
 * @param value - Value to query
 * @returns Result with matching records
 */
export async function queryByIndex<
  StoreName extends StoreNames<FinanceTrackerDBSchema>,
  IndexName extends string
>(
  storeName: StoreName,
  indexName: IndexName,
  value: unknown
): Promise<DbResult<Array<StoreValue<FinanceTrackerDBSchema, StoreName>>>> {
  try {
    const db = await getDatabase();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);

    const records = await index.getAll(value as IDBValidKey);
    await tx.done;

    return {
      success: true,
      data: records
    };
  } catch (error) {
    console.error(`Failed to query ${storeName} by index ${indexName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Query records by date range
 *
 * @param storeName - Name of the object store
 * @param indexName - Name of the date index
 * @param startDate - Start timestamp
 * @param endDate - End timestamp (optional, defaults to now)
 * @returns Result with matching records
 */
export async function queryByDateRange<StoreName extends StoreNames<FinanceTrackerDBSchema>>(
  storeName: StoreName,
  indexName: string,
  startDate: number,
  endDate?: number
): Promise<DbResult<Array<StoreValue<FinanceTrackerDBSchema, StoreName>>>> {
  try {
    const db = await getDatabase();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);

    const range = IDBKeyRange.bound(startDate, endDate || Date.now());
    const records = await index.getAll(range);
    await tx.done;

    return {
      success: true,
      data: records
    };
  } catch (error) {
    console.error(`Failed to query ${storeName} by date range:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Count records in a store
 *
 * @param storeName - Name of the object store
 * @returns Result with count
 */
export async function count<StoreName extends StoreNames<FinanceTrackerDBSchema>>(
  storeName: StoreName
): Promise<DbResult<number>> {
  try {
    const db = await getDatabase();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    const total = await store.count();
    await tx.done;

    return {
      success: true,
      data: total
    };
  } catch (error) {
    console.error(`Failed to count records in ${storeName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Batch create multiple records
 *
 * @param storeName - Name of the object store
 * @param values - Array of values to insert
 * @returns Result indicating success or failure
 */
export async function batchCreate<StoreName extends StoreNames<FinanceTrackerDBSchema>>(
  storeName: StoreName,
  values: Array<StoreValue<FinanceTrackerDBSchema, StoreName>>
): Promise<DbResult<void>> {
  try {
    const db = await getDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    for (const value of values) {
      await store.add(value);
    }

    await tx.done;

    return {
      success: true
    };
  } catch (error) {
    console.error(`Failed to batch create records in ${storeName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Batch update multiple records
 *
 * @param storeName - Name of the object store
 * @param values - Array of values to update
 * @returns Result indicating success or failure
 */
export async function batchUpdate<StoreName extends StoreNames<FinanceTrackerDBSchema>>(
  storeName: StoreName,
  values: Array<StoreValue<FinanceTrackerDBSchema, StoreName>>
): Promise<DbResult<void>> {
  try {
    const db = await getDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    for (const value of values) {
      await store.put(value);
    }

    await tx.done;

    return {
      success: true
    };
  } catch (error) {
    console.error(`Failed to batch update records in ${storeName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Batch delete multiple records
 *
 * @param storeName - Name of the object store
 * @param ids - Array of primary key values
 * @returns Result indicating success or failure
 */
export async function batchDelete<StoreName extends StoreNames<FinanceTrackerDBSchema>>(
  storeName: StoreName,
  ids: string[]
): Promise<DbResult<void>> {
  try {
    const db = await getDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    for (const id of ids) {
      await store.delete(id);
    }

    await tx.done;

    return {
      success: true
    };
  } catch (error) {
    console.error(`Failed to batch delete records from ${storeName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// ATOMIC TRANSACTION HELPERS
// ============================================================================

/**
 * Execute multiple operations in a single transaction
 *
 * @param storeNames - Names of object stores to access
 * @param operations - Function containing operations to execute
 * @returns Result of the transaction
 */
export async function atomicTransaction<T>(
  storeNames: StoreNames<FinanceTrackerDBSchema> | Array<StoreNames<FinanceTrackerDBSchema>>,
  operations: (db: IDBPDatabase<FinanceTrackerDBSchema>) => Promise<T>
): Promise<DbResult<T>> {
  try {
    const db = await getDatabase();
    const result = await operations(db);

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Atomic transaction failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

/**
 * Paginate records
 *
 * @param storeName - Name of the object store
 * @param offset - Starting position
 * @param limit - Number of records to return
 * @returns Result with paginated records
 */
export async function paginate<StoreName extends StoreNames<FinanceTrackerDBSchema>>(
  storeName: StoreName,
  offset: number = 0,
  limit: number = 50
): Promise<DbResult<Array<StoreValue<FinanceTrackerDBSchema, StoreName>>>> {
  try {
    const db = await getDatabase();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    const allRecords = await store.getAll();
    const paginated = allRecords.slice(offset, offset + limit);

    await tx.done;

    return {
      success: true,
      data: paginated
    };
  } catch (error) {
    console.error(`Failed to paginate records from ${storeName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
