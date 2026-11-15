<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$components/ui/Button.svelte';
  import TextField from '$components/ui/TextField.svelte';
  import Select from '$components/ui/Select.svelte';
  import { authState } from '$stores/auth.svelte';
  import { COLLEGES, getDegreeProgramOptions } from '$mocks/academics';

  let step = $state<'oauth' | 'profile'>('oauth');
  let firstName = $state('Juan');
  let middleInitial = $state('M.');
  let surname = $state('Santos');
  let studentNumber = $state('2023-12345');
  let phone = $state('+63 917 123 4567');
  let college = $state('College of Engineering');
  let degreeProgram = $state('B.S. Mechanical Engineering');
  let emailLocal = $state('jmsantos2');
  let rfidInput = $state('');

  const degreeProgramOptions = $derived(getDegreeProgramOptions(college));

  // Reset degree program when the college changes and the selected value is unavailable
  $effect(() => {
    if (!degreeProgramOptions.includes(degreeProgram)) {
      degreeProgram = degreeProgramOptions[0];
    }
  });

  function handleGoogleAuth() {
    step = 'profile';
  }

  function handleCompleteRegistration() {
    authState.updateProfile({
      firstName,
      middleInitial,
      lastName: surname,
      studentNumber,
      phone,
      college,
      degreeProgram,
      emailUsername: emailLocal
    });
    if (rfidInput) {
      authState.linkRfid(`•••• •••• ${rfidInput.slice(-4).toUpperCase()}`);
    }
    authState.login();
    goto('/store');
  }
</script>

<svelte:head>
  <title>Student Sign Up — MEssentials</title>
</svelte:head>

<div class="min-h-screen bg-background flex flex-col items-center justify-center p-4">
  <div class="w-full max-w-[560px] bg-surface rounded-m3-xl p-8 shadow-m3-2 border border-outline-variant/30 flex flex-col gap-6">
    <div class="text-center flex flex-col gap-1">
      <h1 class="text-2xl font-medium text-primary">Student Registration</h1>
      <p class="text-xs text-on-surface-variant">UP Diliman Mechanical Engineering Account Setup</p>
    </div>

    {#if step === 'oauth'}
      <div class="flex flex-col gap-6 text-center py-4">
        <p class="text-sm text-on-surface">Account creation requires a verified Google identity with an exact <strong>@up.edu.ph</strong> address.</p>
        <Button variant="primary" size="lg" onclick={handleGoogleAuth} class="w-full">
          <span class="material-symbols-outlined">account_circle</span>
          Verify & Continue with UP Mail
        </Button>
      </div>
    {:else}
      <form onsubmit={(e) => { e.preventDefault(); handleCompleteRegistration(); }} class="flex flex-col gap-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="First Name" value={firstName} oninput={(v) => firstName = v} required />
          <TextField label="Middle Initial" value={middleInitial} oninput={(v) => middleInitial = v} />
          <TextField label="Surname" value={surname} oninput={(v) => surname = v} required />
          <TextField label="Student Number" value={studentNumber} oninput={(v) => studentNumber = v} required />
          <TextField label="Phone Number" value={phone} oninput={(v) => phone = v} required />
          <Select label="College" bind:value={college} options={[...COLLEGES]} required />
          <Select label="Degree Program" bind:value={degreeProgram} options={degreeProgramOptions} required />
          
          <div class="flex flex-col gap-1.5">
            <label for="upmail-local" class="text-sm font-medium text-on-surface-variant">UP Mail Username</label>
            <div class="flex items-center w-full min-w-0">
              <input id="upmail-local" type="text" bind:value={emailLocal} class="h-12 px-4 rounded-l-m3-sm bg-surface-variant/40 border border-outline-variant text-on-surface text-base focus:outline-none flex-1 min-w-0" />
              <span class="h-12 px-3 flex items-center bg-surface-variant text-on-surface-variant text-sm font-medium rounded-r-m3-sm border border-l-0 border-outline-variant">@up.edu.ph</span>
            </div>
          </div>
        </div>

        <div class="pt-2 border-t border-outline-variant/30">
          <p class="text-sm font-medium text-on-surface mb-1.5">Tap your UP ID to link it (Optional)</p>
          <TextField label="" value={rfidInput} oninput={(v) => rfidInput = v} placeholder="Scan physical UP ID card..." />
        </div>

        <div class="flex items-center justify-between pt-4 border-t border-outline-variant/30">
          <a href="/login" class="text-xs text-on-surface-variant hover:text-primary">Cancel</a>
          <Button variant="primary" size="lg" type="submit">Complete Registration</Button>
        </div>
      </form>
    {/if}
  </div>
</div>
