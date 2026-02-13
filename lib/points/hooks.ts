/**
 * Points Event Hooks — fire-and-forget wrappers for use in API routes.
 *
 * These never block the parent request and never throw.
 * Import and call at the end of successful route handlers.
 *
 * Usage:
 *   import { fireEvent } from '@/lib/points/hooks'
 *   // ... at end of successful handler:
 *   fireEvent(userId, 'finding_submitted', { protocol: slug, severity })
 */

import { recordEvent, type EventType } from '@/lib/points/engine'

/**
 * Fire a participation event. Non-blocking — returns immediately.
 * The event is recorded asynchronously. Failures are logged, not thrown.
 */
export function fireEvent(
  userId: string,
  eventType: EventType,
  metadata: Record<string, any> = {}
): void {
  // Fire and forget — don't await
  recordEvent(userId, eventType, metadata).catch((err) => {
    console.error(`[Points] Failed to record ${eventType} for ${userId}:`, err)
  })
}

/**
 * Fire multiple events for a single action (e.g., submit with encryption + PoC).
 */
export function fireEvents(
  userId: string,
  events: Array<{ type: EventType; metadata?: Record<string, any> }>
): void {
  for (const event of events) {
    fireEvent(userId, event.type, event.metadata || {})
  }
}
