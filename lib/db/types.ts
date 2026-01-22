/**
 * Database Type Definitions
 *
 * All TypeScript interfaces for IndexedDB entities
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Account Types
 */
export enum AccountType {
  BANK = 'bank',
  DEBT_I_OWE = 'debt_i_owe',
  DEBT_THEY_OWE = 'debt_they_owe'
}

/**
 * Transaction Types
 */
export enum TransactionType {
  EXPENSE = 'expense',
  INCOME = 'income',
  TRANSFER = 'transfer',
  DEBT_PAYMENT = 'debt_payment',
  DEBT_RETURN = 'debt_return'
}

/**
 * Category Types
 */
export enum CategoryType {
  EXPENSE = 'expense',
  INCOME = 'income'
}

// ============================================================================
// CORE ENTITIES
// ============================================================================

/**
 * Account Entity
 * Represents bank accounts and debt accounts
 */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string; // Currency code (UAH, USD, EUR...)
  color: string; // Hex color (#FF5733)
  icon: string; // Lucide icon name
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  deletedAt: number | null; // Unix timestamp or null (soft delete)
}

/**
 * Transaction Entity
 * Represents all financial transactions
 */
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // Always positive
  currency: string; // Currency code
  date: number; // Unix timestamp
  fromAccountId: string | null; // Source account ID
  toAccountId: string | null; // Destination account ID
  categoryId: string | null; // Category ID (required for expense/income)
  tags: string[]; // Array of tag IDs
  description: string; // Transaction description
  isSalary: boolean; // Is this a salary income?
  isRefund: boolean; // Is this a refund?
  refundCategoryId: string | null; // Category ID for refund
  debtAccountId: string | null; // Debt account ID (for debt_payment/return)
  version: number; // Version for sync (v2)
  syncedAt: number | null; // Last sync timestamp (v2)
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  deletedAt: number | null; // Unix timestamp or null (soft delete)
}

/**
 * Category Entity
 * Represents expense and income categories
 */
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string; // Hex color
  icon: string; // Lucide icon name
  isDefault: boolean; // Protected from deletion
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  deletedAt: number | null; // Unix timestamp or null (soft delete)
}

/**
 * Tag Entity
 * Represents tags for transaction details
 */
export interface Tag {
  id: string;
  name: string; // Unique tag name
  usageCount: number; // Number of times used
  createdAt: number; // Unix timestamp
}

/**
 * Currency Entity
 * Represents supported currencies
 */
export interface Currency {
  code: string; // Primary key (UAH, USD, EUR...)
  name: string; // Full name (Ukrainian Hryvnia)
  symbol: string; // Currency symbol (₴, $, €)
  isDefault: boolean; // User's default currency
}

/**
 * Salary Period Entity
 * Represents salary-based time periods
 */
export interface SalaryPeriod {
  id: string;
  startDate: number; // Unix timestamp
  endDate: number | null; // Unix timestamp or null (current period)
  salaryTransactionId: string; // Reference to salary transaction
  createdAt: number; // Unix timestamp
}

/**
 * Exchange Rate Entity
 * Represents currency exchange rates
 */
export interface ExchangeRate {
  id: string; // Format: "YYYY-MM-DD-FROM-TO"
  date: number; // Unix timestamp
  from: string; // Currency code
  to: string; // Currency code
  rate: number; // Exchange rate
  fetchedAt: number; // Unix timestamp of API fetch
}

/**
 * User Entity
 * Represents the current user (single record)
 */
export interface User {
  id: string; // Always "current"
  isGuest: boolean; // true in v1, false in v2 after registration
  defaultCurrency: string; // Currency code
  email: string | null; // null in v1, string in v2
  createdAt: number; // Unix timestamp
}

// ============================================================================
// INPUT/CREATE TYPES
// ============================================================================

/**
 * Input type for creating a new account
 */
export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
}

/**
 * Input type for updating an account
 */
export interface UpdateAccountInput {
  name?: string;
  color?: string;
  icon?: string;
  // balance is updated through transactions, not directly
}

/**
 * Input type for creating a new transaction
 */
export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  currency: string;
  date: number;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  categoryId?: string | null;
  tags?: string[];
  description?: string;
  isSalary?: boolean;
  isRefund?: boolean;
  refundCategoryId?: string | null;
  debtAccountId?: string | null;
}

/**
 * Input type for updating a transaction
 */
