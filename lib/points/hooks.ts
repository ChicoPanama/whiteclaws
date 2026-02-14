/**
 * Points Event Hooks — thin fire-and-forget wrappers.
 * Delegates to the unified points engine.
 */
import { emitParticipationEvent } from '@/lib/services/points-engine'

export function fireEvent(
  userId: string,
  eventType: string,
  metadata: Record<string, any> = {}
): void {
  emitParticipationEvent({
    user_id: userId,
    event_type: eventType as any,
    metadata,
  }).catch((err) => {
    console.error(`[Points] Failed to record ${eventType} for ${userId}:`, err)
  })
}

export function fireEvents(
  userId: string,
  events: Array<{ type: string; metadata?: Record<string, any> }>
): void {
  for (const event of events) {
    fireEvent(userId, event.type, event.metadata || {})
  }
}
