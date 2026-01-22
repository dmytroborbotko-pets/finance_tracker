import { Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccountsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your bank accounts and balances
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Account List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">Приват24</h3>
                <p className="text-sm text-muted-foreground">UAH</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold">₴12,450</p>
            <p className="text-sm text-muted-foreground mt-1">Main account</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Monobank</h3>
                <p className="text-sm text-muted-foreground">UAH</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold">₴2,970</p>
            <p className="text-sm text-muted-foreground mt-1">Savings</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold">Cash</h3>
                <p className="text-sm text-muted-foreground">UAH</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold">₴1,500</p>
            <p className="text-sm text-muted-foreground mt-1">Wallet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