export interface UpdateTransactionInput {
  amount?: number;
  currency?: string;
  date?: number;
  categoryId?: string | null;
  tags?: string[];
  description?: string;
  isSalary?: boolean;
  isRefund?: boolean;
  refundCategoryId?: string | null;
}

/**
 * Input type for creating a category
 */
export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
}

/**
 * Input type for updating a category
 */
export interface UpdateCategoryInput {
  name?: string;
  color?: string;
  icon?: string;
}

/**
 * Input type for creating a tag
 */
export interface CreateTagInput {
  name: string;
}

// ============================================================================
// QUERY/FILTER TYPES
// ============================================================================

/**
 * Filter options for querying transactions
 */
export interface TransactionFilters {
  accountIds?: string[]; // Filter by account(s)
  categoryIds?: string[]; // Filter by category(ies)
  tagIds?: string[]; // Filter by tag(s)
  types?: TransactionType[]; // Filter by transaction type(s)
  startDate?: number; // Unix timestamp
  endDate?: number; // Unix timestamp
  searchQuery?: string; // Search in description
  includeDeleted?: boolean; // Include soft-deleted records
}

/**
 * Sort options for transactions
 */
export interface TransactionSort {
  field: 'date' | 'amount';
  direction: 'asc' | 'desc';
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number; // Number of records per page
  offset?: number; // Starting position
}

/**
 * Date range options
 */
export interface DateRangeOption {
  label: string;
  startDate: number;
  endDate: number | null; // null = current date
}

/**
 * Period type for analytics
 */
export enum PeriodType {
  SALARY = 'salary',
  MONTH = 'month',
  WEEK = 'week',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom'
}

/**
 * Analytics period
 */
export interface AnalyticsPeriod {
  type: PeriodType;
  startDate: number;
  endDate: number | null;
  label: string; // Human-readable label
}

// ============================================================================
// ANALYTICS/STATISTICS TYPES
// ============================================================================

/**
 * Expense by category
 */
export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  totalAmount: number; // In default currency
  percentage: number; // Percentage of total expenses
  transactionCount: number;
  refundAmount: number; // Total refunds for this category
  netAmount: number; // Total - refunds
}

/**
 * Balance snapshot
 */
export interface BalanceSnapshot {
  date: number; // Unix timestamp
  balance: number; // Total balance in default currency
  accounts: {
    accountId: string;
    accountName: string;
    balance: number; // In account's currency
    balanceInDefaultCurrency: number;
  }[];
}

/**
 * Period statistics
 */
export interface PeriodStatistics {
  period: AnalyticsPeriod;
  totalIncome: number; // In default currency
  totalExpenses: number; // In default currency
  netSavings: number; // Income - expenses
  transactionCount: number;
  categoryBreakdown: CategoryExpense[];
  comparisonToPrevious?: {
    incomeChange: number; // Percentage
    expenseChange: number; // Percentage
    savingsChange: number; // Percentage
  };
}

/**
 * Tag usage statistics
 */
export interface TagStatistics {
  tagId: string;
  tagName: string;
  usageCount: number;
  totalAmount: number; // In default currency
  averageAmount: number;
}

// ============================================================================
// EVENT TYPES (for event-driven communication)
// ============================================================================

/**
 * Custom event types
 */
export enum AppEventType {
  ACCOUNT_CREATED = 'account-created',
  ACCOUNT_UPDATED = 'account-updated',
  ACCOUNT_DELETED = 'account-deleted',
  TRANSACTION_CREATED = 'transaction-created',
  TRANSACTION_UPDATED = 'transaction-updated',
  TRANSACTION_DELETED = 'transaction-deleted',
  CATEGORY_CREATED = 'category-created',
  CATEGORY_UPDATED = 'category-updated',
  CATEGORY_DELETED = 'category-deleted',
  TAG_CREATED = 'tag-created',
  BALANCE_UPDATED = 'balance-updated',
  SALARY_PERIOD_CREATED = 'salary-period-created',
  CURRENCY_CHANGED = 'currency-changed',
  EXCHANGE_RATES_UPDATED = 'exchange-rates-updated'
}

/**
 * Base event payload
 */
