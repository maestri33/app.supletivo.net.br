<script lang="ts">
  import { onMount } from 'svelte';
  import { whoami, requestAuth, getErrorMessage, ApiError } from '@/lib/api';
  import { getAccessToken, getLogin, saveLogin } from '@/lib/session';
  import { getRoleDestination, type CanonicalEnvironment } from '@/lib/roles';
  let { role }: { role?: CanonicalEnvironment } = $props();
  let error = $state<string | null>(null);
  let busy = $state(true);
  async function resolve() {
    error = null;
    busy = true;
    if (!getAccessToken()) {
      window.location.replace(role === 'promoter' ? '/?role=promoter' : '/');
      return;
    }
    try {
      const identity = await whoami();
      saveLogin({ ...getLogin(), ...identity });
      let target = getRoleDestination(identity, role);
      if (!target && role) target = getRoleDestination(identity);
      if (!target) throw new Error('Não foi possível identificar a etapa da sua conta. Tente novamente.');
      if (role === 'hub' && target.startsWith('/hub/')) {
        const reviews = await requestAuth<Record<string, unknown[]>>('/api/v1/leadership/reviews');
        if (Object.values(reviews).some((items) => Array.isArray(items) && items.length > 0)) target = '/hub/review';
      }
      window.location.replace(target);
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) {
        window.location.replace('/');
        return;
      }
      error = failure instanceof Error ? failure.message : getErrorMessage(failure);
    } finally { busy = false; }
  }
  onMount(() => { void resolve(); });
</script>
<div class="mx-auto max-w-lg p-6 text-center" aria-live="polite">
  {#if error}
    <p role="alert" class="text-[var(--danger)]">{error}</p>
    <button type="button" class="btn mt-4 min-h-12 px-6" onclick={resolve}>Tentar novamente</button>
  {:else if busy}<p>Consultando sua conta...</p>{/if}
</div>
