<script lang="ts">
  import { onMount } from "svelte";
  import IdentityDocumentVerifier from "./IdentityDocumentVerifier.svelte";
  import AddressProofVerifier from "./AddressProofVerifier.svelte";
  import { getSession } from "@/lib/session";
  import { whoami } from "@/lib/api";

  let identityStatus = $state<"uncompleted" | "under_review" | "approved">("uncompleted");
  let addressStatus = $state<"pending" | "under_review" | "needs_kinship" | "approved">("pending");
  let studentName = $state<string>("Aluno");
  let countdown = $state(3);
  let timer: ReturnType<typeof setInterval> | null = null;

  let bothApproved = $derived(identityStatus === "approved" && addressStatus === "approved");

  onMount(async () => {
    try {
      const session = getSession();
      if (session?.name) {
        studentName = session.name;
      } else {
        const who = await whoami();
        if (who?.name) studentName = who.name;
      }
    } catch {
      // Fallback
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  });

  $effect(() => {
    if (bothApproved && !timer) {
      timer = setInterval(() => {
        if (countdown > 1) {
          countdown -= 1;
        } else {
          if (timer) clearInterval(timer);
          window.location.href = "/student";
        }
      }, 1000);
    }
  });

  function goToPainel() {
    if (timer) clearInterval(timer);
    window.location.href = "/student";
  }
</script>

<div class="w-full flex flex-col items-center gap-6">
  <!-- Cabeçalho Institucional -->
  <div class="text-center">
    <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-xs font-semibold text-emerald-300 mb-2">
      Validação Automatizada de Documentos
    </span>
    <h1 class="text-2xl font-black text-white font-display">Documentação da Matrícula</h1>
    <p class="text-xs text-white/70 mt-1">
      Envie seus documentos de identificação e residência com análise em tempo real pela IA.
    </p>
  </div>

  <!-- Bloco de Verificadores -->
  <div class="w-full flex flex-col gap-4">
    <IdentityDocumentVerifier
      canReceiveCnh={true}
      onStatusChange={(s) => { identityStatus = s; }}
    />

    <AddressProofVerifier
      studentName={studentName}
      onStatusChange={(s) => { addressStatus = s; }}
    />
  </div>

  <!-- Banner de Progressão / Sucesso quando ambos forem homologados -->
  {#if bothApproved}
    <div
      class="w-full rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-5 text-white backdrop-blur-xl shadow-2xl flex flex-col items-center text-center gap-3 animate-in fade-in zoom-in-95 duration-300"
      data-testid="docs-completion-banner"
    >
      <div class="size-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-2xl">
        🎉
      </div>

      <div>
        <h3 class="text-base font-extrabold text-white font-display">
          Documentação 100% Homologada pela IA!
        </h3>
        <p class="text-xs text-white/80 mt-1">
          Sua identidade e seu comprovante foram aprovados. Sua matrícula está autorizada.
        </p>
      </div>

      <div class="w-full max-w-xs mt-2 flex flex-col items-center gap-2">
        <button
          type="button"
          onclick={goToPainel}
          class="btn w-full py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--ink)] cursor-pointer"
        >
          Acessar Meu Painel Agora &rarr;
        </button>

        <span class="text-[11px] text-white/60">
          Avanço automático em {countdown}s…
        </span>
      </div>
    </div>
  {/if}
</div>
