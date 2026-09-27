<script lang="ts">
  import { onMount } from "svelte";
  import { ApiError, getPixPage, getLeadMe, type PixPage, type CheckoutOut } from "@/lib/api";

  interface Props {
    token: string;
    initialData?: CheckoutOut | PixPage | null;
  }

  let { token, initialData = null }: Props = $props();

  type Phase = "loading" | "ready" | "paid" | "notfound" | "error";

  const POLL_MS = 3_500;

  let phase = $state<Phase>(initialData ? "ready" : "loading");
  let data = $state<any>(initialData || null);
  let copied = $state(false);
  let isPaid = $state(false);

  function formatMoney(amount: string | number | undefined): string {
    if (!amount) return "R$ 0,00";
    const val = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(val)) return "R$ 0,00";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  async function load() {
    try {
      if (token && token !== "default" && !token.startsWith("sandbox")) {
        const next = await getPixPage(token);
        data = next;
        if (next.is_paid) {
          isPaid = true;
          phase = "paid";
          return;
        }
      }

      // Consulta status do lead logado (atualizado via webhook Asaas na borda)
      const lead = await getLeadMe();
      if (lead?.checkout?.is_paid || (lead as any)?.status === "paid") {
        isPaid = true;
        phase = "paid";
        return;
      }
      if (lead?.checkout) {
        data = { ...data, ...lead.checkout };
        phase = "ready";
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        if (!data) phase = "notfound";
      } else {
        if (!data) phase = "error";
      }
    }
  }

  async function copyPix() {
    const payload = data?.qrcode_payload;
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // Fallback
    }
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2500);
  }

  $effect(() => {
    if (phase === "paid") {
      const timer = setTimeout(() => {
        window.location.href = "/student/enrollment";
      }, 1500);
      return () => clearTimeout(timer);
    }
  });

  onMount(() => {
    void load();

    const timer = setInterval(() => {
      if (isPaid || document.visibilityState === "hidden") return;
      void load();
    }, POLL_MS);

    return () => clearInterval(timer);
  });
</script>

