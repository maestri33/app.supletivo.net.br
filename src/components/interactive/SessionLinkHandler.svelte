<script lang="ts">
  import { onMount } from "svelte";
  import { ApiError, exchangeSessionLink, getErrorMessage, whoami } from "@/lib/api";
  import { getRoleDestination } from "@/lib/roles";
  import { clearSession, saveLogin } from "@/lib/session";
  import { safeReturnTo } from "@/components/interactive/student/workflow";

  let status = $state<"loading" | "error">("loading");
  let errorMessage = $state("");
  let loginHref = $state("/");

  onMount(async () => {
    const url = new URL(window.location.href);
    const queryToken = url.searchParams.get("token")?.trim() || "";
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    const hashToken = hashParams.get("token")?.trim() || "";
    const token = queryToken || hashToken;
    const safeReturn = safeReturnTo(url.searchParams.get("return_to"));
    loginHref = safeReturn ? `/?return_to=${encodeURIComponent(safeReturn)}` : "/";

    if (queryToken || hashToken) {
      url.searchParams.delete("token");
      if (hashToken) {
        hashParams.delete("token");
        const nextHash = hashParams.toString();
        url.hash = nextHash ? `#${nextHash}` : "";
      }
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    }

    if (!token || token.length < 16) {
      status = "error";
      errorMessage = "Link de acesso inválido ou incompleto.";
      return;
    }

    try {
      const tokens = await exchangeSessionLink(token);
      saveLogin(tokens as unknown as Record<string, unknown>);
      const identity = await whoami().catch(() => null);
      if (identity) {
        saveLogin({ ...(tokens as unknown as Record<string, unknown>), ...identity });
      }
      const target = identity ? getRoleDestination(identity) : null;
      window.location.replace(safeReturn || target || "/student");
    } catch (err) {
      clearSession();
      status = "error";
      if (err instanceof ApiError && err.status === 401) {
        errorMessage = "Este link expirou ou já foi utilizado.";
      } else {
        errorMessage = getErrorMessage(err);
      }
    }
  });
</script>

<div class="w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl glass-panel border border-white/15 text-white shadow-2xl text-center space-y-4">
  {#if status === "loading"}
    <div class="flex flex-col items-center gap-3 py-4">
      <div class="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-[var(--yellow)]"></div>
      <h1 class="text-lg font-extrabold tracking-tight">Validando seu acesso...</h1>
      <p class="text-sm text-white/75">
        Aguarde um instante enquanto preparamos o seu portal do aluno.
      </p>
    </div>
  {:else}
    <div class="space-y-4 py-2">
      <h1 class="text-lg font-extrabold tracking-tight text-white">
        Não foi possível usar este link
      </h1>
      <p class="text-sm text-rose-200">{errorMessage}</p>
      <a
        href={loginHref}
        class="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#ffc400] px-5 text-sm font-extrabold text-[#0b1220] transition hover:brightness-95"
      >
        Entrar com seu WhatsApp
      </a>
    </div>
  {/if}
</div>
