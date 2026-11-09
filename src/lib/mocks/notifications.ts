export interface NotificationItem {
  id: string;
  service: 'store' | 'kailangan' | 'megaral' | 'medays' | 'registration' | 'system';
  subject: string;
  body: string;
  link?: string;
  createdAt: string;
  read: boolean;
}

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    service: 'kailangan',
    subject: 'Borrowing Due Warning',
    body: 'Scientific Calculator FX-991ES (Calc #01) is overdue by 4 days. Please return immediately.',
    link: '/borrow',
    createdAt: '2026-11-09 08:30 AM',
    read: false
  },
  {
    id: 'n2',
    service: 'medays',
    subject: 'Event Registration Confirmed',
    body: 'Your registration for "ME Days 2026 Opening Ceremony & Exhibit" has been confirmed.',
    link: '/events',
    createdAt: '2026-11-08 02:15 PM',
    read: false
  },
  {
    id: 'n3',
    service: 'megaral',
    subject: 'New Reviewer Uploaded',
    body: 'ME 51 Fluid Mechanics Final Exam Archive (2023-2025) is now available for download.',
    link: '/reviewer',
    createdAt: '2026-10-28 10:00 AM',
    read: true
  },
  {
    id: 'n4',
    service: 'store',
    subject: 'HonestME Restock Alert',
    body: 'Piattos Cheese Flavor and Cloud 9 Chocolate Bars have been restocked.',
    link: '/store',
    createdAt: '2026-10-25 11:45 AM',
    read: true
  }
];
