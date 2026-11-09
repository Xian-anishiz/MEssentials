import { INITIAL_BORROWABLES, INITIAL_LOANS, type BorrowableItem, type LoanRecord } from '$mocks/borrowables';

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
