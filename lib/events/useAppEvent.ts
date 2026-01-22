/**
 * React hooks for subscribing to app events
 */

'use client';

import { useEffect, useRef } from 'react';
import { AppEventType, AppEvent } from '@/lib/db/types';
import { subscribeToAppEvent, subscribeToAppEvents } from './index';

/**
 * React hook to subscribe to a single app event
 *
 * @param type - Event type to subscribe to
 * @param handler - Function to call when event is dispatched
 * @param deps - Optional dependency array (like useEffect)
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { refresh } = useAccounts();
 *
 *   useAppEvent('transaction-created', (event) => {
 *     const transaction = event.payload;
 *     if (transaction.accountId === myAccountId) {
 *       refresh();
 *     }
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useAppEvent<T = unknown>(
  type: AppEventType,
  handler: (event: AppEvent<T>) => void,
  deps: React.DependencyList = []
): void {
  // Use ref to avoid re-subscribing unnecessarily
  const handlerRef = useRef(handler);

  // Update ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const unsubscribe = subscribeToAppEvent<T>(type, (event) => {
      handlerRef.current(event);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, ...deps]);
}

/**
 * React hook to subscribe to multiple app events
 *
 * @param types - Array of event types to subscribe to
 * @param handler - Function to call when any event is dispatched
 * @param deps - Optional dependency array (like useEffect)
 *
 * @example
 * ```typescript
 * function AnalyticsDashboard() {
 *   const { refresh } = useAnalytics();
 *
 *   useAppEvents(
 *     ['transaction-created', 'transaction-updated', 'transaction-deleted'],
 *     () => {
 *       refresh();
 *     }
 *   );
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useAppEvents<T = unknown>(
  types: AppEventType[],
  handler: (event: AppEvent<T>) => void,
  deps: React.DependencyList = []
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const unsubscribe = subscribeToAppEvents<T>(types, (event) => {
      handlerRef.current(event);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types.join(','), ...deps]);
}

/**
 * Hook to conditionally refresh data based on event payload
 *
 * @param type - Event type to subscribe to
 * @param condition - Function to determine if refresh should happen
 * @param onRefresh - Function to call when condition is true
 *
 * @example
 * ```typescript
 * function AccountCard({ accountId }) {
 *   const { refresh } = useAccount(accountId);
 *
 *   useConditionalRefresh(
 *     'transaction-created',
 *     (event) => {
 *       const transaction = event.payload;
 *       return transaction.fromAccountId === accountId ||
 *              transaction.toAccountId === accountId;
 *     },
 *     refresh
 *   );
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useConditionalRefresh<T = unknown>(
  type: AppEventType,
  condition: (event: AppEvent<T>) => boolean,
  onRefresh: () => void
): void {
  useAppEvent<T>(type, (event) => {
    if (condition(event)) {
      onRefresh();
    }
  });
}
