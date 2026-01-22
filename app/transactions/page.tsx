import { Plus, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TransactionsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            View and manage all your transactions
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Transaction
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">Filters</Button>
      </div>

      {/* Transaction List */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Today</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium">Grocery Shopping</p>
                  <p className="text-sm text-muted-foreground">Food & Groceries • Приват24</p>
                  <p className="text-xs text-muted-foreground">14:32</p>
                </div>
              </div>
              <p className="font-semibold text-red-600">-₴850</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium">Morning Coffee</p>
                  <p className="text-sm text-muted-foreground">Food & Groceries • Cash</p>
                  <p className="text-xs text-muted-foreground">08:15</p>
                </div>
              </div>
              <p className="font-semibold text-red-600">-₴120</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t">
          <h2 className="text-xl font-semibold mb-4">Yesterday</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Salary</p>
                  <p className="text-sm text-muted-foreground">Income • Приват24</p>
                  <p className="text-xs text-muted-foreground">Jan 20, 9:00</p>
                </div>
              </div>
              <p className="font-semibold text-green-600">+₴25,000</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium">Taxi</p>
                  <p className="text-sm text-muted-foreground">Transport • Monobank</p>
                  <p className="text-xs text-muted-foreground">Jan 20, 18:45</p>
                </div>
              </div>
              <p className="font-semibold text-red-600">-₴250</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
