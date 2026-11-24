import type { PageServerLoad } from './$types';

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

export const load: PageServerLoad = async ({ url }) => {
  // Parse query parameters for filtering, sorting, pagination
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = 10;
  const serviceType = url.searchParams.get('serviceType') || '';
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';
  const search = url.searchParams.get('search') || '';
  const sortKey = url.searchParams.get('sortKey') || 'dateTimeStart';
  const sortDirection = url.searchParams.get('sortDirection') || 'desc';

  // TODO: Replace with actual database query when usage_logs table is created
  // For now, return empty array - the table doesn't exist in the current migration
  const logs: UsageLog[] = [];
  const totalItems = 0;
  const totalPages = 1;
  const currentPage = 1;

  const serviceTypes = ['All Services', 'Store', 'Events', 'Borrow', 'Reviewer', 'Register'];

  return {
    logs,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    filters: { serviceType, dateFrom, dateTo, search },
    sort: { sortKey, sortDirection },
    serviceTypes,
  };
};