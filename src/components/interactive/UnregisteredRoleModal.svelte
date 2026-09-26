<script lang="ts">
  import Modal from "@/components/ui/Modal.svelte";

  interface Props {
    isOpen?: boolean;
    phone?: string;
    isSubmitting?: boolean;
    onClose: () => void;
    onSelectRole: (role: "aluno" | "promotor") => void;
  }

  let {
    isOpen = false,
    phone = "",
    isSubmitting = false,
    onClose,
    onSelectRole,
  }: Props = $props();

  let selectedRole = $state<"aluno" | "promotor" | null>(null);

  let phoneDigits = $derived(phone.replace(/\D/g, ""));
  let alunoUrl = $derived(
    phoneDigits
      ? `https://supletivo.net.br?tel=${encodeURIComponent(phoneDigits)}&modal=cadastro`
      : "https://supletivo.net.br"
  );
  let promotorUrl = $derived(
    phoneDigits
      ? `https://promotor.supletivo.net.br?tel=${encodeURIComponent(phoneDigits)}&modal=cadastro`
      : "https://promotor.supletivo.net.br"
  );

  function choose(role: "aluno" | "promotor", e?: MouseEvent) {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    selectedRole = role;
    onSelectRole(role);
  }

  function formatDisplayPhone(val: string) {
    const d = val.replace(/\D/g, "");
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
</script>

<Modal
  {isOpen}
  {onClose}
  eyebrow="Primeiro Acesso"
  eyebrowVariant="yellow"
  title="Como deseja continuar?"
  description="Identificamos que seu WhatsApp ainda não possui matrícula ou credenciamento ativo. Escolha seu objetivo para acessar a página correspondente:"
  testId="unregistered-role-modal"
  size="lg"
>
  <div class="flex flex-col gap-5">
    {#if phone}
      <div class="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">
        <span class="text-white/60">WhatsApp verificado:</span>
        <span class="font-mono font-bold text-emerald-300">{formatDisplayPhone(phone)}</span>
      </div>
    {/if}

    <!-- Grid com 2 Cards de Escolha e Redirecionamento -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="role-cards-container">
      
      <!-- CARD 1: QUERO SER ALUNO (LANDING PAGE ALUNO) -->
      <a
        href={alunoUrl}
        onclick={(e) => choose("aluno", e)}
        data-testid="card-role-aluno"
        class="group relative flex flex-col justify-between p-5 rounded-2xl border border-white/15 bg-white/5 hover:bg-emerald-950/40 hover:border-emerald-400/90 transition-all duration-300 text-left active:scale-[0.99] cursor-pointer shadow-lg overflow-hidden no-underline"
      >
        <!-- Glow Dinâmico de Fundo -->
        <div class="absolute -right-8 -top-8 size-28 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/25 transition-all duration-300 pointer-events-none"></div>

        <div class="flex flex-col gap-4 relative z-10">
          <div class="flex items-start justify-between">
            <!-- SVG ANIMADO: CAPELO ACADÊMICO & ESTRELAS DE CONQUISTA -->
            <div class="size-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center p-2 text-emerald-300 group-hover:border-emerald-400/60 transition-colors shadow-inner">
              <svg
                class="size-10 text-emerald-400 group-hover:scale-105 transition-transform duration-300"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <!-- Fundo Suave / Aura -->
                <circle cx="32" cy="32" r="26" class="fill-emerald-500/10 animate-pulse" />

                <!-- Losango do Capelo -->
                <path
                  d="M32 14L10 24L32 34L54 24L32 14Z"
                  class="fill-emerald-950 stroke-emerald-400"
                  stroke-width="2.5"
                  stroke-linejoin="round"
                />

                <!-- Reflexo Superior -->
                <path
                  d="M32 16.5L14 24L32 31.5L50 24L32 16.5Z"
                  class="fill-emerald-400/20"
                />

                <!-- Copa do Capelo -->
                <path
                  d="M20 29.5V38.5C20 43.5 25.4 46.5 32 46.5C38.6 46.5 44 43.5 44 38.5V29.5"
                  class="stroke-emerald-400 fill-emerald-950/60"
                  stroke-width="2.5"
                  stroke-linecap="round"
                />

                <!-- Borla / Tassel Pendular Animado -->
                <g class="aluno-tassel-pendulum">
                  <path
                    d="M32 24L48 29.5V42"
                    class="stroke-amber-300"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <circle cx="48" cy="43.5" r="2.5" class="fill-amber-400" />
                  <path d="M48 46V51" class="stroke-amber-300" stroke-width="2.5" stroke-linecap="round" />
                </g>

                <!-- Pino Central -->
                <circle cx="32" cy="24" r="2.2" class="fill-amber-400" />

                <!-- Estrelas de Brilho / Conquista -->
                <g class="aluno-sparkle-1">
                  <path d="M49 11L50.5 14L53.5 15.5L50.5 17L49 20L47.5 17L44.5 15.5L47.5 14L49 11Z" class="fill-amber-400" />
                </g>
                <g class="aluno-sparkle-2">
                  <path d="M12 36L13 38.5L15.5 39.5L13 40.5L12 43L11 40.5L8.5 39.5L11 38.5L12 36Z" class="fill-emerald-300" />
                </g>
              </svg>
            </div>

            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-extrabold uppercase tracking-wide text-emerald-300">
              Ensino Médio
            </span>
          </div>

          <div>
            <h4 class="text-base font-black text-white font-display tracking-tight group-hover:text-emerald-300 transition">
              Quero ser Aluno
            </h4>
            <p class="text-xs text-white/70 leading-relaxed mt-1">
              Conclua o Ensino Médio com aulas 100% online, prova presencial única e diploma autorizado pelo MEC.
            </p>
          </div>
        </div>

        <div class="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-emerald-300 group-hover:translate-x-1 transition-transform relative z-10">
          <span>{isSubmitting && selectedRole === "aluno" ? "Abrindo Inscrição..." : "Ir para Landing Page de Aluno"}</span>
          <span>→</span>
        </div>
      </a>

      <!-- CARD 2: QUERO SER PROMOTOR (LANDING PAGE PROMOTOR) -->
      <a
        href={promotorUrl}
        onclick={(e) => choose("promotor", e)}
        data-testid="card-role-promotor"
        class="group relative flex flex-col justify-between p-5 rounded-2xl border border-white/15 bg-white/5 hover:bg-amber-950/35 hover:border-[var(--yellow)]/90 transition-all duration-300 text-left active:scale-[0.99] cursor-pointer shadow-lg overflow-hidden no-underline"
      >
        <!-- Glow Dinâmico de Fundo -->
        <div class="absolute -right-8 -top-8 size-28 rounded-full bg-[var(--yellow)]/10 blur-2xl group-hover:bg-[var(--yellow)]/25 transition-all duration-300 pointer-events-none"></div>

        <div class="flex flex-col gap-4 relative z-10">
          <div class="flex items-start justify-between">
            <!-- SVG ANIMADO: FOGUETE DECOLANDO, CHAMA E MOEDAS -->
            <div class="size-14 rounded-2xl bg-[var(--yellow)]/15 border border-[var(--yellow)]/30 flex items-center justify-center p-2 text-[var(--yellow)] group-hover:border-[var(--yellow)]/60 transition-colors shadow-inner">
              <svg
                class="size-10 text-[var(--yellow)] group-hover:scale-105 transition-transform duration-300"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <!-- Fundo Suave / Aura -->
                <circle cx="32" cy="32" r="26" class="fill-amber-500/10 animate-pulse" />

                <g class="promotor-rocket-hover">
                  <!-- Chama 1 (Laranja/Âmbar) -->
                  <path
                    d="M22 43C19 47 20 52 23 55C24.2 49.5 26.5 47 28.5 46"
                    class="promotor-flame-primary fill-amber-500 stroke-amber-400"
                    stroke-width="1.5"
                  />
                  <!-- Chama 2 (Amarelo Ouro) -->
                  <path
                    d="M19 45C16.5 48.5 17 54 21 57.5C21.8 52 23.5 49 25 48"
                    class="promotor-flame-secondary fill-[var(--yellow)] stroke-[var(--yellow)]"
                    stroke-width="1.5"
                  />

                  <!-- Aleta Esquerda -->
                  <path
                    d="M23 35L15 41C14 45 16 50 19 50L26 44"
                    class="fill-amber-950 stroke-amber-400"
                    stroke-width="2"
                    stroke-linejoin="round"
                  />

                  <!-- Aleta Direita -->
                  <path
                    d="M34 24L40 16C44 15 49 17 49 20L43 27"
                    class="fill-amber-950 stroke-amber-400"
                    stroke-width="2"
                    stroke-linejoin="round"
                  />

                  <!-- Fuselagem do Foguete -->
                  <path
                    d="M48 16C37 18 27 28 24 38L33 47C43 44 53 34 55 23C55 19 52 16 48 16Z"
                    class="fill-amber-950 stroke-[var(--yellow)]"
                    stroke-width="2.5"
                    stroke-linejoin="round"
                  />

                  <!-- Escotilha / Janela Circular de Lucros -->
                  <circle cx="37" cy="30" r="5.5" class="fill-amber-500/20 stroke-amber-300" stroke-width="2" />
                  <circle cx="37" cy="30" r="2.2" class="fill-[var(--yellow)] animate-ping" />
                </g>

                <!-- Partículas de Moedas / Rastreio -->
                <g class="promotor-sparkle-1">
                  <path d="M14 18L15 20.5L17.5 21.5L15 22.5L14 25L13 22.5L10.5 21.5L13 20.5L14 18Z" class="fill-amber-300" />
                </g>
                <g class="promotor-sparkle-2">
                  <path d="M48 48L49 50L51 51L49 52L48 54L47 52L45 51L47 50L48 48Z" class="fill-[var(--yellow)]" />
                </g>
              </svg>
            </div>

            <span class="px-2.5 py-0.5 rounded-full bg-[var(--yellow)]/15 border border-[var(--yellow)]/30 text-[10px] font-extrabold uppercase tracking-wide text-[var(--yellow)]">
              Renda Extra
            </span>
          </div>

          <div>
            <h4 class="text-base font-black text-white font-display tracking-tight group-hover:text-[var(--yellow)] transition">
              Quero ser Promotor
            </h4>
            <p class="text-xs text-white/70 leading-relaxed mt-1">
              Indique pessoas que precisam do diploma, ganhe comissões automáticas no PIX e tenha seu próprio painel.
            </p>
          </div>
        </div>

        <div class="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[var(--yellow)] group-hover:translate-x-1 transition-transform relative z-10">
          <span>{isSubmitting && selectedRole === "promotor" ? "Conectando..." : "Ir para Landing Page de Promotor"}</span>
          <span>→</span>
        </div>
      </a>

    </div>

    <p class="text-[11px] text-white/50 text-center leading-relaxed">
      Acesso seguro e criptografado · Sistema integrado à legislação educacional (LDB nº 9.394/96).
    </p>
  </div>
</Modal>

<style>
  @keyframes tassel-swing {
    0%, 100% {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(14deg);
    }
  }

  @keyframes rocket-bob {
    0%, 100% {
      transform: translate(0, 0);
    }
    50% {
      transform: translate(2px, -3px);
    }
  }

  @keyframes flame-pulse {
    0%, 100% {
      transform: scale(0.92);
      opacity: 0.85;
    }
    50% {
      transform: scale(1.18);
      opacity: 1;
    }
  }

  @keyframes star-pulse {
    0%, 100% {
      opacity: 0.35;
      transform: scale(0.85);
    }
    50% {
      opacity: 1;
      transform: scale(1.15);
    }
  }

  :global(.aluno-tassel-pendulum) {
    transform-origin: 32px 24px;
    animation: tassel-swing 2.8s ease-in-out infinite;
  }

  :global(.promotor-rocket-hover) {
    animation: rocket-bob 2.2s ease-in-out infinite;
  }

  :global(.promotor-flame-primary) {
    transform-origin: 22px 43px;
    animation: flame-pulse 0.5s ease-in-out infinite alternate;
  }

  :global(.promotor-flame-secondary) {
    transform-origin: 19px 45px;
    animation: flame-pulse 0.35s ease-in-out infinite alternate 0.15s;
  }

  :global(.aluno-sparkle-1),
  :global(.promotor-sparkle-1) {
    animation: star-pulse 2.2s ease-in-out infinite;
  }

  :global(.aluno-sparkle-2),
  :global(.promotor-sparkle-2) {
    animation: star-pulse 2.2s ease-in-out infinite 1.1s;
  }
</style>
