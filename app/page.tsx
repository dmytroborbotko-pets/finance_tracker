import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your Finance Tracker
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Balance
              </p>
              <p className="text-2xl font-bold">₴15,420</p>
            </div>
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                This Month Income
              </p>
              <p className="text-2xl font-bold text-green-600">+₴25,000</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                This Month Expenses
              </p>
              <p className="text-2xl font-bold text-red-600">-₴9,580</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Accounts
              </p>
              <p className="text-2xl font-bold">3</p>
            </div>
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium">Grocery Shopping</p>
                  <p className="text-sm text-muted-foreground">Today, 14:32</p>
                </div>
              </div>
              <p className="font-semibold text-red-600">-₴850</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Salary</p>
                  <p className="text-sm text-muted-foreground">Jan 20, 9:00</p>
                </div>
              </div>
              <p className="font-semibold text-green-600">+₴25,000</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium">Coffee</p>
                  <p className="text-sm text-muted-foreground">Jan 19, 11:15</p>
                </div>
              </div>
              <p className="font-semibold text-red-600">-₴120</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