export interface AppEvent<T = unknown> {
  type: AppEventType;
  payload: T;
  timestamp: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Omit fields for creation (auto-generated fields)
 */
export type CreateFields = 'id' | 'createdAt' | 'updatedAt' | 'deletedAt';

/**
 * Omit fields for updates (immutable fields)
 */
export type UpdateFields = 'id' | 'createdAt';

/**
 * Database operation result
 */
export interface DbOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Database error types
 */
export enum DbErrorType {
  NOT_FOUND = 'NOT_FOUND',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Database error
 */
export interface DbError {
  type: DbErrorType;
  message: string;
  details?: unknown;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Default categories seed data
 */
export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>[] = [
  {
    name: 'Їжа та продукти',
    type: CategoryType.EXPENSE,
    color: '#FF6B6B',
    icon: 'UtensilsCrossed',
    isDefault: true
  },
  {
    name: 'Транспорт',
    type: CategoryType.EXPENSE,
    color: '#4ECDC4',
    icon: 'Car',
    isDefault: true
  },
  {
    name: 'Житло',
    type: CategoryType.EXPENSE,
    color: '#95E1D3',
    icon: 'Home',
    isDefault: true
  },
  {
    name: 'Розваги',
    type: CategoryType.EXPENSE,
    color: '#F38181',
    icon: 'PartyPopper',
    isDefault: true
  },
  {
    name: "Здоров'я",
    type: CategoryType.EXPENSE,
    color: '#AA96DA',
    icon: 'Heart',
    isDefault: true
  },
  {
    name: 'Освіта',
    type: CategoryType.EXPENSE,
    color: '#FCBAD3',
    icon: 'GraduationCap',
    isDefault: true
  },
  {
    name: 'Одяг',
    type: CategoryType.EXPENSE,
    color: '#FFFFD2',
    icon: 'Shirt',
    isDefault: true
  },
  {
    name: 'Інше',
    type: CategoryType.EXPENSE,
    color: '#A8D8EA',
    icon: 'Package',
    isDefault: true
  }
];

/**
 * Default income categories seed data
 */
export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>[] = [
  {
    name: 'Зарплата',
    type: CategoryType.INCOME,
    color: '#68D391',
    icon: 'Wallet',
    isDefault: true
  },
  {
    name: 'Фріланс',
    type: CategoryType.INCOME,
    color: '#63B3ED',
    icon: 'Briefcase',
    isDefault: true
  },
  {
    name: 'Інвестиції',
    type: CategoryType.INCOME,
    color: '#FC8181',
    icon: 'TrendingUp',
    isDefault: true
  },
  {
    name: 'Інше',
    type: CategoryType.INCOME,
    color: '#B794F4',
    icon: 'Plus',
    isDefault: true
  }
];

/**
 * Supported currencies seed data
 */
export const SUPPORTED_CURRENCIES: Currency[] = [
  {
    code: 'UAH',
    name: 'Ukrainian Hryvnia',
    symbol: '₴',
    isDefault: true
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    isDefault: false
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    isDefault: false
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    isDefault: false
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: '₣',
    isDefault: false
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    isDefault: false
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    isDefault: false
  }
];

/**
 * Default user
 */
export const DEFAULT_USER: User = {
  id: 'current',
  isGuest: true,
  defaultCurrency: 'UAH',
  email: null,
  createdAt: Date.now()
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if account is a debt account
 */
export function isDebtAccount(account: Account): boolean {
  return account.type === AccountType.DEBT_I_OWE || account.type === AccountType.DEBT_THEY_OWE;
}

/**
 * Check if account is a bank account
 */
export function isBankAccount(account: Account): boolean {
  return account.type === AccountType.BANK;
}

/**
 * Check if transaction affects statistics
 */
export function affectsStatistics(transaction: Transaction): boolean {
  // Transfers don't affect income/expense statistics
  return transaction.type !== TransactionType.TRANSFER;
}

/**
 * Check if transaction requires category
 */
export function requiresCategory(type: TransactionType): boolean {
  return type === TransactionType.EXPENSE || type === TransactionType.INCOME;
}

/**
 * Check if transaction is deleted (soft delete)
 */
export function isDeleted(entity: { deletedAt: number | null }): boolean {
  return entity.deletedAt !== null;
}

/**
 * Check if transaction is income type
 */
export function isIncomeTransaction(transaction: Transaction): boolean {
  return transaction.type === TransactionType.INCOME ||
         transaction.type === TransactionType.DEBT_RETURN;
}

/**
 * Check if transaction is expense type
 */
export function isExpenseTransaction(transaction: Transaction): boolean {
  return transaction.type === TransactionType.EXPENSE ||
         transaction.type === TransactionType.DEBT_PAYMENT;
}
