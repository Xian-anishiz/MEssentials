/**
 * Events (ME Days) state management (Svelte 5 reactive).
 * 
 * Manages events, registrations, and event details for ME Days.
 * Uses mock data with in-memory state for mockup V1.0.
 * 
 * Features: event CRUD, registration/unregistration, custom prompts.
 * 
 * TODO: Replace with server-side database operations in Database V2.x
 */

import { MOCK_EVENTS, type EventItem } from '$mocks/events';

export function createEventsState() {
  let events = $state<EventItem[]>(MOCK_EVENTS);

  const registeredEvents = $derived(events.filter(e => e.registered));
  const availableEvents = $derived(events.filter(e => !e.registered));

  return {
    get events() { return events; },
    get registeredEvents() { return registeredEvents; },
    get availableEvents() { return availableEvents; },
    registerEvent(id: string) {
      events = events.map(e => e.id === id ? { ...e, registered: true } : e);
    },
    unregisterEvent(id: string) {
      events = events.map(e => e.id === id ? { ...e, registered: false } : e);
    },
    removeEvent(id: string) {
      events = events.filter(e => e.id !== id);
    },
    addEvent(fields: { name: string; category: string; location: string; startsAt: string; description: string; capacity: number | null }) {
      if (!fields.name.trim()) return;
      events = [...events, {
        id: 'ev_' + Math.random().toString(36).substr(2, 9),
        name: fields.name.trim(),
        category: fields.category.trim() || 'others',
        description: fields.description.trim(),
        location: fields.location.trim(),
        startsAt: fields.startsAt,
        capacity: fields.capacity,
        registered: false,
        prompts: []
      }];
    }
  };
}

export const eventsState = createEventsState();