<main id="conteudo" class="flex flex-1 px-4 sm:px-6 py-4">
  <div class="m-auto flex w-full max-w-[440px] flex-col items-center gap-5">
    {#if phase === "loading"}
      <div class="w-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl text-center flex flex-col items-center gap-4">
        <div class="size-10 animate-spin rounded-full border-4 border-[var(--yellow)] border-t-transparent"></div>
        <h2 class="text-base font-bold text-white">Carregando cobrança PIX oficial…</h2>
        <p class="text-xs text-white/60">Conectando ao gateway bancário homologado do Supletivo Brasil.</p>
      </div>
    {:else if phase === "notfound"}
      <div class="w-full rounded-3xl border border-red-500/30 bg-red-950/30 p-6 backdrop-blur-xl text-center flex flex-col gap-3">
        <div class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-500/20 text-2xl">⚠️</div>
        <h1 class="text-lg font-bold text-white">Cobrança PIX não encontrada</h1>
        <p class="text-xs text-white/70 leading-relaxed">
          Esta cobrança já foi confirmada ou ainda não foi emitida. Acesse suas opções de pagamento abaixo.
        </p>
        <button
          type="button"
          onclick={() => window.location.reload()}
          class="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--yellow)] text-[var(--ink)] px-4 text-xs font-bold transition hover:opacity-90"
        >
          Recarregar Opções →
        </button>
      </div>
    {:else if phase === "error"}
      <div class="w-full rounded-3xl border border-amber-500/30 bg-amber-950/30 p-6 backdrop-blur-xl text-center flex flex-col gap-3">
        <div class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/20 text-2xl">🔌</div>
        <h1 class="text-lg font-bold text-white">Aguardando emissão no gateway</h1>
        <p class="text-xs text-white/70 leading-relaxed">
          O gateway está processando a chave. Clique para tentar novamente.
        </p>
        <button
          type="button"
          onclick={() => void load()}
          class="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--yellow)] text-[var(--ink)] px-4 text-xs font-bold transition hover:opacity-90 cursor-pointer"
        >
          Tentar novamente
        </button>
      </div>
    {:else if phase === "paid"}
      <div class="w-full rounded-3xl border border-emerald-500/30 bg-emerald-950/30 p-8 backdrop-blur-xl text-center flex flex-col gap-4 shadow-2xl">
        <div class="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-4xl">🎉</div>
        <h1 class="text-2xl font-extrabold text-white">Pagamento confirmado!</h1>
        <p class="text-xs text-emerald-200/90 leading-relaxed">
          Seu PIX foi processado com sucesso. Redirecionando para a ativação da sua matrícula...
        </p>
        <div class="mt-4 flex flex-col gap-2">
          <a
            href="/student/enrollment"
            class="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white transition hover:bg-emerald-500"
          >
            Continuar para a Matrícula →
          </a>
        </div>
      </div>
    {:else}
      <!-- Fase Ready: Exibição da cobrança PIX Oficial -->
      <div class="text-center">
        <h1 class="text-2xl font-display text-white">Pagamento da Matrícula</h1>
        <p class="mt-1 text-xs text-white/70">Pague via PIX para liberação imediata do seu ambiente de estudos</p>
      </div>

      <div class="w-full rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl flex flex-col items-center text-center gap-5 shadow-2xl">
        <div class="flex w-full items-center justify-between border-b border-white/10 pb-3">
          <span class="text-xs font-semibold text-white/70">Valor à vista com desconto</span>
          <span class="text-xl font-display font-black text-emerald-400">
            {formatMoney(data?.amount ?? 1615)}
          </span>
        </div>

        {#if data?.qrcode_image}
          {@const imgSrc = data.qrcode_image.startsWith("data:") || data.qrcode_image.startsWith("http") || data.qrcode_image.startsWith("/")
            ? data.qrcode_image
            : `data:image/png;base64,${data.qrcode_image}`}
          <div class="size-52 rounded-2xl bg-white p-3.5 shadow-2xl flex items-center justify-center border-4 border-white/20">
            <img
              src={imgSrc}
              alt="QR Code PIX Oficial"
              class="size-full object-contain"
            />
          </div>
          <p class="text-[11px] text-white/60">Abra o app do seu banco e escaneie o código acima</p>
        {:else if data?.qrcode_payload}
          <div class="size-52 rounded-2xl bg-white p-3.5 shadow-2xl flex items-center justify-center border-4 border-white/20">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data.qrcode_payload)}`}
              alt="QR Code PIX Oficial"
              class="size-full object-contain"
            />
          </div>
          <p class="text-[11px] text-white/60">Abra o app do seu banco e escaneie o código acima</p>
        {/if}

        {#if data?.qrcode_payload}
          <div class="flex w-full flex-col gap-1.5 text-left">
            <label for="pix-payload" class="text-[11px] font-semibold text-white/80">PIX Copia e Cola</label>
            <textarea
              id="pix-payload"
              readonly
              value={data.qrcode_payload}
              onclick={(e) => (e.currentTarget as HTMLTextAreaElement).select()}
              class="min-h-16 w-full resize-none rounded-xl border border-white/15 bg-black/40 p-3 font-mono text-[11px] text-white/90 focus:outline-none focus:border-[var(--yellow)]"
            ></textarea>
            <button
              type="button"
              onclick={copyPix}
              class="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--yellow)]/30 bg-[var(--yellow)]/10 hover:bg-[var(--yellow)]/20 py-2.5 text-xs font-bold text-[var(--yellow)] cursor-pointer transition-all"
            >
              <span>{copied ? "✓ Código copiado!" : "Copiar código PIX"}</span>
            </button>
          </div>
        {/if}

        <p class="text-[11px] text-white/50 leading-relaxed">
          Esta tela atualiza automaticamente assim que o pagamento for detectado pelo banco.
        </p>
      </div>
    {/if}
  </div>
</main>
