# 🗄️ Database Schema Documentation

## Overview

Finance Tracker використовує **IndexedDB** для локального зберігання даних. База даних має назву `FinanceTrackerDB` та містить 8 Object Stores (таблиць).

---

## Database Structure

```
FinanceTrackerDB (v1)
├── accounts          (банківські рахунки)
├── transactions      (транзакції)
├── categories        (категорії витрат)
├── tags              (теги для деталізації)
├── currencies        (підтримувані валюти)
├── salaryPeriods     (зарплатні періоди)
├── exchangeRates     (курси валют)
└── user              (користувач)
```

---

## Entity Relationship Diagram

```
┌─────────────────┐
│      User       │
│  id: "current"  │
│  isGuest: true  │
│  defaultCurrency│
└────────┬────────┘
         │
         │ has many
         ▼
┌─────────────────┐     uses      ┌──────────────┐
│    Accounts     │◄───────────────┤  Currencies  │
│  id, name       │                │  code, symbol│
│  balance        │                └──────────────┘
│  currency       │
└────────┬────────┘
         │
         │ has many
         ▼
┌─────────────────────────────────────────────┐
│            Transactions                     │
│  id, type, amount, date                     │
│  fromAccountId, toAccountId                 │
│  categoryId, tags[], description            │
│  isSalary, isRefund, version, syncedAt      │
└───────────┬─────────────────────────────────┘
            │
            │ belongs to
            ▼
    ┌───────────────┐
    │  Categories   │
    │  id, name     │
    │  color, icon  │
    └───────────────┘

┌─────────────────┐
│  SalaryPeriods  │◄──── created by
│  startDate      │      transaction.isSalary=true
│  salaryTransId  │
└─────────────────┘

┌─────────────────┐
│  ExchangeRates  │
│  date, from, to │
│  rate           │
└─────────────────┘

┌─────────────────┐
│      Tags       │
│  id, name       │
│  usageCount     │
└─────────────────┘
```

---

## Object Stores (Tables)

### 1. **accounts**

Зберігає банківські рахунки та рахунки боргу.

