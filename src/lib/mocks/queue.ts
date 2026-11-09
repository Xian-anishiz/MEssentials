export interface QueueStatus {
  inQueue: boolean;
  sessionName: string;
  sessionOpen: boolean;
  queueNumber: number | null;
  position: number | null;
  queueLength: number;
  adviserName: string | null;
  adviserDesk: string | null;
  location: string | null;
  status: 'waiting' | 'called' | 'completed' | 'left' | 'removed' | null;
}

export const MOCK_QUEUE: QueueStatus = {
  inQueue: true,
  sessionName: 'AY 2026-2027 Sem 2 - Advising & Clearance',
  sessionOpen: true,
  queueNumber: 120,
  position: 14,
  queueLength: 134,
  adviserName: 'Engr. Juan Dela Cruz',
  adviserDesk: 'Desk 3',
  location: 'IE-ME Building Room 102',
  status: 'waiting'
};
