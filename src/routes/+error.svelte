
<script lang="ts">
  let {
    status,
    error
  }: {
    status: number;
    error: { message?: string };
  } = $props();

  const titleMap: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    500: 'Server Error'
  };

  const title = $derived(titleMap[status] || 'Error');
  const statusText = $derived(error?.message || 'An error occurred');
</script>

<svelte:head>
  <title>Error {status} — MEssentials</title>
</svelte:head>

<div class="flex min-h-full items-center justify-center bg-background p-4">
  <div class="w-full max-w-md rounded-m3-xl bg-surface p-8 shadow-m3-1 border border-outline-variant/30 text-center">
    <div class="mb-6">
      <span class="text-9xl font-bold text-error">{status}</span>
      <h1 class="mt-2 text-2xl font-normal text-on-surface">{title}</h1>
    </div>

    <p class="mb-8 text-base text-on-surface-variant">
      {statusText}
    </p>

    <div class="flex flex-col justify-center sm:flex-row gap-3">
      <a href="/" class="inline-flex items-center justify-center rounded-m3-sm bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <span class="material-symbols-outlined mr-2">home</span>
        Go to Home
      </a>

      <button
        onclick={() => history.back()}
        class="inline-flex items-center justify-center rounded-m3-sm border border-outline bg-surface text-on-surface-variant px-4 py-2 text-sm font-medium hover:bg-surface-variant/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span class="material-symbols-outlined mr-2">arrow_back</span>
        Go Back
      </button>
    </div>
  </div>
</div>
