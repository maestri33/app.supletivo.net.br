<script lang="ts">
  import { onMount } from "svelte";

  interface ExamLocation {
    id: string;
    city: string;
    state: string;
    neighborhood: string;
    address: string;
    dates: string[];
  }

  const POLOS: ExamLocation[] = [
    {
      id: "sp-centro",
      city: "São Paulo",
      state: "SP",
      neighborhood: "República",
      address: "Rua Sete de Abril, 252 - 3º andar",
      dates: ["2026-09-22", "2026-09-29", "2026-10-06"],
    },
    {
      id: "sp-leste",
      city: "São Paulo",
      state: "SP",
      neighborhood: "Tatuapé",
      address: "Rua Tuiuti, 1820",
      dates: ["2026-09-24", "2026-10-01", "2026-10-08"],
    },
    {
      id: "rj-centro",
      city: "Rio de Janeiro",
      state: "RJ",
      neighborhood: "Centro",
      address: "Av. Rio Branco, 156 - Sobreloja",
      dates: ["2026-09-25", "2026-10-02"],
    },
  ];

  type FlowStatus = "exam_released" | "exam_scheduled" | "awaiting_diploma" | "awaiting_pickup" | "veteran";

  let status = $state<FlowStatus>("exam_released");
  let selectedPoloId = $state(POLOS[0].id);
  let selectedDate = $state(POLOS[0].dates[0]);
  let selectedTime = $state("14:00");
  let busy = $state(false);
  let busyMsg = $state<string | null>(null);

  let currentPolo = $derived(POLOS.find((p) => p.id === selectedPoloId) ?? POLOS[0]);

  function scheduleExam() {
    busy = true;
    busyMsg = "Confirmando seu agendamento no polo presencial…";
    setTimeout(() => {
      busy = false;
      busyMsg = null;
      status = "exam_scheduled";
    }, 800);
  }

  function simulateExamPass() {
    busy = true;
    busyMsg = "Lançando nota da prova presencial…";
    setTimeout(() => {
      busy = false;
      busyMsg = null;
      status = "awaiting_diploma";
    }, 700);
  }

  function simulateDiplomaReady() {
    busy = true;
    busyMsg = "Registrando emissão do diploma oficial…";
    setTimeout(() => {
      busy = false;
      busyMsg = null;
      status = "awaiting_pickup";
    }, 700);
  }

  function cancelSchedule() {
    status = "exam_released";
  }

  onMount(() => {
    // Sincronização inicial se necessário
  });
</script>

