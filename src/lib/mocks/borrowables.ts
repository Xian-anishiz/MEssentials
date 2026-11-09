export interface BorrowableUnit {
  id: string;
  label: string;
  status: 'available' | 'borrowed' | 'unavailable';
}

export interface BorrowableItem {
  id: string;
  name: string;
  category: string;
  description: string;
  units: BorrowableUnit[];
}

export interface LoanRecord {
  id: string;
  itemName: string;
  unitLabel: string;
  borrowedAt: string;
  dueAt: string;
  status: 'active' | 'due_soon' | 'overdue';
}

export const INITIAL_BORROWABLES: BorrowableItem[] = [
  {
    id: 'b1',
    name: 'Scientific Calculator FX-991ES',
    category: 'school supplies',
    description: 'Casio scientific calculator with dual power and calculus features.',
    units: [
      { id: 'u1', label: 'Calc #01', status: 'borrowed' },
      { id: 'u2', label: 'Calc #02', status: 'available' },
      { id: 'u3', label: 'Calc #03', status: 'available' }
    ]
  },
  {
    id: 'b2',
    name: 'Vernier Caliper 6-inch',
    category: 'utilities',
    description: 'Precision measuring tool for laboratory and mechanical drawing.',
    units: [
      { id: 'u4', label: 'Caliper #01', status: 'borrowed' },
      { id: 'u5', label: 'Caliper #02', status: 'borrowed' }
    ]
  },
  {
    id: 'b3',
    name: 'Drafting Compass Set',
    category: 'school supplies',
    description: 'Professional metal compass and divider set for technical drafting.',
    units: [
      { id: 'u6', label: 'Compass #01', status: 'available' },
      { id: 'u7', label: 'Compass #02', status: 'available' }
    ]
  },
  {
    id: 'b4',
    name: 'Extension Cord 10m',
    category: 'utilities',
    description: 'Heavy duty 3-prong extension cord for events and drafting tables.',
    units: [
      { id: 'u8', label: 'Cord #01', status: 'available' },
      { id: 'u9', label: 'Cord #02', status: 'available' }
    ]
  }
];

export const INITIAL_LOANS: LoanRecord[] = [
  {
    id: 'l1',
    itemName: 'Scientific Calculator FX-991ES',
    unitLabel: 'Calc #01',
    borrowedAt: '2026-11-01',
    dueAt: '2026-11-05',
    status: 'overdue'
  },
  {
    id: 'l2',
    itemName: 'Vernier Caliper 6-inch',
    unitLabel: 'Caliper #01',
    borrowedAt: '2026-11-06',
    dueAt: '2026-11-12',
    status: 'due_soon'
  },
  {
    id: 'l3',
    itemName: 'Vernier Caliper 6-inch',
    unitLabel: 'Caliper #02',
    borrowedAt: '2026-11-07',
    dueAt: '2026-11-20',
    status: 'active'
  }
];
