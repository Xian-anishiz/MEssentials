<script lang="ts">
  import { onMount } from 'svelte';
  import AdminTable from '$components/admin/AdminTable.svelte';
  import Pagination from '$components/admin/Pagination.svelte';
  import SortableTh from '$components/admin/SortableTh.svelte';
  import Select from '$components/ui/Select.svelte';
  import SearchInput from '$components/ui/SearchInput.svelte';
  import { MOCK_USAGE_LOGS, type UsageLog } from '$mocks/usageLogs';

  interface FilterState { serviceType: string; dateFrom: string; dateTo: string; search: string; }

  let allLogs = $state<UsageLog[]>([]);
  let filteredLogs = $state<UsageLog[]>([]);
  let filters = $state<FilterState>({ serviceType: '', dateFrom: '', dateTo: '', search: '' });
  let sortKey = $state<string>('dateTimeStart');
  let sortDirection = $state<'asc' | 'desc'>('desc');
  let currentPage = $state(1);
  const pageSize = 10;

  const totalPages = $derived(Math.ceil(filteredLogs.length / pageSize) || 1);
  const paginatedLogs = $derived(filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize));

  onMount(() => { allLogs = MOCK_USAGE_LOGS; applyFilters(); });

  function applyFilters() {
    let result = [...allLogs];
    if (filters.serviceType && filters.serviceType !== 'All Services') result = result.filter(log => log.serviceType === filters.serviceType);
    if (filters.dateFrom) result = result.filter(log => log.dateTimeStart >= filters.dateFrom);
    if (filters.dateTo) result = result.filter(log => log.dateTimeStart <= filters.dateTo + ' 23:59:59');
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(log => log.logId.toLowerCase().includes(search) || log.serviceId.toLowerCase().includes(search) || log.studentNumber.toLowerCase().includes(search) || (log.adminId?.toLowerCase().includes(search) ?? false) || log.location.toLowerCase().includes(search));
    }
    result.sort((a, b) => { const aVal = a[sortKey as keyof UsageLog] ?? ''; const bVal = b[sortKey as keyof UsageLog] ?? ''; if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1; if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1; return 0; });
    filteredLogs = result; currentPage = 1;
  }

  function toggleSort(key: string) {
    if (sortKey === key) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDirection = 'asc';
    }
    applyFilters();
  }
  function handleSearch(value: string) { filters.search = value; applyFilters(); }
  function resetFilters() { filters = { serviceType: '', dateFrom: '', dateTo: '', search: '' }; applyFilters(); }
  function formatDateTime(dt: string): string { const date = new Date(dt); return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  const serviceTypes = ['All Services', 'Store', 'Events', 'Borrow', 'Reviewer', 'Register'];
</script>
<svelte:head><title>Usage Logs — Admin</title></svelte:head>

<div class="flex flex-col gap-6">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div><h1 class="text-2xl font-normal text-on-surface">Usage Logs</h1><p class="text-sm text-on-surface-variant mt-1">Filter and review service usage activity</p></div>
  </div>
  <div class="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4 p-4 bg-surface-container/50 rounded-m3-xl border border-outline-variant/30">
    <div class="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
      <div class="sm:w-48 shrink-0">
        <Select label="Service Type" bind:value={filters.serviceType} options={serviceTypes} onchange={() => applyFilters()} />
      </div>
      <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div class="flex flex-col gap-1.5 sm:w-44">
          <label class="contents">
            <span class="text-sm font-medium text-on-surface-variant">Date From</span>
            <input type="date" bind:value={filters.dateFrom} onchange={applyFilters} class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
          </label>
        </div>
        <div class="flex flex-col gap-1.5 sm:w-44">
          <label class="contents">
            <span class="text-sm font-medium text-on-surface-variant">Date To</span>
            <input type="date" bind:value={filters.dateTo} onchange={applyFilters} class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
          </label>
        </div>
      </div>
    </div>
    <div class="flex items-end gap-3 lg:ml-auto">
      <div class="w-full sm:w-64 sm:max-w-xs">
        <SearchInput placeholder="Search logs..." value={filters.search} oninput={handleSearch} />
      </div>
      <button type="button" onclick={resetFilters} class="h-14 px-4 rounded-m3-sm border border-outline text-on-surface-variant hover:bg-surface-variant transition-colors shrink-0">Reset</button>
    </div>
  </div>
  <div class="rounded-m3-xl bg-surface border border-outline-variant/30 overflow-x-auto">
    <table class="w-full border-collapse">
      <thead><tr class="border-b border-outline-variant/30">
        <SortableTh label="Usage Log ID" sortKey="logId" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Service ID" sortKey="serviceId" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Service Type" sortKey="serviceType" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Student Number" sortKey="studentNumber" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Admin ID" sortKey="adminId" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Date Time Start" sortKey="dateTimeStart" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Date Time End" sortKey="dateTimeEnd" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Location" sortKey="location" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
      </tr></thead>
      <tbody>
        {#each paginatedLogs as row}
          <tr class="border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors">
            <td class="px-4 py-3 text-sm text-on-surface">{row.logId}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{row.serviceId}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{row.serviceType}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{row.studentNumber}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{row.adminId ?? '—'}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{formatDateTime(row.dateTimeStart)}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{formatDateTime(row.dateTimeEnd)}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{row.location}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if filteredLogs.length > 0}
    <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredLogs.length} pageSize={pageSize} onPageChange={(page) => currentPage = page} />
  {/if}
</div>