<script lang="ts">
  import { onMount } from 'svelte';
  import Pagination from '$components/admin/Pagination.svelte';
  import SortableTh from '$components/admin/SortableTh.svelte';
  import Select from '$components/ui/Select.svelte';
  import Checkbox from '$components/ui/Checkbox.svelte';
  import SearchInput from '$components/ui/SearchInput.svelte';
  import { MOCK_STUDENTS, type StudentProfile } from '$mocks/students';
  import { COLLEGES, DEGREE_PROGRAMS } from '$mocks/academics';

  let allStudents = $state<StudentProfile[]>([]);
  let filteredStudents = $state<StudentProfile[]>([]);
  let filters = $state({ college: '', degreeProgram: '', activeOnly: false, enrolledOnly: false, search: '' });
  let sortKey = $state<string>('lastName');
  let sortDirection = $state<'asc' | 'desc'>('asc');
  let currentPage = $state(1);
  const pageSize = 15;

  const totalPages = $derived(Math.ceil(filteredStudents.length / pageSize) || 1);
  const paginatedStudents = $derived(filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize));

  onMount(() => { allStudents = MOCK_STUDENTS; applyFilters(); });

  function applyFilters() {
    let result = [...allStudents];
    const collegeFilter = filters.college === 'All Colleges' ? '' : filters.college;
    const programFilter = filters.degreeProgram === 'All Programs' ? '' : filters.degreeProgram;
    if (collegeFilter) result = result.filter(s => s.college === collegeFilter);
    if (programFilter) result = result.filter(s => s.degreeProgram === programFilter);
    if (filters.activeOnly) result = result.filter(s => s.isActive);
    if (filters.enrolledOnly) result = result.filter(s => s.isEnrolled);
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(s => s.studentNumber.includes(search) || s.firstName.toLowerCase().includes(search) || s.lastName.toLowerCase().includes(search) || s.emailUsername.toLowerCase().includes(search));
    }
    result.sort((a, b) => { const aVal = a[sortKey as keyof StudentProfile]; const bVal = b[sortKey as keyof StudentProfile]; if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1; if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1; return 0; });
    filteredStudents = result; currentPage = 1;
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
  function resetFilters() { filters = { college: '', degreeProgram: '', activeOnly: false, enrolledOnly: false, search: '' }; applyFilters(); }

  const collegeOptions = ['All Colleges', ...COLLEGES];
</script>
<svelte:head><title>Students — Admin</title></svelte:head>

<div class="flex flex-col gap-6">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div><h1 class="text-2xl font-normal text-on-surface">Students</h1><p class="text-sm text-on-surface-variant mt-1">View and filter student records</p></div>
  </div>
  <div class="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4 p-4 bg-surface-container/50 rounded-m3-xl border border-outline-variant/30">
    <div class="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
      <div class="sm:w-52 shrink-0">
        <Select label="College" bind:value={filters.college} options={collegeOptions} onchange={() => applyFilters()} />
      </div>
      <div class="sm:w-64 shrink-0">
        <Select label="Degree Program" bind:value={filters.degreeProgram} options={['All Programs', ...DEGREE_PROGRAMS]} onchange={() => applyFilters()} />
      </div>
      <div class="flex flex-col gap-1.5 w-full sm:w-auto">
        <span class="text-sm font-medium text-on-surface-variant">Status</span>
        <div class="h-14 flex flex-row items-center gap-x-6 gap-y-2 flex-wrap">
          <Checkbox label="Active only" bind:checked={filters.activeOnly} onchange={applyFilters} />
          <Checkbox label="Currently enrolled" bind:checked={filters.enrolledOnly} onchange={applyFilters} />
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