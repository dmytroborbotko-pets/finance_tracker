import { TrendingUp, TrendingDown, PieChart } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Analyze your spending patterns and trends
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-muted-foreground">Total Income</p>
          </div>
          <p className="text-2xl font-bold">₴25,000</p>
          <p className="text-sm text-muted-foreground mt-1">This month</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
          </div>
          <p className="text-2xl font-bold">₴9,580</p>
          <p className="text-sm text-muted-foreground mt-1">This month</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-medium text-muted-foreground">Net Savings</p>
          </div>
          <p className="text-2xl font-bold">₴15,420</p>
          <p className="text-sm text-muted-foreground mt-1">61.7% saved</p>
        </div>
      </div>

      {/* Spending by Category */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Spending by Category</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <span className="font-medium">Food & Groceries</span>
              </div>
              <span className="font-semibold">₴4,250</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: '44.4%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <span className="font-medium">Transport</span>
              </div>
              <span className="font-semibold">₴2,150</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: '22.4%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                <span className="font-medium">Entertainment</span>
              </div>
              <span className="font-semibold">₴1,800</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-purple-500" style={{ width: '18.8%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <span className="font-medium">Housing</span>
              </div>
              <span className="font-semibold">₴1,380</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500" style={{ width: '14.4%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Monthly Trend</h2>
        <div className="h-64 flex items-end justify-between gap-4">
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-primary/20 rounded-t" style={{ height: '60%' }}></div>
            <span className="text-xs text-muted-foreground">Oct</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-primary/20 rounded-t" style={{ height: '75%' }}></div>
            <span className="text-xs text-muted-foreground">Nov</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-primary/20 rounded-t" style={{ height: '85%' }}></div>
            <span className="text-xs text-muted-foreground">Dec</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-primary rounded-t" style={{ height: '100%' }}></div>
            <span className="text-xs text-muted-foreground">Jan</span>
          </div>
        </div>
      </div>
    </div>
  );
}
