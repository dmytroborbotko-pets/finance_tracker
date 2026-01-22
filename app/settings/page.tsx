'use client';

import { User, Database, Bell, Globe, Shield } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your app preferences and settings
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* Profile */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Profile</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">User Type</p>
              <p className="text-sm text-muted-foreground">Guest User</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Default Currency</p>
              <p className="text-sm text-muted-foreground">UAH (₴)</p>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Appearance</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">
                Choose your preferred theme
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Data & Storage */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Data & Storage</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="font-medium">Storage</p>
              <p className="text-sm text-muted-foreground">
                All data is stored locally in your browser
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm border rounded-lg hover:bg-accent transition-colors">
                Export Data
              </button>
              <button className="px-4 py-2 text-sm border rounded-lg hover:bg-accent transition-colors">
                Import Data
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Budget Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when you exceed your budget
                </p>
              </div>
              <button className="px-4 py-2 text-sm border rounded-lg hover:bg-accent transition-colors">
                Coming Soon
              </button>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Security & Privacy</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="font-medium">Data Privacy</p>
              <p className="text-sm text-muted-foreground">
                Your financial data never leaves your device
              </p>
            </div>
            <div>
              <p className="font-medium">Version</p>
              <p className="text-sm text-muted-foreground">v1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
