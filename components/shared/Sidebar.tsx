'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, ArrowLeftRight, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/accounts', label: 'Accounts', icon: Wallet },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-background">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Finance Tracker</h1>
        <p className="text-sm text-muted-foreground">Manage your finances</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
