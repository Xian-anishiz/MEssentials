<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import Button from '$components/ui/Button.svelte';
  import TextField from '$components/ui/TextField.svelte';

  let identifier = $state('');
  let password = $state('');
</script>

<svelte:head>
  <title>Administrator Portal - MEssentials</title>
</svelte:head>

<div class="min-h-screen bg-background flex flex-col items-center justify-center p-4">
  <div class="w-full max-w-[480px] bg-surface rounded-m3-xl p-8 shadow-m3-2 border border-outline-variant/30 flex flex-col gap-6">
    <div class="text-center flex flex-col gap-2">
      <h1 class="text-3xl font-medium text-primary tracking-tight">Administrator Portal</h1>
      <p class="text-sm text-on-surface-variant">UP Diliman ME Volcorps - Admin Dashboard</p>
    </div>

    {#if page.form?.error}
      <div class="bg-error-container/10 border border-error/30 text-error p-3 rounded-m3-md text-sm" role="alert">
        {page.form.error}
      </div>
    {/if}

    <form method="POST" action="?/password" use:enhance class="flex flex-col gap-4">
      <div class="flex flex-col gap-4 py-2">
        <TextField 
          label="Username or UP Email" 
          name="identifier"
          bind:value={identifier}
          placeholder="abpanganiban or admin@up.edu.ph" 
          autocomplete="username"
          required
        />
        <TextField 
          label="Password" 
          name="password"
          bind:value={password}
          type="password" 
          placeholder="••••••••" 
          autocomplete="current-password"
          required
        />
        <Button variant="primary" size="lg" class="w-full" type="submit">
          Sign In
        </Button>
      </div>
    </form>

    <div class="text-center pt-2 border-t border-outline-variant/30 text-xs text-on-surface-variant flex flex-col gap-1">
      <span class="flex items-center justify-center gap-3 flex-wrap">
        <span>Are you a</span>
        <a href="/login" class="font-medium hover:underline text-primary">Student?</a>
        <a href="/volunteers/login" class="font-medium hover:underline">Volunteer?</a>
      </span>
    </div>
  </div>
</div>
