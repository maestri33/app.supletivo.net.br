<script lang="ts">
  import { onMount } from "svelte";
  import { ApiError, getPixPage, type PixPage } from "@/lib/api";

  interface Props {
    token: string;
  }

  let { token }: Props = $props();

  type Phase = "loading" | "ready" | "paid" | "notfound" | "error";

  const POLL_MS = 5_000;

  let phase = $state<Phase>("loading");
  let data = $state<PixPage | null>(null);
  let copied = $state(false);
  let isPaid = $state(false);

  function formatMoney(amount: string | number): string {
    const val = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(val)) return "R$ 0,00";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  async function load() {
    try {
      const next = await getPixPage(token);
      data = next;
      if (next.is_paid) {
        isPaid = true;
        phase = "paid";
      } else {
        phase = "ready";
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        phase = "notfound";
      } else {
        phase = "error";
      }
    }
  }

  async function copyPix() {
    const payload = data?.qrcode_payload;
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // Fallback: o textarea permanece selecionável
    }
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2500);
  }

  onMount(() => {
    void load();

    const timer = setInterval(() => {
      if (phase !== "ready" || isPaid || document.visibilityState === "hidden") return;
      void load();
    }, POLL_MS);

    return () => clearInterval(timer);
  });
</script>

<main id="conteudo" class="flex flex-1 px-6 py-4">
  <div class="m-auto flex w-full max-w-[400px] flex-col items-center gap-5">
    {#if phase === "loading"}
      <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl text-center flex flex-col items-center gap-4">
        <div class="size-10 animate-spin rounded-full border-4 border-brand-green border-t-transparent"></div>
        <h2 class="text-base font-bold text-white">Carregando seu código PIX…</h2>
        <p class="text-xs text-white/60">Aguarde um instante enquanto conectamos com o banco.</p>
      </div>
    {:else if phase === "notfound"}
      <div class="w-full rounded-2xl border border-red-500/30 bg-red-950/30 p-6 backdrop-blur-xl text-center flex flex-col gap-3">
        <div class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-500/20 text-2xl">⚠️</div>
        <h1 class="text-lg font-bold text-white">Link de pagamento inválido ou expirado</h1>
        <p class="text-xs text-white/70 leading-relaxed">
          Este link já foi utilizado ou não está mais ativo. Caso precise de uma nova cobrança, acesse o portal pelo link abaixo.
        </p>
        <a
          href="/login"
          class="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-green px-4 text-xs font-bold text-white transition hover:bg-brand-green-dark"
        >
          Acessar o Portal →
        </a>
      </div>
    {:else if phase === "error"}
      <div class="w-full rounded-2xl border border-amber-500/30 bg-amber-950/30 p-6 backdrop-blur-xl text-center flex flex-col gap-3">
        <div class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/20 text-2xl">🔌</div>
        <h1 class="text-lg font-bold text-white">Instabilidade ao carregar PIX</h1>
        <p class="text-xs text-white/70 leading-relaxed">
          Não conseguimos carregar os dados no momento. Toque no botão para tentar novamente.
        </p>
        <button
          type="button"
          onclick={() => void load()}
          class="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-green px-4 text-xs font-bold text-white transition hover:bg-brand-green-dark"
        >
          Tentar novamente
        </button>
      </div>
    {:else if phase === "paid"}
      <div class="w-full rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-6 backdrop-blur-xl text-center flex flex-col gap-4">
        <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-3xl">🎉</div>
        <h1 class="text-xl font-extrabold text-white">Pagamento confirmado!</h1>
        <p class="text-xs text-white/80 leading-relaxed">
          Recebemos o pagamento de <strong class="text-emerald-400">{formatMoney(data?.amount ?? 0)}</strong>. Sua matrícula foi liberada!
        </p>
        <div class="flex flex-col gap-2 pt-2">
          <a
            href="/matricula"
            class="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-green px-4 text-sm font-bold text-white shadow transition hover:bg-brand-green-dark"
          >
            Continuar Matrícula (Enviar Documentos) →
          </a>
          {#if data?.receipt_url}
            <a
              href={data.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              Ver comprovante oficial
            </a>
          {/if}
        </div>
      </div>
    {:else}
      <div class="text-center">
        <h1 class="text-xl font-bold text-white">Pagamento da Matrícula</h1>
        <p class="mt-1 text-xs text-white/75">Pague via PIX para liberação imediata</p>
      </div>

      <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex flex-col items-center text-center gap-4">
        <div class="flex w-full items-center justify-between border-b border-white/10 pb-3">
          <span class="text-xs font-semibold text-white/60">PIX à vista</span>
          <span class="text-lg font-black text-emerald-400">{formatMoney(data?.amount ?? 0)}</span>
        </div>

        {#if data?.qrcode_image}
          <div class="size-48 rounded-xl bg-white p-3 shadow-inner flex items-center justify-center">
            <img
              src={data.qrcode_image.startsWith("data:") ? data.qrcode_image : `data:image/png;base64,${data.qrcode_image}`}
              alt="QR Code PIX"
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
              class="min-h-16 w-full resize-none rounded-lg border border-white/15 bg-black/40 p-2.5 font-mono text-[11px] text-white/90 focus:outline-none focus:border-brand-green"
            ></textarea>
            <button
              type="button"
              onclick={copyPix}
              class="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/20"
            >
              <span>{copied ? "✓ Código copiado!" : "Copiar código PIX"}</span>
            </button>
          </div>
        {/if}

        <p class="text-[11px] text-white/50 leading-relaxed">
          Esta tela atualiza automaticamente assim que o banco confirmar.
        </p>
      </div>
    {/if}
  </div>
</main>
