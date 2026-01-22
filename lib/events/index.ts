/**
 * Event System Implementation
 *
 * Provides event-driven communication between components
 * using the browser's CustomEvent API
 */

import { AppEventType, AppEvent } from '@/lib/db/types';

/**
 * Dispatch a custom app event
 *
 * @param type - Event type from AppEventType enum
 * @param payload - Event payload data
 *
 * @example
 * ```typescript
 * dispatchAppEvent('transaction-created', newTransaction);
 * ```
 */
export function dispatchAppEvent<T = unknown>(
  type: AppEventType,
  payload: T
): void {
  const event: AppEvent<T> = {
    type,
    payload,
    timestamp: Date.now()
  };

  const customEvent = new CustomEvent(type, {
    detail: event,
    bubbles: true,
    cancelable: true
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(customEvent);

    // Log events in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Event] ${type}`, payload);
    }
  }
}

/**
 * Subscribe to an app event
 *
 * @param type - Event type to subscribe to
 * @param handler - Function to call when event is dispatched
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = subscribeToAppEvent('transaction-created', (event) => {
 *   console.log('Transaction created:', event.payload);
 * });
 *
 * // Later, unsubscribe
 * unsubscribe();
 * ```
 */
export function subscribeToAppEvent<T = unknown>(
  type: AppEventType,
  handler: (event: AppEvent<T>) => void
): () => void {
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<AppEvent<T>>;
    handler(customEvent.detail);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(type, listener as EventListener);
  }

  // Return unsubscribe function
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(type, listener as EventListener);
    }
  };
}

/**
 * Subscribe to multiple events with the same handler
 *
 * @param types - Array of event types to subscribe to
 * @param handler - Function to call when any event is dispatched
 * @returns Unsubscribe function for all events
 *
 * @example
 * ```typescript
 * const unsubscribe = subscribeToAppEvents(
 *   ['transaction-created', 'transaction-updated', 'transaction-deleted'],
 *   (event) => {
 *     refreshData();
 *   }
 * );
 * ```
 */
export function subscribeToAppEvents<T = unknown>(
  types: AppEventType[],
  handler: (event: AppEvent<T>) => void
): () => void {
  const unsubscribers = types.map(type => subscribeToAppEvent(type, handler));

  // Return function to unsubscribe from all
  return () => {
    unsubscribers.forEach(unsubscribe => unsubscribe());
  };
}

/**
 * Enable event logging for debugging
 * Only works in development mode
 */
export function enableEventLogging(): void {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
    return;
  }

  const allEvents = Object.values(AppEventType);

  allEvents.forEach(eventType => {
    subscribeToAppEvent(eventType, (event) => {
      console.group(`[Event] ${event.type}`);
      console.log('Timestamp:', new Date(event.timestamp).toISOString());
      console.log('Payload:', event.payload);
      console.groupEnd();
    });
  });

  console.log('✅ Event logging enabled');
}
