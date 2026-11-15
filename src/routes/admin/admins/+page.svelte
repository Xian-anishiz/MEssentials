<script lang="ts">
  import { onMount } from 'svelte';
  import Pagination from '$components/admin/Pagination.svelte';
  import SortableTh from '$components/admin/SortableTh.svelte';
  import Checkbox from '$components/ui/Checkbox.svelte';
  import Button from '$components/ui/Button.svelte';
  import Modal from '$components/ui/Modal.svelte';
  import { MOCK_ADMINS, type AdminUser } from '$mocks/admin';

  let allAdmins = $state<AdminUser[]>([]);
  let filteredAdmins = $state<AdminUser[]>([]);
  let filters = $state({ activeOnly: false });
  let sortKey = $state<string>('adminId');
  let sortDirection = $state<'asc' | 'desc'>('asc');
  let currentPage = $state(1);
  const pageSize = 10;

  let addAdminModalOpen = $state(false);
  let newAdminNickname = $state('');

  const totalPages = $derived(Math.ceil(filteredAdmins.length / pageSize) || 1);
  const paginatedAdmins = $derived(filteredAdmins.slice((currentPage - 1) * pageSize, currentPage * pageSize));

  onMount(() => { allAdmins = [...MOCK_ADMINS]; applyFilters(); });

  function applyFilters() {
    let result = [...allAdmins];
    if (filters.activeOnly) result = result.filter(a => a.isActive);
    result.sort((a, b) => { const aVal = a[sortKey as keyof AdminUser]; const bVal = b[sortKey as keyof AdminUser]; if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1; if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1; return 0; });
    filteredAdmins = result;
    currentPage = 1;
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

  function resetFilters() { filters = { activeOnly: false }; applyFilters(); }
  function handleAddAdmin() {
    if (newAdminNickname.trim()) {
      const newAdmin: AdminUser = { adminId: 'ADM-' + String(allAdmins.length + 1).padStart(3, '0'), nickname: newAdminNickname.trim(), isActive: true };
      allAdmins = [...allAdmins, newAdmin];
      filteredAdmins = [...allAdmins];
      addAdminModalOpen = false;
      newAdminNickname = '';
    }
  }
  function toggleActive(admin: AdminUser) {
    if (admin.adminId === 'A001') return; // Cannot deactivate own account
    allAdmins = allAdmins.map(a => a.adminId === admin.adminId ? { ...a, isActive: !a.isActive } : a);
    filteredAdmins = [...allAdmins];
  }
</script>

<svelte:head><title>Admins — Admin</title></svelte:head>

<div class="flex flex-col gap-6">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div><h1 class="text-2xl font-normal text-on-surface">Admins</h1><p class="text-sm text-on-surface-variant mt-1">Manage admin accounts</p></div>
    <Button variant="primary" onclick={() => addAdminModalOpen = true}><span class="material-symbols-outlined">person_add</span>Add Admin</Button>
  </div>
  <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-surface-container/50 rounded-m3-xl border border-outline-variant/30">
    <Checkbox label="Active only" bind:checked={filters.activeOnly} onchange={applyFilters} />
    <button type="button" onclick={resetFilters} class="h-14 px-4 rounded-m3-sm border border-outline text-on-surface-variant hover:bg-surface-variant transition-colors shrink-0 sm:ml-auto">Reset</button>
  </div>
  <div class="rounded-m3-xl bg-surface border border-outline-variant/30 overflow-x-auto">
    <table class="w-full border-collapse">
      <thead><tr class="border-b border-outline-variant/30">
        <SortableTh label="Admin ID" sortKey="adminId" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Nickname" sortKey="nickname" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
        <SortableTh label="Status" sortKey="isActive" activeKey={sortKey} direction={sortDirection} onsort={toggleSort} />
      </tr></thead>
      <tbody>
        {#each paginatedAdmins as admin (admin.adminId)}
          <tr class="border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors">
            <td class="px-4 py-3 text-sm text-on-surface">{admin.adminId}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{admin.nickname}</td>
            <td class="px-4 py-3 text-sm text-on-surface">
              {#if admin.isActive}
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
  {#if filteredAdmins.length > 0}
    <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredAdmins.length} pageSize={pageSize} onPageChange={(page) => currentPage = page} />
  {/if}
</div>

<Modal isOpen={addAdminModalOpen} title="Add New Admin">
  <div class="flex flex-col gap-4">
    <p class="text-sm text-on-surface-variant">Enter a nickname for the new admin account.</p>
    <input type="text" bind:value={newAdminNickname} placeholder="Nickname" class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
  </div>
  {#snippet actions()}
    <Button variant="text" onclick={() => { addAdminModalOpen = false; newAdminNickname = ''; }}>Cancel</Button>
    <Button variant="primary" disabled={!newAdminNickname.trim()} onclick={handleAddAdmin}>Add Admin</Button>
  {/snippet}
</Modal>