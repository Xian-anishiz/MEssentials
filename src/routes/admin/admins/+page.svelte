<script lang="ts">
  import { page } from '$app/state';
  import { goto, invalidateAll } from '$app/navigation';
  import Pagination from '$components/admin/Pagination.svelte';
  import SortableTh from '$components/admin/SortableTh.svelte';
  import Checkbox from '$components/ui/Checkbox.svelte';
  import Button from '$components/ui/Button.svelte';
  import Modal from '$components/ui/Modal.svelte';

  interface AdminUser {
    id: string;
    displayId: string;
    nickname: string;
    email: string;
    isActive: boolean;
    createdAt: Date;
  }

  interface PageData {
    admins: AdminUser[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    filters: { activeOnly: boolean; search: string };
    sort: { sortKey: string; sortDirection: 'asc' | 'desc' };
    user?: { id: string };
  }

  const data = $derived(page.data as unknown as PageData);
  const currentUserId = $derived(data.user?.id ?? '');

  let searchDraft = $state('');
  $effect(() => {
    searchDraft = data.filters.search;
  });

  let addAdminModalOpen = $state(false);
  let newAdminNickname = $state('');
  let newAdminEmail = $state('');
  let newAdminPassword = $state('');
  let submitting = $state(false);
  let adminError = $state('');

  type QueryOverrides = Partial<{
    page: number;
    activeOnly: boolean;
    search: string;
    sortKey: string;
    sortDirection: 'asc' | 'desc';
  }>;

  function buildQuery(overrides: QueryOverrides = {}): string {
    const params = new URLSearchParams();
    params.set('page', String(overrides.page ?? data.currentPage));
    params.set('activeOnly', String(overrides.activeOnly ?? data.filters.activeOnly));

    const search = overrides.search ?? data.filters.search;
    if (search) params.set('search', search);

    params.set('sortKey', overrides.sortKey ?? data.sort.sortKey);
    params.set('sortDirection', overrides.sortDirection ?? data.sort.sortDirection);
    return `/admin/admins?${params.toString()}`;
  }

  function navigate(overrides: QueryOverrides = {}) {
    goto(buildQuery(overrides), { keepFocus: true, noScroll: true });
  }

  function applySearch() {
    navigate({ page: 1, search: searchDraft.trim() });
  }

  function toggleActiveOnly(checked: boolean) {
    navigate({ page: 1, activeOnly: checked });
  }

  function resetFilters() {
    searchDraft = '';
    goto('/admin/admins');
  }

  function toggleSort(key: string) {
    if (data.sort.sortKey === key) {
      navigate({ page: 1, sortDirection: data.sort.sortDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      navigate({ page: 1, sortKey: key, sortDirection: 'asc' });
    }
  }

  async function handleAddAdmin() {
    if (!newAdminNickname.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) return;

    submitting = true;
    adminError = '';

    try {
      const response = await fetch('/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: newAdminNickname.trim(),
          email: newAdminEmail.trim(),
          password: newAdminPassword,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: 'Failed to create admin' }));
        adminError = body.message || 'Failed to create admin';
        return;
      }

      addAdminModalOpen = false;
      newAdminNickname = '';
      newAdminEmail = '';
      newAdminPassword = '';
      await invalidateAll();
    } finally {
      submitting = false;
    }
  }

  async function toggleActive(admin: AdminUser) {
    if (admin.isActive && !confirm(`Deactivate ${admin.nickname}?`)) return;

    adminError = '';

    const response = await fetch(`/admin/admins/${admin.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !admin.isActive }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'Failed to update admin' }));
      adminError = body.message || 'Failed to update admin';
      return;
    }

    await invalidateAll();
  }
</script>

<svelte:head><title>Admins — Admin</title></svelte:head>

<div class="flex flex-col gap-6">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div><h1 class="text-2xl font-normal text-on-surface">Admins</h1><p class="text-sm text-on-surface-variant mt-1">Manage admin accounts</p></div>
    <Button variant="primary" onclick={() => { adminError = ''; addAdminModalOpen = true; }}><span class="material-symbols-outlined">person_add</span>Add Admin</Button>
  </div>

  {#if adminError && !addAdminModalOpen}
    <div class="bg-error-container/10 border border-error/30 text-error p-3 rounded-m3-md text-sm" role="alert">{adminError}</div>
  {/if}

  <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-surface-container/50 rounded-m3-xl border border-outline-variant/30">
    <div class="flex-1 min-w-0">
      <label class="flex items-center gap-2">
        <input type="text"
               bind:value={searchDraft}
               placeholder="Search by nickname, email, or name"
               class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface"
               onkeydown={(e) => e.key === 'Enter' && applySearch()} />
      </label>
    </div>
    <Checkbox label="Active only" checked={data.filters.activeOnly} onchange={toggleActiveOnly} />
    <button type="button" onclick={resetFilters} class="h-14 px-4 rounded-m3-sm border border-outline text-on-surface-variant hover:bg-surface-variant transition-colors shrink-0 sm:ml-auto">Reset</button>
  </div>

  <div class="rounded-m3-xl bg-surface border border-outline-variant/30 overflow-x-auto">
    <table class="w-full border-collapse">
      <thead><tr class="border-b border-outline-variant/30">
        <th class="px-4 py-3 text-left text-sm font-medium text-on-surface-variant">Admin ID</th>
        <SortableTh label="Nickname" sortKey="nickname" activeKey={data.sort.sortKey} direction={data.sort.sortDirection} onsort={toggleSort} />
        <SortableTh label="Email" sortKey="email" activeKey={data.sort.sortKey} direction={data.sort.sortDirection} onsort={toggleSort} />
        <SortableTh label="Status" sortKey="isActive" activeKey={data.sort.sortKey} direction={data.sort.sortDirection} onsort={toggleSort} />
        <th class="px-4 py-3 text-left text-sm font-medium text-on-surface-variant">Actions</th>
      </tr></thead>
      <tbody>
        {#each data.admins as admin (admin.id)}
          <tr class="border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors">
            <td class="px-4 py-3 text-sm text-on-surface">{admin.displayId}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{admin.nickname}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{admin.email}</td>
            <td class="px-4 py-3 text-sm text-on-surface">
              {#if admin.isActive}
                <span class="inline-block px-2.5 py-0.5 rounded-m3-sm text-xs font-medium bg-secondary-container text-on-secondary-container">Active</span>
              {:else}
                <span class="inline-block px-2.5 py-0.5 rounded-m3-sm text-xs font-medium bg-error-container text-on-error-container">Inactive</span>
              {/if}
            </td>
            <td class="px-4 py-3 text-sm text-on-surface">
              {#if admin.id === currentUserId}
                <span class="text-xs text-on-surface-variant">(you)</span>
              {:else}
                <button
                  type="button"
                  onclick={() => toggleActive(admin)}
                  class={`text-xs font-medium hover:underline ${admin.isActive ? 'text-error' : 'text-primary'}`}
                >
                  {admin.isActive ? 'Deactivate' : 'Activate'}
                </button>
              {/if}
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="5" class="px-4 py-8 text-center text-sm text-on-surface-variant">No admins found.</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if data.totalItems > 0}
    <Pagination
      currentPage={data.currentPage}
      totalPages={data.totalPages}
      totalItems={data.totalItems}
      pageSize={data.pageSize}
      onPageChange={(p) => navigate({ page: p })}
    />
  {/if}
</div>

<Modal isOpen={addAdminModalOpen} title="Add New Admin">
  <div class="flex flex-col gap-4">
    <p class="text-sm text-on-surface-variant">Enter details for the new admin account.</p>

    {#if adminError}
      <div class="bg-error-container/10 border border-error/30 text-error p-3 rounded-m3-md text-sm" role="alert">{adminError}</div>
    {/if}

    <div class="flex flex-col gap-3">
      <label class="flex flex-col gap-1 text-sm">
        <span>Nickname (username)</span>
        <input type="text" bind:value={newAdminNickname} placeholder="admin_user" autocomplete="off" class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span>Email (@up.edu.ph)</span>
        <input type="email" bind:value={newAdminEmail} placeholder="admin@up.edu.ph" autocomplete="off" class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span>Password</span>
        <input type="password" bind:value={newAdminPassword} placeholder="••••••••" autocomplete="new-password" class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
      </label>
    </div>
  </div>
  {#snippet actions()}
    <Button variant="text" onclick={() => { addAdminModalOpen = false; adminError = ''; }} disabled={submitting}>Cancel</Button>
    <Button variant="primary" disabled={submitting || !newAdminNickname.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()} onclick={handleAddAdmin}>Add Admin</Button>
  {/snippet}
</Modal>
