import { INITIAL_BORROWABLES, INITIAL_LOANS, type BorrowableItem, type BorrowableUnit, type LoanRecord } from '$mocks/borrowables';

export function createBorrowState() {
  let borrowables = $state<BorrowableItem[]>(INITIAL_BORROWABLES);
  let loans = $state<LoanRecord[]>(INITIAL_LOANS);

  const activeLoans = $derived(loans.filter(l => l.status !== 'active' || true)); // all active loans
  const dueSoonCount = $derived(loans.filter(l => l.status === 'due_soon').length);
  const overdueCount = $derived(loans.filter(l => l.status === 'overdue').length);

  return {
    get borrowables() { return borrowables; },
    get loans() { return loans; },
    get activeLoansCount() { return loans.length; },
    get dueSoonCount() { return dueSoonCount; },
    get overdueCount() { return overdueCount; },
    addBorrowable(data: { name: string; category: string; unitCount: number }) {
      if (typeof data.name !== 'string' || !data.name.trim()) return;
      const base = data.name.trim().split(/\s+/)[0];
      const prefix = base.length > 10 || base.length === 0 ? 'Unit' : base;
      const units: BorrowableUnit[] = Array.from({ length: data.unitCount }, (_, i) => ({
        id: 'u_' + Math.random().toString(36).substr(2, 9),
        label: `${prefix} #${String(i + 1).padStart(2, '0')}`,
        status: 'available' as const
      }));
      borrowables = [...borrowables, {
        id: 'b_' + Math.random().toString(36).substr(2, 9),
        name: data.name.trim(),
        category: data.category.trim(),
        description: '',
        units
      }];
    },
    updateBorrowable(id: string, fields: { name?: string; category?: string; addUnits?: number }) {
      const item = borrowables.find(b => b.id === id);
      if (!item) return;
      const base = (fields.name?.trim() || item.name).split(/\s+/)[0];
      const prefix = base.length > 10 || base.length === 0 ? 'Unit' : base;
      const extraCount = Math.max(0, fields.addUnits ?? 0);
      const startIdx = item.units.length;
      const extraUnits: BorrowableUnit[] = Array.from({ length: extraCount }, (_, i) => ({
        id: 'u_' + Math.random().toString(36).substr(2, 9),
        label: `${prefix} #${String(startIdx + i + 1).padStart(2, '0')}`,
        status: 'available' as const
      }));
      borrowables = borrowables.map(b => b.id === id
        ? {
            ...b,
            name: fields.name?.trim() || b.name,
            category: fields.category?.trim() || b.category,
            units: [...b.units, ...extraUnits]
          }
        : b);
    },
    removeBorrowable(id: string) {
      borrowables = borrowables.filter(b => b.id !== id);
    },
    borrowUnit(itemId: string, unitId: string, dueAt: string) {
      const item = borrowables.find(b => b.id === itemId);
      const unit = item?.units.find(u => u.id === unitId);
      if (!item || !unit) return;

      // Update unit status
      borrowables = borrowables.map(b => {
        if (b.id !== itemId) return b;
        return {
          ...b,
          units: b.units.map(u => u.id === unitId ? { ...u, status: 'borrowed' } : u)
        };
      });

      // Add loan record
      const newLoan: LoanRecord = {
        id: 'l_' + Math.random().toString(36).substr(2, 9),
        itemName: item.name,
        unitLabel: unit.label,
        borrowedAt: new Date().toISOString().split('T')[0],
        dueAt,
        status: 'active'
      };
      loans = [newLoan, ...loans];
    },
    returnLoan(loanId: string) {
      const loan = loans.find(l => l.id === loanId);
      if (!loan) return;

      // Return the physical unit to the pool of available units
      borrowables = borrowables.map(b => {
        if (b.name !== loan.itemName) return b;
        return {
          ...b,
          units: b.units.map(u => u.label === loan.unitLabel ? { ...u, status: 'available' } : u)
        };
      });

      loans = loans.filter(l => l.id !== loanId);
    }
  };
}

export const borrowState = createBorrowState();
