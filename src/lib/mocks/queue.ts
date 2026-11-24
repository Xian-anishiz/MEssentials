/**
 * Mock queue data for Registration frontend V1.0.
 * 
 * Provides static queue session state for the registration queue mockup.
 * Will be replaced with real database queries in Database V2.x.
 */

export interface QueueStatus {
  sessionName: string;
  sessionOpen: boolean;
  nowServing: number | null;
  inQueue: boolean;
  queueNumber: number | null;
  position: number | null;
  queueLength: number;
  adviserName: string | null;
  adviserDesk: string | null;
  location: string | null;
  status: 'waiting' | 'called' | 'completed' | 'left' | 'removed' | null;
}

export const MOCK_QUEUE: QueueStatus = {
  sessionName: 'AY 2026-2027 Sem 2 - Advising & Clearance',
  sessionOpen: true,
  nowServing: 106,
  inQueue: true,
  queueNumber: 120,
  position: 14,
  queueLength: 134,
  adviserName: 'Engr. Juan Dela Cruz',
  adviserDesk: 'Desk 3',
  location: 'IE-ME Building Room 102',
  status: 'waiting'
};
