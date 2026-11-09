<script lang="ts">
  import TextField from '$components/ui/TextField.svelte';
  import Select from '$components/ui/Select.svelte';
  import Button from '$components/ui/Button.svelte';
  import Checkbox from '$components/ui/Checkbox.svelte';
  import Modal from '$components/ui/Modal.svelte';
  import { authState } from '$stores/auth.svelte';
  import { COLLEGES, DEGREE_PROGRAMS } from '$mocks/academics';

  const user = $derived(authState.user);

  let firstName = $state('');
  let lastName = $state('');
  let phone = $state('');
  let college = $state('');
  let degreeProgram = $state('');

  $effect(() => {
    const currentUser = user;

    if (!currentUser) return;

    firstName = currentUser.firstName ?? '';
    lastName = currentUser.lastName ?? '';
    phone = currentUser.phone ?? '';
    college = currentUser.college ?? '';
    degreeProgram = currentUser.degreeProgram ?? '';
  });

  let isRfidModalOpen = $state(false);
  let rfidInput = $state('');

  function handleSaveProfile() {
    authState.updateProfile({ firstName, lastName, phone, college, degreeProgram });
    alert('Profile saved successfully!');
  }

  function handleRfidScan() {
    if (!rfidInput) return;
    authState.linkRfid(`•••• •••• ${rfidInput.slice(-4).toUpperCase()}`);
    rfidInput = '';
    isRfidModalOpen = false;
  }
</script>

<svelte:head>
  <title>Student Profile — MEssentials</title>
</svelte:head>

<div class="flex flex-1 min-h-full flex-col p-4 md:p-6 overflow-y-auto gap-8 max-w-3xl mx-auto w-full">
  <div class="flex items-center gap-4">
    <div class="size-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-3xl font-bold">
      {user.firstName[0]}{user.lastName[0]}
    </div>
    <div>
      <h1 class="text-2xl font-medium text-on-surface">{user.firstName} {user.lastName}</h1>
      <p class="text-sm text-on-surface-variant">{user.emailUsername}@up.edu.ph • {user.studentNumber}</p>
      <span class="inline-block mt-1 px-2.5 py-0.5 rounded-m3-sm bg-secondary-container text-on-secondary-container text-xs font-medium">Student</span>
    </div>
  </div>

  <!-- Profile Attributes -->
  <div class="flex flex-col gap-4 p-6 rounded-m3-xl bg-surface border border-outline-variant/40">
    <h2 class="text-lg font-medium text-on-surface">Personal Information</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <TextField label="First Name" value={firstName} oninput={(v) => firstName = v} />
      <TextField label="Last Name" value={lastName} oninput={(v) => lastName = v} />
      <TextField label="Student Number" value={user.studentNumber} readonly />
      <TextField label="UP Mail" value={`${user.emailUsername}@up.edu.ph`} readonly />
      <TextField label="Phone Number" value={phone} oninput={(v) => phone = v} />
      <Select label="College" bind:value={college} options={[...COLLEGES]} />
      <Select label="Degree Program" bind:value={degreeProgram} options={[...DEGREE_PROGRAMS]} />
    </div>
    <div class="flex justify-end pt-2">
      <Button variant="primary" onclick={handleSaveProfile}>Save Changes</Button>
    </div>
  </div>

  <!-- RFID Card Linking -->
  <div class="flex flex-col gap-4 p-6 rounded-m3-xl bg-surface border border-outline-variant/40">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-medium text-on-surface">Linked UP ID RFID Card</h2>
        <p class="text-xs text-on-surface-variant">Tap your student ID on an HID card reader for quick login.</p>
      </div>
      {#if user.rfidCardLinked}
        <Button variant="error" size="sm" onclick={() => authState.revokeRfid()}>Revoke Card</Button>
      {:else}
        <Button variant="primary" size="sm" onclick={() => isRfidModalOpen = true}>Link UP ID Card</Button>
      {/if}
    </div>
    <div class="p-4 rounded-m3-lg bg-surface-variant/40 border border-outline-variant/30 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined text-[28px] text-primary">credit_card</span>
        <div>
          <p class="text-sm font-medium text-on-surface">{user.rfidCardLinked ? `Card Linked: ${user.rfidCardMasked}` : 'No RFID Card Linked'}</p>
          <p class="text-xs text-on-surface-variant">{user.rfidCardLinked ? 'HMAC-SHA-256 Digest Protected' : 'Tap card to enable RFID authentication.'}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Notification Settings -->
  <div class="flex flex-col gap-4 p-6 rounded-m3-xl bg-surface border border-outline-variant/40">
    <h2 class="text-lg font-medium text-on-surface">Notification Preferences</h2>
    <div class="flex flex-col gap-2">
      <Checkbox label="HonestME Store Restock Alerts" checked={true} onchange={() => {}} />
      <Checkbox label="ME-kailangan Borrowing & Due Reminders" checked={true} onchange={() => {}} />
      <Checkbox label="MEg-aral New Reviewer Uploads" checked={true} onchange={() => {}} />
      <Checkbox label="ME Days Event Announcements" checked={true} onchange={() => {}} />
      <Checkbox label="Registration Queue Updates" checked={true} onchange={() => {}} />
    </div>
  </div>
</div>

<Modal isOpen={isRfidModalOpen} title="Link UP ID Card (USB HID Scanner)">
  <div class="flex flex-col gap-4">
    <p class="text-sm text-on-surface-variant">Tap your physical UP ID card on the USB reader while the input below is focused. The reader types the identifier and submits.</p>
    <TextField label="Card Identifier String" value={rfidInput} oninput={(v) => rfidInput = v} placeholder="Waiting for scanner input..." />
  </div>
  {#snippet actions()}
    <Button variant="text" onclick={() => isRfidModalOpen = false}>Cancel</Button>
    <Button variant="primary" onclick={handleRfidScan}>Confirm Card Link</Button>
  {/snippet}
</Modal>
