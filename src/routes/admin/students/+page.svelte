<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Pagination from '$components/admin/Pagination.svelte';
  import SortableTh from '$components/admin/SortableTh.svelte';
  import Select from '$components/ui/Select.svelte';
  import Checkbox from '$components/ui/Checkbox.svelte';
  import SearchInput from '$components/ui/SearchInput.svelte';

  interface StudentUser {
    studentNumber: string;
    firstName: string;
    middleInitial: string;
    lastName: string;
    email: string;
    emailUsername: string;
    phone: string;
    college: string;
    degreeProgram: string;
    isActive: boolean;
    isEnrolled: boolean;
    createdAt: Date;
  }

  interface PageData {
    students: StudentUser[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    filters: { college: string; degreeProgram: string; activeOnly: boolean; enrolledOnly: boolean; search: string };
    sort: { sortKey: string; sortDirection: 'asc' | 'desc' };
    colleges: string[];
    degreePrograms: string[];
  }

  let allStudents = $state<StudentUser[]>([]);
  let filteredStudents = $state<StudentUser[]>([]);
  let filters = $state({ college: '', degreeProgram: '', activeOnly: false, enrolledOnly: false, search: '' });
  let sortKey = $state<string>('lastName');
  let sortDirection = $state<'asc' | 'desc'>('asc');
  let currentPage = $state(1);
  let totalPages = $state(1);
  let totalItems = $state(0);
  let colleges = $state<string[]>([]);
  let degreePrograms = $state<string[]>([]);
  const pageSize = 15;

  // Initialize from server data
  $effect.root(() => {
    $effect(() => {
      const data = $page.data as PageData;
      allStudents = data.students;
      totalItems = data.totalItems;
      totalPages = data.totalPages;
      currentPage = data.currentPage;
      filters = data.filters;
      sortKey = data.sort.sortKey;
      sortDirection = data.sort.sortDirection;
      colleges = data.colleges;
      degreePrograms = data.degreePrograms;
      applyFilters();
    });
  });

  const paginatedStudents = $derived(filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize));

  function applyFilters() {
    let result = [...allStudents];
    if (filters.college) result = result.filter(s => s.college === filters.college);
    if (filters.degreeProgram) result = result.filter(s => s.degreeProgram === filters.degreeProgram);
    if (filters.activeOnly) result = result.filter(s => s.isActive);
    if (filters.enrolledOnly) result = result.filter(s => s.isEnrolled);
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(s => 
        s.studentNumber.toLowerCase().includes(search) ||
        s.firstName.toLowerCase().includes(search) ||
        s.lastName.toLowerCase().includes(search) ||
        s.emailUsername.toLowerCase().includes(search)
      );
    }
    result.sort((a, b) => {
      const aVal = a[sortKey as keyof StudentUser];
      const bVal = b[sortKey as keyof StudentUser];
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    filteredStudents = result;
    currentPage = 1;
  }

  function toggleSort(key: string) {
    if (sortKey === key) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDirection = 'asc';
    }
    updateUrlAndReload();
  }

  function updateUrlAndReload() {
    const params = new URLSearchParams();
    params.set('page', String(currentPage));
    if (filters.college) params.set('college', filters.college);
    if (filters.degreeProgram) params.set('degreeProgram', filters.degreeProgram);
    if (filters.activeOnly) params.set('activeOnly', 'true');
    if (filters.enrolledOnly) params.set('enrolledOnly', 'true');
    if (filters.search) params.set('search', filters.search);
    params.set('sortKey', sortKey);
    params.set('sortDirection', sortDirection);
    goto(`/admin/students?${params.toString()}`);
  }

  function handleSearch(value: string) { 
    filters.search = value; 
    updateUrlAndReload();
  }
  
  function resetFilters() { 
    filters = { college: '', degreeProgram: '', activeOnly: false, enrolledOnly: false, search: '' }; 
    currentPage = 1;
    updateUrlAndReload();
  }
</script>
<svelte:head><title>Students — Admin</title></svelte:head>

<div class="flex flex-col gap-6">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div><h1 class="text-2xl font-normal text-on-surface">Students</h1><p class="text-sm text-on-surface-variant mt-1">View and filter student records</p></div>
  </div>
  <div class="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4 p-4 bg-surface-container/50 rounded-m3-xl border border-outline-variant/30">
    <div class="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
      <div class="sm:w-52 shrink-0">
        <Select label="College" bind:value={filters.college} options={['All Colleges', ...colleges]} onchange={updateUrlAndReload} />
      </div>
      <div class="sm:w-64 shrink-0">
        <Select label="Degree Program" bind:value={filters.degreeProgram} options={['All Programs', ...degreePrograms]} onchange={updateUrlAndReload} />
      </div>
      <div class="flex flex-col gap-1.5 w-full sm:w-auto">
        <span class="text-sm font-medium text-on-surface-variant">Status</span>
        <div class="h-14 flex flex-row items-center gap-x-6 gap-y-2 flex-wrap">
          <Checkbox label="Active only" bind:checked={filters.activeOnly} onchange={updateUrlAndReload} />
          <Checkbox label="Currently enrolled" bind:checked={filters.enrolledOnly} onchange={updateUrlAndReload} />
        </div>
      </div>
    </div>
    <div class="flex items-end gap-3 lg:ml-auto">
      <div class="w-full sm:w-64 sm:max-w-xs">
        <SearchInput placeholder="Search..." value={filters.search} oninput={handleSearch} />
      </div>
      <button type="button" onclick={resetFilters} class="h-14 px-4 rounded-m3-sm border border-outline text-on-surface-variant hover:bg-surface-variant transition-colors shrink-0">Reset</button>
    </div>
  </div>
  <div class="rounded-m3-xl bg-surface border border-outline-variant/30 overflow-x-auto">
    <table class="w-full border-collapse">
      <thead><tr class="border-b border-outline-variant/30">
        <SortableTh label="Student Number" sortKey="studentNumber" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="First Name" sortKey="firstName" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Middle Initial" sortKey="middleInitial" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Last Name" sortKey="lastName" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Email" sortKey="emailUsername" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Phone Number" sortKey="phone" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="College" sortKey="college" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Program" sortKey="degreeProgram" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
      </tr></thead>
      <tbody>
        {#each paginatedStudents as row (row.studentNumber)}
          <tr class="border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors">
            <td class="px-4 py-3 text-sm text-on-surface">{row.studentNumber}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{row.firstName}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{row.middleInitial}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{row.lastName}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{row.emailUsername}@up.edu.ph</td>
            <td class="px-4 py-3 text-sm text-on-surface">{row.phone}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{row.college}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{row.degreeProgram}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if filteredStudents.length > 0}
    <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredStudents.length} pageSize={pageSize} onPageChange={(page) => currentPage = page} />
  {/if}
</div>