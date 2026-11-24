<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Pagination from '$components/admin/Pagination.svelte';
  import SortableTh from '$components/admin/SortableTh.svelte';
  import Select from '$components/ui/Select.svelte';
  import Checkbox from '$components/ui/Checkbox.svelte';
  import SearchInput from '$components/ui/SearchInput.svelte';
  import Button from '$components/ui/Button.svelte';
  import Modal from '$components/ui/Modal.svelte';
  import RoleBadge from '$components/admin/RoleBadge.svelte';

  type VolunteerRole = 'store_manager' | 'kailangan_manager' | 'megaral_manager' | 'medays_manager' | 'registration_manager';

  interface VolunteerUser {
    studentNumber: string;
    firstName: string;
    middleInitial: string;
    lastName: string;
    email: string;
    emailUsername: string;
    phone: string;
    college: string;
    degreeProgram: string;
    volunteerRoles: VolunteerRole[];
    isActive: boolean;
  }

  interface PageData {
    volunteers: VolunteerUser[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    filters: { role: string; college: string; activeOnly: boolean; search: string };
    sort: { sortKey: string; sortDirection: 'asc' | 'desc' };
    colleges: string[];
    volunteerRoles: VolunteerRole[];
    roleLabels: Record<VolunteerRole, string>;
  }

  let allVolunteers = $state<VolunteerUser[]>([]);
  let filteredVolunteers = $state<VolunteerUser[]>([]);
  let filters = $state({ role: '', college: '', activeOnly: false, search: '' });
  let sortKey = $state<string>('lastName');
  let sortDirection = $state<'asc' | 'desc'>('asc');
  let currentPage = $state(1);
  let totalPages = $state(1);
  let totalItems = $state(0);
  let colleges = $state<string[]>([]);
  let volunteerRoles = $state<VolunteerRole[]>([]);
  let roleLabels = $state<Record<VolunteerRole, string>>({} as Record<VolunteerRole, string>);
  const pageSize = 10;

  let grantModalOpen = $state(false);
  let grantTargetLabel = $state('');
  let selectedRoles = $state<VolunteerRole[]>([]);

  // Initialize from server data
  $effect.root(() => {
    $effect(() => {
      const data = $page.data as PageData;
      allVolunteers = data.volunteers;
      totalItems = data.totalItems;
      totalPages = data.totalPages;
      currentPage = data.currentPage;
      filters = data.filters;
      sortKey = data.sort.sortKey;
      sortDirection = data.sort.sortDirection;
      colleges = data.colleges;
      volunteerRoles = data.volunteerRoles;
      roleLabels = data.roleLabels;
      applyFilters();
    });
  });

  const paginatedVolunteers = $derived(filteredVolunteers.slice((currentPage - 1) * pageSize, currentPage * pageSize));

  function applyFilters() {
    let result = [...allVolunteers];
    if (filters.role) {
      const roleKey = Object.entries(roleLabels).find(([, label]) => label === filters.role)?.[0] as VolunteerRole | undefined;
      if (roleKey) result = result.filter(v => v.volunteerRoles.includes(roleKey));
    }
    if (filters.college) result = result.filter(v => v.college === filters.college);
    if (filters.activeOnly) result = result.filter(v => v.isActive);
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(v => v.studentNumber.includes(search) || v.firstName.toLowerCase().includes(search) || v.lastName.toLowerCase().includes(search) || v.emailUsername.toLowerCase().includes(search));
    }
    if (sortKey === 'volunteerRoles') {
      result.sort((a, b) => {
        const aStr = a.volunteerRoles.map(r => roleLabels[r]).join(', ');
        const bStr = b.volunteerRoles.map(r => roleLabels[r]).join(', ');
        const cmp = aStr.localeCompare(bStr);
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    } else {
      result.sort((a, b) => { const aVal = a[sortKey as keyof VolunteerUser]; const bVal = b[sortKey as keyof VolunteerUser]; if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1; if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1; return 0; });
    }
    filteredVolunteers = result;
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
    if (filters.role) params.set('role', filters.role);
    if (filters.college) params.set('college', filters.college);
    if (filters.activeOnly) params.set('activeOnly', 'true');
    if (filters.search) params.set('search', filters.search);
    params.set('sortKey', sortKey);
    params.set('sortDirection', sortDirection);
    goto(`/admin/volunteers?${params.toString()}`);
  }

  function handleSearch(value: string) { filters.search = value; updateUrlAndReload(); }
  function resetFilters() { filters = { role: '', college: '', activeOnly: false, search: '' }; currentPage = 1; updateUrlAndReload(); }

  function grantRole(label: string, role: VolunteerRole) {
    const num = label.match(/\((\d{4}-\d+)\)/)?.[1];
    const student = num ? grantCandidates.find(s => s.studentNumber === num) : undefined;
    if (!student) return;
    const existing = allVolunteers.find(v => v.studentNumber === student.studentNumber);
    if (existing) {
      allVolunteers = allVolunteers.map(v => v.studentNumber === existing.studentNumber
        ? { ...v, volunteerRoles: Array.from(new Set([...v.volunteerRoles, role])) }
        : v);
    } else {
      allVolunteers = [...allVolunteers, {
        studentNumber: student.studentNumber,
        firstName: student.firstName,
        middleInitial: student.middleInitial,
        lastName: student.lastName,
        email: `${student.emailUsername}@up.edu.ph`,
        emailUsername: student.emailUsername,
        phone: student.phone,
        college: student.college,
        degreeProgram: student.degreeProgram,
        volunteerRoles: [role],
        isActive: true,
      }];
    }
    applyFilters();
  }

  function revokeRole(vol: VolunteerUser, role: VolunteerRole) {
    allVolunteers = allVolunteers.map(v => v.studentNumber === vol.studentNumber ? { ...v, volunteerRoles: v.volunteerRoles.filter(r => r !== role) } : v);
    applyFilters();
  }

  function openGrantModal() { grantTargetLabel = ''; selectedRoles = []; grantModalOpen = true; }

  type GrantCandidate = Pick<VolunteerUser, 'studentNumber' | 'firstName' | 'middleInitial' | 'lastName' | 'emailUsername' | 'phone' | 'college' | 'degreeProgram'>;

  const grantCandidates = $derived.by(() => {
    const byNumber = new Map<string, GrantCandidate>();
    const toCandidate = (s: { studentNumber: string; firstName: string; middleInitial: string; lastName: string; emailUsername: string; phone: string; college: string; degreeProgram: string }): GrantCandidate =>
      ({ studentNumber: s.studentNumber, firstName: s.firstName, middleInitial: s.middleInitial, lastName: s.lastName, emailUsername: s.emailUsername, phone: s.phone, college: s.college, degreeProgram: s.degreeProgram });
    for (const v of allVolunteers) byNumber.set(v.studentNumber, toCandidate(v));
    // TODO: Also include students who aren't volunteers yet (would need to fetch from students table)
    return [...byNumber.values()].sort((a, b) => a.lastName.localeCompare(b.lastName));
  });

  const grantTarget = $derived.by(() => {
    const num = grantTargetLabel.match(/\((\d{4}-\d+)\)/)?.[1];
    return num ? grantCandidates.find(s => s.studentNumber === num) : undefined;
  });

  const grantOptions = $derived(grantCandidates.map(s => `${s.firstName} ${s.middleInitial} ${s.lastName} (${s.studentNumber})`));

  function toggleSelectedRole(role: VolunteerRole, checked: boolean) {
    selectedRoles = checked
      ? [...selectedRoles.filter(r => r !== role), role]
      : selectedRoles.filter(r => r !== role);
  }

  function handleGrantSubmit() {
    if (!grantTarget || selectedRoles.length === 0) return;
    for (const role of selectedRoles) grantRole(grantTargetLabel, role);
    grantModalOpen = false;
  }
</script>
<svelte:head><title>Volunteers — Admin</title></svelte:head>

<div class="flex flex-col gap-6">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div><h1 class="text-2xl font-normal text-on-surface">Volunteers</h1><p class="text-sm text-on-surface-variant mt-1">View and manage volunteer roles</p></div>
    <Button variant="primary" onclick={openGrantModal}><span class="material-symbols-outlined">person_add</span>Grant Role</Button>
  </div>
  <div class="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4 p-4 bg-surface-container/50 rounded-m3-xl border border-outline-variant/30">
    <div class="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
      <div class="sm:w-48 shrink-0">
        <Select label="Role" bind:value={filters.role} options={['All Roles', ...volunteerRoles.map(r => roleLabels[r])]} onchange={updateUrlAndReload} />
      </div>
      <div class="sm:w-56 shrink-0">
        <Select label="College" bind:value={filters.college} options={['All Colleges', ...colleges]} onchange={updateUrlAndReload} />
      </div>
      <div class="pb-1 sm:pb-2.5">
        <Checkbox label="Active only" bind:checked={filters.activeOnly} onchange={updateUrlAndReload} />
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
        <SortableTh label="Name" sortKey="lastName" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Email" sortKey="emailUsername" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Roles" sortKey="volunteerRoles" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Status" sortKey="isActive" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
      </tr></thead>
      <tbody>
        {#each paginatedVolunteers as row (row.studentNumber)}
          <tr class="border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors">
            <td class="px-4 py-3 text-sm text-on-surface">{row.studentNumber}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{row.firstName} {row.middleInitial} {row.lastName}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{row.emailUsername}@up.edu.ph</td>
            <td class="px-4 py-3 text-sm text-on-surface">
              {#if row.volunteerRoles.length === 0}
                <span class="text-on-surface-variant">—</span>
              {:else}
                {#each row.volunteerRoles as role (role)}
                  <span class="group inline-flex items-center gap-0.5 mr-1.5">
                    <RoleBadge {role} size="sm" />
                    <button
                      type="button"
                      aria-label={`Remove ${roleLabels[role]} role from ${row.firstName} ${row.lastName}`}
                      onclick={() => revokeRole(row, role)}
                      class="p-1 rounded-m3-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                    >
                      <span class="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                {/each}
              {/if}
            </td>
            <td class="px-4 py-3 text-sm text-on-surface">
              {#if row.isActive}
                <span class="inline-block px-2.5 py-0.5 rounded-m3-sm text-xs font-medium bg-secondary-container text-on-secondary-container">Active</span>
              {:else}
                <span class="inline-block px-2.5 py-0.5 rounded-m3-sm text-xs font-medium bg-error-container text-on-error-container">Inactive</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if filteredVolunteers.length > 0}
    <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={(page) => { currentPage = page; updateUrlAndReload(); }} />
  {/if}
</div>

<Modal isOpen={grantModalOpen} title="Grant Role(s)">
  <div class="flex flex-col gap-4">
    <Select label="Student" bind:value={grantTargetLabel} options={grantOptions} onchange={() => selectedRoles = []} />
    {#if grantTarget}
      <p class="flex items-center flex-wrap gap-1.5 text-xs text-on-surface-variant">
        Current roles:
        {#if grantTarget && allVolunteers.find(v => v.studentNumber === grantTarget.studentNumber)?.volunteerRoles.length}
          {#each allVolunteers.find(v => v.studentNumber === grantTarget.studentNumber)!.volunteerRoles as r (r)}
            <RoleBadge role={r} size="sm" />
          {/each}
        {:else}
          None
        {/if}
      </p>
    {/if}
    <div class="flex flex-col gap-2">
      <span class="text-sm font-medium text-on-surface-variant">Roles to grant</span>
      {#each volunteerRoles as role (role)}
        <Checkbox
          label={roleLabels[role]}
          checked={selectedRoles.includes(role)}
          onchange={(checked) => toggleSelectedRole(role, checked)}
        />
      {/each}
    </div>
  </div>
  {#snippet actions()}
    <Button variant="text" onclick={() => grantModalOpen = false}>Cancel</Button>
    <Button variant="primary" disabled={!grantTarget || selectedRoles.length === 0} onclick={handleGrantSubmit}>Grant Roles</Button>
  {/snippet}
</Modal>