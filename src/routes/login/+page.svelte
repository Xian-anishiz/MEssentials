<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$components/ui/Button.svelte';
  import TextField from '$components/ui/TextField.svelte';
  import { authState } from '$stores/auth.svelte';

  let identifier = $state('');
  let password = $state('');
  let rfidInput = $state('');
  let activeTab = $state<'google' | 'rfid' | 'password'>('google');

  function handleGoogleLogin() {
    authState.login();
    goto('/store');
  }

  function handleRfidLogin() {
    if (!rfidInput) return;
    authState.login();
    goto('/store');
  }

  function handlePasswordLogin() {
    if (!identifier || !password) return;
    authState.login();
    goto('/store');
  }
</script>

<svelte:head>
  <title>Login — MEssentials</title>
</svelte:head>

<div class="min-h-screen bg-background flex flex-col items-center justify-center p-4">
  <div class="w-full max-w-[480px] bg-surface rounded-m3-xl p-8 shadow-m3-2 border border-outline-variant/30 flex flex-col gap-6">
    <div class="text-center flex flex-col gap-2">
      <h1 class="text-3xl font-medium text-primary tracking-tight">MEssentials</h1>
      <p class="text-sm text-on-surface-variant">UP Diliman Mechanical Engineering Student Services</p>
    </div>

    <!-- Login Method Tabs -->
    <div class="flex border-b border-outline-variant/40">
      <button 
        onclick={() => activeTab = 'google'} 
        class={`flex-1 py-2.5 text-xs font-medium border-b-2 text-center transition-colors ${activeTab === 'google' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}
      >
        UP Mail
      </button>
      <button 
        onclick={() => activeTab = 'rfid'} 
        class={`flex-1 py-2.5 text-xs font-medium border-b-2 text-center transition-colors ${activeTab === 'rfid' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}
      >
        RFID Tap
      </button>
      <button 
        onclick={() => activeTab = 'password'} 
        class={`flex-1 py-2.5 text-xs font-medium border-b-2 text-center transition-colors ${activeTab === 'password' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}
      >
        Password
      </button>
    </div>

    {#if activeTab === 'google'}
      <div class="flex flex-col gap-4 py-2">
        <p class="text-sm text-on-surface-variant text-center">Sign in using your verified @up.edu.ph Google account.</p>
        <Button variant="primary" size="lg" onclick={handleGoogleLogin} class="w-full">
          <span class="material-symbols-outlined">account_circle</span>
          Continue with UP Mail
        </Button>
      </div>
    {:else if activeTab === 'rfid'}
      <div class="flex flex-col gap-4 py-2">
        <p class="text-sm text-on-surface-variant text-center">Tap your registered physical UP ID card on the USB HID reader.</p>
        <TextField label="Card Scan Input" value={rfidInput} oninput={(v) => rfidInput = v} placeholder="Scan UP ID..." />
        <Button variant="primary" size="lg" onclick={handleRfidLogin} disabled={!rfidInput} class="w-full">
          <span class="material-symbols-outlined">contactless</span>
          Tap to Sign In
        </Button>
      </div>
    {:else}
      <div class="flex flex-col gap-4">
        <TextField label="Username or UP Email" value={identifier} oninput={(v) => identifier = v} placeholder="jmsantos2 or user@up.edu.ph" />
        <TextField label="Password" type="password" value={password} oninput={(v) => password = v} placeholder="••••••••" />
        <Button variant="primary" size="lg" onclick={handlePasswordLogin} disabled={!identifier || !password} class="w-full">
          Sign In
        </Button>
      </div>
    {/if}

    <div class="text-center pt-2 border-t border-outline-variant/30 text-xs text-on-surface-variant">
      Don't have an account? <a href="/signup" class="text-primary font-medium hover:underline">Sign up with UP Mail</a>
    </div>
  </div>
</div>
