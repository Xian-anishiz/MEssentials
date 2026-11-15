export interface UsageLog {
  logId: string;
  serviceId: string;
  serviceType: 'Store' | 'Events' | 'Borrow' | 'Reviewer' | 'Register';
  studentNumber: string;
  adminId: string | null;
  dateTimeStart: string;
  dateTimeEnd: string;
  location: string;
}

const serviceTypes: UsageLog['serviceType'][] = ['Store', 'Events', 'Borrow', 'Reviewer', 'Register'];
const locations = ['ME Building Lobby', 'Library Annex', 'Student Center', 'CAD Lab', 'ME Velasquez Auditorium', 'NCPAG Assembly Hall', 'UP Alumni Center', 'IE-ME Building Room 102'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateTime(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 12) + 8);
  date.setMinutes(Math.floor(Math.random() * 60));
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

export const MOCK_USAGE_LOGS: UsageLog[] = Array.from({ length: 100 }, (_, i) => {
  const daysAgo = Math.floor(Math.random() * 30);
  const start = randomDateTime(daysAgo);
  const endDate = new Date(start);
  endDate.setMinutes(endDate.getMinutes() + Math.floor(Math.random() * 120) + 10);

  return {
    logId: `LOG-${String(i + 1).padStart(5, '0')}`,
    serviceId: `SV-${randomItem(['STR', 'EVT', 'BRW', 'REV', 'REG'])}-${String(Math.floor(Math.random() * 100)).padStart(3, '0')}`,
    serviceType: randomItem(serviceTypes),
    studentNumber: `202${Math.floor(Math.random() * 5)}-${String(Math.floor(Math.random() * 90000) + 10000)}`,
    adminId: Math.random() > 0.3 ? `A00${Math.floor(Math.random() * 4) + 1}` : null,
    dateTimeStart: start,
    dateTimeEnd: endDate.toISOString().replace('T', ' ').substring(0, 19),
    location: randomItem(locations),
  };
}).sort((a, b) => new Date(b.dateTimeStart).getTime() - new Date(a.dateTimeStart).getTime());