| Field | Type | Description |
|-------|------|-------------|
| id | string | UUID, primary key |
| name | string | Назва рахунку |
| type | 'bank' \| 'debt_i_owe' \| 'debt_they_owe' | Тип рахунку |
| balance | number | Поточний баланс |
| currency | string | Код валюти (UAH, USD, EUR...) |
| color | string | Hex колір (#FF5733) |
| icon | string | Назва іконки (Lucide React) |
| createdAt | number | Timestamp створення |
| updatedAt | number | Timestamp останнього оновлення |
| deletedAt | number \| null | Timestamp видалення (soft delete) |

**Indexes:**
- `by-currency`: currency
- `by-deleted`: deletedAt
- `by-type`: type

**Business Rules:**
- Soft delete: deletedAt = null (активний) або timestamp (видалений)
- Balance оновлюється автоматично при транзакціях
- Debt accounts мають від'ємний balance для "I owe"

---

### 2. **transactions**

Зберігає всі фінансові транзакції.

| Field | Type | Description |
|-------|------|-------------|
| id | string | UUID, primary key |
| type | TransactionType | 'expense' \| 'income' \| 'transfer' \| 'debt_payment' \| 'debt_return' |
| amount | number | Сума транзакції (завжди позитивна) |
| currency | string | Код валюти |
| date | number | Timestamp транзакції |
| fromAccountId | string \| null | ID рахунку джерела |
| toAccountId | string \| null | ID рахунку призначення |
| categoryId | string \| null | ID категорії (обов'язково для expense/income) |
| tags | string[] | Масив ID тегів |
| description | string | Опис транзакції |
| isSalary | boolean | Чи є це зарплатою |
| isRefund | boolean | Чи є це поверненням |
| refundCategoryId | string \| null | ID категорії для повернення |
| debtAccountId | string \| null | ID рахунку боргу (для debt_payment/return) |
| version | number | Версія для синхронізації (v2) |
| syncedAt | number \| null | Timestamp синхронізації (v2) |
| createdAt | number | Timestamp створення |
| updatedAt | number | Timestamp останнього оновлення |
| deletedAt | number \| null | Timestamp видалення (soft delete) |

**Indexes:**
- `by-date`: date
- `by-account`: fromAccountId, toAccountId (compound)
- `by-category`: categoryId
- `by-type`: type
- `by-tags`: tags (multiEntry)
- `by-deleted`: deletedAt

**Business Rules:**
- **expense**: fromAccountId (required), categoryId (required)
- **income**: toAccountId (required), categoryId (optional)
- **transfer**: fromAccountId + toAccountId (required), НЕ впливає на статистику
- **debt_payment**: fromAccountId (bank) + debtAccountId (debt), рахується як expense
- **debt_return**: toAccountId (bank) + debtAccountId (debt), рахується як income

---

### 3. **categories**

Категорії витрат та доходів.

| Field | Type | Description |
|-------|------|-------------|
| id | string | UUID, primary key |
| name | string | Назва категорії |
| type | 'expense' \| 'income' | Тип категорії |
| color | string | Hex колір |
| icon | string | Назва іконки (Lucide React) |
| isDefault | boolean | Чи є базовою категорією (захист від видалення) |
| createdAt | number | Timestamp створення |
| updatedAt | number | Timestamp оновлення |
| deletedAt | number \| null | Timestamp видалення (soft delete) |

**Indexes:**
- `by-deleted`: deletedAt
- `by-type`: type

**Default Categories (Expense):**
- 🍔 Їжа та продукти (Food & Groceries)
- 🚗 Транспорт (Transport)
- 🏠 Житло (Housing)
- 🎉 Розваги (Entertainment)
- 💊 Здоров'я (Health)
- 📚 Освіта (Education)
- 👕 Одяг (Clothing)
- 📦 Інше (Other)

---

### 4. **tags**

Теги для деталізації транзакцій.

| Field | Type | Description |
|-------|------|-------------|
| id | string | UUID, primary key |
| name | string | Назва тегу (унікальна) |
| usageCount | number | Кількість використань |
| createdAt | number | Timestamp створення |

**Indexes:**
- `by-name`: name (unique)
- `by-usage`: usageCount

**Business Rules:**
- usageCount інкрементується при додаванні тегу до транзакції
- Використовується для автокомпліту (сортування по популярності)

---

### 5. **currencies**

Підтримувані валюти.

| Field | Type | Description |
|-------|------|-------------|
| code | string | Код валюти (UAH, USD...), primary key |
| name | string | Повна назва (Ukrainian Hryvnia) |
| symbol | string | Символ (₴, $, €) |
| isDefault | boolean | Дефолтна валюта користувача |

**No Indexes**

**Supported Currencies (v1):**
- UAH (₴) - Ukrainian Hryvnia
- USD ($) - US Dollar
- EUR (€) - Euro
- GBP (£) - British Pound
- CHF (₣) - Swiss Franc
- CAD (C$) - Canadian Dollar
- AUD (A$) - Australian Dollar

---

### 6. **salaryPeriods**

Зарплатні періоди для статистики.

| Field | Type | Description |
|-------|------|-------------|
| id | string | UUID, primary key |
| startDate | number | Timestamp початку періоду |
| endDate | number \| null | Timestamp кінця періоду (null = поточний) |
| salaryTransactionId | string | ID транзакції зарплати |
| createdAt | number | Timestamp створення |

**Indexes:**
- `by-date`: startDate

**Business Rules:**
- Автоматично створюється при income transaction з isSalary=true
- endDate попереднього періоду = startDate нового періоду - 1 день
- Останній період має endDate = null (поточний)

---

### 7. **exchangeRates**

Курси валют для конвертації.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Формат: "YYYY-MM-DD-FROM-TO", primary key |
| date | number | Timestamp дати курсу |
| from | string | Код валюти джерела |
| to | string | Код валюти призначення |
| rate | number | Курс конвертації |
| fetchedAt | number | Timestamp отримання з API |

**Indexes:**
- `by-date`: date

**Example:**
```json
{
  "id": "2025-01-22-USD-UAH",
  "date": 1737504000000,
  "from": "USD",
  "to": "UAH",
  "rate": 41.25,
  "fetchedAt": 1737517234567
}
```

**Business Rules:**
- Фетчаться щоденно з API (exchangerate-api.com)
- Історичні курси зберігаються для точності старих транзакцій
- Fallback на останній відомий курс якщо offline

---

### 8. **user**

Інформація про користувача (single record).

| Field | Type | Description |
|-------|------|-------------|
| id | string | Завжди "current", primary key |
| isGuest | boolean | true в v1, false в v2 після реєстрації |
| defaultCurrency | string | Код дефолтної валюти |
| email | string \| null | Email (null в v1, string в v2) |
| createdAt | number | Timestamp створення |

**No Indexes**

**Business Rules:**
- Завжди існує рівно один запис з id="current"
- isGuest=true в v1 (без авторизації)
- defaultCurrency використовується для зведених звітів

---

## Data Flow Examples

### Example 1: Create Expense Transaction

```
User Input:
  - Amount: 150
  - Currency: UAH
  - Account: "Приват24"
  - Category: "Їжа та продукти"
  - Tags: ["кава", "кафе"]
  - Description: "Кава в Lviv Croissants"

Database Operations:
1. Create transaction record:
   {
     id: "uuid-1",
     type: "expense",
     amount: 150,
     currency: "UAH",
     fromAccountId: "account-1",
     categoryId: "category-food",
     tags: ["tag-1", "tag-2"],
     description: "Кава в Lviv Croissants",
     ...
   }

2. Update account balance:
   accounts["account-1"].balance -= 150
   accounts["account-1"].updatedAt = now()

3. Increment tag usage:
   tags["tag-1"].usageCount += 1
   tags["tag-2"].usageCount += 1
```

### Example 2: Create Income with Salary

```
User Input:
  - Amount: 50000
  - Currency: UAH
  - Account: "Приват24"
  - Is Salary: true
  - Date: 2025-01-27

Database Operations:
1. Create transaction record (same as expense)

2. Update account balance:
   accounts["account-1"].balance += 50000

3. Create salary period:
   {
     id: "uuid-2",
     startDate: timestamp("2025-01-27"),
     endDate: null,
     salaryTransactionId: "uuid-1",
     createdAt: now()
   }

4. Update previous salary period:
   salaryPeriods[previous].endDate = timestamp("2025-01-26")
```

### Example 3: Transfer with Currency Conversion

```
User Input:
  - Amount: 100
  - From Account: "Приват24" (UAH)
  - To Account: "Monobank USD" (USD)
  - Exchange Rate: 41.25 UAH/USD

Database Operations:
1. Create transaction record

2. Update source account:
   accounts["account-1"].balance -= 4125 UAH

3. Update destination account:
   accounts["account-2"].balance += 100 USD

4. Store exchange rate:
   exchangeRates["2025-01-22-UAH-USD"] = {
     rate: 0.02424,
     ...
   }
```

---

## Indexing Strategy

### Performance Considerations

1. **by-date**: Найчастіший запит - список транзакцій по даті
2. **by-category**: Статистика по категоріях
3. **by-tags (multiEntry)**: Фільтрація по тегах
4. **by-deleted**: Виключення видалених записів з вибірок

### Query Patterns

```typescript
// Get transactions for last month
db.transactions
  .index('by-date')
  .getAll(IDBKeyRange.bound(startOfMonth, endOfMonth))
  .then(txs => txs.filter(t => !t.deletedAt))

// Get expenses by category
db.transactions
  .index('by-category')
  .getAll(categoryId)
  .then(txs => txs.filter(t => t.type === 'expense' && !t.deletedAt))

// Get transactions by tag
db.transactions
  .index('by-tags')
  .getAll(tagId)
  .then(txs => txs.filter(t => !t.deletedAt))
```

---

## Migration Strategy

### Version Management

Database versions are incremented when schema changes occur:
- v1: Initial schema
- v2: Add new fields (future)
- v3: Add new stores (future)

### Migration Process

```typescript
const request = indexedDB.open('FinanceTrackerDB', 1);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const oldVersion = event.oldVersion;

  if (oldVersion < 1) {
    // Create initial schema
    createAccountsStore(db);
    createTransactionsStore(db);
    // ... create all stores
    seedDefaultData(db);
  }

  if (oldVersion < 2) {
    // Future migration: add new fields
    // Note: IndexedDB doesn't support ALTER TABLE
    // New fields are simply added to new records
  }
};
```

### Adding New Fields (Future)

```typescript
// v2: Add "notes" field to transactions
// No migration needed - just add to TypeScript interface
interface Transaction {
  // ... existing fields
  notes?: string; // Optional field for backwards compatibility
}

// Old records will have notes = undefined
// New records will have notes = string
```

### Data Seeding

```typescript
async function seedDefaultData(db) {
  // Seed currencies
  const currencies = [
    { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', isDefault: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', isDefault: false },
    // ...
  ];

  // Seed default categories
  const categories = [
    { id: uuid(), name: 'Їжа та продукти', type: 'expense', color: '#FF6B6B', icon: 'UtensilsCrossed', isDefault: true },
    { id: uuid(), name: 'Транспорт', type: 'expense', color: '#4ECDC4', icon: 'Car', isDefault: true },
    // ...
  ];

  // Seed user
  const user = {
    id: 'current',
    isGuest: true,
    defaultCurrency: 'UAH',
    email: null,
    createdAt: Date.now()
  };

  // Write to DB
  // ...
}
```

---

## Soft Delete Strategy

### Why Soft Delete?

1. Збереження історії транзакцій при видаленні рахунків
2. Можливість відновлення випадково видалених даних
3. Підготовка до синхронізації (v2) - tombstones

### Implementation

```typescript
// Active records
{ id: '1', name: 'Account', deletedAt: null }

// Deleted records
{ id: '1', name: 'Account', deletedAt: 1737517234567 }

// Query active records
accounts.filter(a => !a.deletedAt)

// Restore deleted record
account.deletedAt = null;
db.accounts.put(account);
```

### Garbage Collection (Future)

```typescript
// v2: Periodically clean up old deleted records (>90 days)
const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
db.accounts
  .index('by-deleted')
  .getAll(IDBKeyRange.upperBound(ninetyDaysAgo))
  .then(oldDeleted => {
    oldDeleted.forEach(record => {
      db.accounts.delete(record.id);
    });
  });
```

---

## Storage Limits

### Browser Storage Quotas

- **Chrome**: ~60% of available disk space (temporary storage)
- **Firefox**: ~10% of available disk space (up to 2GB for group)
- **Safari**: ~1GB (asks user for more)

### Estimated Storage Usage

```
1 transaction = ~500 bytes (with metadata)
1,000 transactions = ~500 KB
10,000 transactions = ~5 MB
100,000 transactions = ~50 MB

Realistic usage for 5 years:
  - 10 transactions/day
  - 3,650 transactions/year
  - 18,250 transactions/5 years
  - ~9 MB total

Conclusion: Storage is not a concern for v1
```

---

## Future Considerations (v2)

### Sync Fields

```typescript
interface Transaction {
  // ... existing fields
  version: number;        // Increment on each update
  syncedAt: number | null; // Last sync timestamp
  deviceId: string;       // Which device created it
}
```

### Conflict Resolution

```typescript
// Last-Write-Wins strategy
function resolveConflict(local, remote) {
  if (local.updatedAt > remote.updatedAt) {
    return local;
  } else if (remote.updatedAt > local.updatedAt) {
    return remote;
  } else {
    // Same timestamp - use version
    return local.version > remote.version ? local : remote;
  }
}
```

---

## Summary

✅ **8 Object Stores** covering all data needs
✅ **Indexes** for performant queries
✅ **Soft Delete** for data safety
✅ **Versioning** for future migrations
✅ **Currency Support** with conversion
✅ **Salary Periods** for custom analytics
✅ **Sync-ready** architecture (v2)

This schema provides a solid foundation for v1 and scales easily to v2! 🚀
