/**
 * Notifications state management (Svelte 5 reactive).
 * 
 * Manages in-app notifications, read/unread status, and push opt-in.
 * Uses mock data with in-memory state for mockup V1.0.
 * 
 * Features: mark as read, mark all as read, delete notifications.
 * 
 * TODO: Replace with server-side database operations in Database V2.x
 */

import { MOCK_NOTIFICATIONS, type NotificationItem } from '$mocks/notifications';

export function createNotificationsState() {
  let notifications = $state<NotificationItem[]>(MOCK_NOTIFICATIONS);

  const unreadCount = $derived(notifications.filter(n => !n.read).length);

  return {
    get notifications() { return notifications; },
    get unreadCount() { return unreadCount; },
    markAsRead(id: string) {
      notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    },
    markAllAsRead() {
      notifications = notifications.map(n => ({ ...n, read: true }));
    },
    deleteNotification(id: string) {
      notifications = notifications.filter(n => n.id !== id);
    }
  };
}

export const notificationsState = createNotificationsState();