<main id="conteudo" class="flex flex-1 flex-col px-4 py-6 sm:px-6">
  <!-- Loading Overlay -->
  {#if busy}
    <div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-ink/70 backdrop-blur-sm px-6 text-center">
      <div class="size-10 animate-spin rounded-full border-4 border-brand-green border-t-transparent mb-4"></div>
      <p class="text-sm font-semibold text-white">{busyMsg}</p>
    </div>
  {/if}

  <div class="mx-auto w-full max-w-2xl flex flex-col gap-6">
    <!-- Stepper de Progresso do Diploma -->
    <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div class="flex items-center justify-between text-xs font-bold text-white mb-2">
        <span class={status === "exam_released" || status === "exam_scheduled" ? "text-emerald-400" : "text-white/60"}>1. Prova Presencial</span>
        <span>→</span>
        <span class={status === "awaiting_diploma" ? "text-emerald-400" : "text-white/60"}>2. Homologação MEC</span>
        <span>→</span>
        <span class={status === "awaiting_pickup" || status === "veteran" ? "text-emerald-400" : "text-white/60"}>3. Diploma Oficial</span>
      </div>
      <div class="h-2 w-full rounded-full bg-black/30 overflow-hidden">
        <div
          class="h-full bg-brand-green transition-all duration-500"
          style:width={status === "exam_released" ? "20%" : status === "exam_scheduled" ? "40%" : status === "awaiting_diploma" ? "70%" : "100%"}
        ></div>
      </div>
    </div>

    <!-- TELA 1: ESCOLHA DE POLO E DATA -->
    {#if status === "exam_released"}
      <div class="flex flex-col gap-5">
        <div>
          <h1 class="text-2xl font-extrabold text-white">Agendamento de Prova Presencial</h1>
          <p class="mt-1 text-xs text-white/70">
            Conforme determinação legal (LDB/MEC), a avaliação final conclusiva deve ser realizada presencialmente em polo autorizado.
          </p>
        </div>

        <div class="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div>
            <label for="polo-select" class="block text-xs font-semibold text-white/90 mb-1.5">Selecione o Polo de Aplicação</label>
            <select
              id="polo-select"
              bind:value={selectedPoloId}
              class="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-3 text-sm text-white focus:border-brand-green focus:outline-none"
            >
              {#each POLOS as polo (polo.id)}
                <option value={polo.id}>
                  {polo.city} ({polo.neighborhood}) — {polo.address}
                </option>
              {/each}
            </select>
          </div>

          <div>
            <label for="date-select" class="block text-xs font-semibold text-white/90 mb-1.5">Data Disponível</label>
            <select
              id="date-select"
              bind:value={selectedDate}
              class="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-3 text-sm text-white focus:border-brand-green focus:outline-none"
            >
              {#each currentPolo.dates as d (d)}
                <option value={d}>
                  {new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                </option>
              {/each}
            </select>
          </div>

          <div>
            <span class="block text-xs font-semibold text-white/90 mb-1.5">Horário</span>
            <div class="grid grid-cols-3 gap-2">
              {#each ["10:00", "14:00", "18:00"] as t (t)}
                <button
                  type="button"
                  onclick={() => { selectedTime = t; }}
                  class="rounded-xl border py-2.5 text-xs font-bold transition {selectedTime === t ? 'border-brand-green bg-brand-green text-white' : 'border-white/10 bg-black/30 text-white/70 hover:border-white/20'}"
                >
                  {t}
                </button>
              {/each}
            </div>
          </div>

          <button
            onclick={scheduleExam}
            class="mt-2 w-full rounded-xl bg-brand-green py-3.5 text-sm font-bold text-white transition hover:bg-brand-green-dark"
          >
            Confirmar Agendamento →
          </button>
        </div>
      </div>
    {/if}

    <!-- TELA 2: PROVA AGENDADA -->
    {#if status === "exam_scheduled"}
      <div class="flex flex-col gap-5">
        <div class="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 backdrop-blur-xl">
          <div class="flex items-center gap-2 text-emerald-400 mb-2">
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span class="text-sm font-bold">Prova Agendada com Sucesso</span>
          </div>

          <h1 class="text-xl font-extrabold text-white">{currentPolo.city} — {currentPolo.neighborhood}</h1>
          <p class="text-xs text-white/75 mt-0.5">{currentPolo.address}</p>

          <div class="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs">
            <div>
              <span class="text-white/60">Data:</span>
              <p class="font-bold text-white">{new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR")}</p>
            </div>
            <div>
              <span class="text-white/60">Horário:</span>
              <p class="font-bold text-white">{selectedTime}</p>
            </div>
          </div>

          <div class="mt-5 flex flex-col gap-2">
            <button
              onclick={simulateExamPass}
              class="w-full rounded-xl bg-brand-green py-3 text-sm font-bold text-white hover:bg-brand-green-dark"
            >
              Simular Aprovação na Prova →
            </button>
            <button
              onclick={cancelSchedule}
              class="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              Remarcar Horário
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- TELA 3: HOMOLOGAÇÃO DO DIPLOMA -->
    {#if status === "awaiting_diploma"}
      <div class="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex flex-col gap-4">
        <div class="flex items-center gap-2 text-amber-300">
          <div class="size-3 animate-ping rounded-full bg-amber-400"></div>
          <span class="text-xs font-bold uppercase tracking-wider">Emissão em Andamento</span>
        </div>
        <h1 class="text-xl font-bold text-white">Parabéns pela Aprovação!</h1>
        <p class="text-xs text-white/80 leading-relaxed">
          Você obteve nota superior a 6.0 na prova presencial. Seu histórico e ata de exame foram encaminhados para publicação no Diário Oficial e registro no Sistema Nacional do MEC.
        </p>
        <button
          onclick={simulateDiplomaReady}
          class="mt-2 w-full rounded-xl bg-brand-green py-3 text-sm font-bold text-white hover:bg-brand-green-dark"
        >
          Avançar para Conclusão →
        </button>
      </div>
    {/if}

    <!-- TELA 4: DIPLOMA DISPONÍVEL PARA RETIRADA -->
    {#if status === "awaiting_pickup"}
      <div class="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-6 backdrop-blur-xl flex flex-col gap-4 text-center">
        <div class="size-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <svg class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-black text-white">Diploma Registrado no MEC!</h1>
          <p class="mt-1 text-xs text-emerald-300 font-semibold">Publicado com validade nacional oficial.</p>
        </div>
        <p class="text-xs text-white/80">
          Seu documento físico original e o certificado digital autenticado com QR Code e carimbo do Diário Oficial estão prontos para retirada no polo.
        </p>
        <a
          href="/aluno"
          class="rounded-xl bg-brand-green py-3 text-sm font-bold text-white hover:bg-brand-green-dark"
        >
          Voltar ao Painel do Aluno
        </a>
      </div>
    {/if}
  </div>
</main>
