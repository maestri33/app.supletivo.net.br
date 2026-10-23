<script lang="ts">
  import { onMount } from 'svelte';
  import { whoami, ApiError, getErrorMessage } from '@/lib/api';
  import { getLogin, saveLogin, clearSession } from '@/lib/session';
  import { canVisitRolePath, getRoleDestination, type CanonicalEnvironment } from '@/lib/roles';
  let { pathname }: { pathname: string } = $props();
  let error = $state<string | null>(null);
  async function checkAccess() {
    error = null;
    try {
      const identity = await whoami();
      saveLogin({ ...getLogin(), ...identity });
      if (!canVisitRolePath(identity, pathname)) {
        const role = pathname.split('/')[1] as CanonicalEnvironment;
        const target = getRoleDestination(identity, role) ?? getRoleDestination(identity);
        if (!target) throw new Error('Não foi possível identificar a etapa da sua conta.');
        window.location.replace(target);
        return;
      }
      document.documentElement.dataset.roleAccess = 'ready';
      window.dispatchEvent(new CustomEvent('supletivo:identity', { detail: identity }));
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) {
        clearSession();
        window.location.replace('/');
        return;
      }
      error = failure instanceof Error ? failure.message : getErrorMessage(failure);
    }
  }
  onMount(() => { void checkAccess(); });
</script>
{#if error}
  <div role="alert" class="mx-auto max-w-lg p-6 text-center text-[var(--danger)]">
    <p>{error}</p>
    <button type="button" class="btn mt-4 min-h-12 px-6" onclick={checkAccess}>Tentar novamente</button>
  </div>
{/if}
