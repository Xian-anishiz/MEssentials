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
    }
  };
}

export const eventsState = createEventsState();
