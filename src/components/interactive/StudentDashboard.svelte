<script lang="ts">
  import { onMount } from "svelte";
  import { whoami, getStudentMe } from "@/lib/api";
  import { getAccessToken, clearSession } from "@/lib/session";

  let loading = $state(true);
  let studentName = $state<string>("Aluno");
  let studentRoles = $state<string[]>([]);
  let studentStatus = $state<string>("Ativo");
  let partnerUrl = $state<string | null>(null);

  onMount(() => {
    const token = getAccessToken();
    if (!token) {
      window.location.replace("/autenticacao/login");
      return;
    }

    Promise.allSettled([whoami(), getStudentMe()])
      .then(([whoResult, studentResult]) => {
        if (whoResult.status === "fulfilled") {
          studentName = whoResult.value.name || "Aluno";
          studentRoles = whoResult.value.roles || [];
        }
        if (studentResult.status === "fulfilled" && studentResult.value) {
          const s = studentResult.value;
          studentStatus = s.status || "Ativo";
          if (s.platform && s.platform.url) {
            partnerUrl = s.platform.url;
          }
        }
      })
      .finally(() => {
        loading = false;
      });
  });

  function handleLogout() {
    clearSession();
    window.location.href = "/autenticacao/login";
  }

  let firstName = $derived(studentName.split(" ")[0]);
</script>

<div class="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6 text-white">
  <!-- Header do Painel -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-white/15">
    <div>
      <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-xs font-semibold text-emerald-300 mb-2">
        <span class="size-2 rounded-full bg-emerald-400"></span>
        Matrícula Oficial Ativa
      </div>
      <h1 class="text-2xl sm:text-3xl font-display tracking-tight text-white">
        Olá, {firstName}!
      </h1>
      <p class="text-xs sm:text-sm text-white/70 font-sans mt-1">
        Acompanhe sua documentação, agendamento de provas e acesso às aulas.
      </p>
    </div>

    <div class="flex items-center gap-3">
      {#if partnerUrl}
        <a
          href={partnerUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="btn text-sm py-2.5 px-5"
        >
          Acessar Sala de Aula ↗
        </a>
      {/if}
      <button
        type="button"
        onclick={handleLogout}
        class="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white/80 transition cursor-pointer"
      >
        Sair
      </button>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center p-12">
      <div class="size-8 rounded-full border-2 border-yellow/30 border-t-yellow animate-spin"></div>
    </div>
  {:else}
    <!-- Grid das Jornadas do Aluno -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      <!-- Card 1: Matrícula & Documentos -->
      <a
        href="/matricula"
        class="block p-6 rounded-2xl glass-panel border border-white/15 hover:border-emerald-400/50 transition group"
      >
        <div class="size-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
          📄
        </div>
        <h3 class="text-base font-bold text-white font-sans">
          Matrícula & Documentos
        </h3>
        <p class="text-xs text-white/60 mt-2 leading-relaxed">
          Envio do RG, comprovante de residência e validação biométrica com inteligência artificial.
        </p>
        <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 mt-4">
          Conferir documentos →
        </span>
      </a>

      <!-- Card 2: Prontuário Acadêmico -->
      <a
        href="/aluno"
        class="block p-6 rounded-2xl glass-panel border border-white/15 hover:border-blue-400/50 transition group"
      >
        <div class="size-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
          🎓
        </div>
        <h3 class="text-base font-bold text-white font-sans">
          Prontuário Acadêmico
        </h3>
        <p class="text-xs text-white/60 mt-2 leading-relaxed">
          Histórico escolar, dados de cadastro, tipo sanguíneo e status de emissão da certidão.
        </p>
        <span class="inline-flex items-center gap-1 text-xs font-bold text-blue-400 mt-4">
          Ver prontuário →
        </span>
      </a>

      <!-- Card 3: Provas & Avaliações -->
      <a
        href="/provas"
        class="block p-6 rounded-2xl glass-panel border border-white/15 hover:border-amber-400/50 transition group"
      >
        <div class="size-12 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
          ✍️
        </div>
        <h3 class="text-base font-bold text-white font-sans">
          Agendamento de Provas
        </h3>
        <p class="text-xs text-white/60 mt-2 leading-relaxed">
          Datas de exames presenciais no polo credenciado, notas e aprovação para o diploma.
        </p>
        <span class="inline-flex items-center gap-1 text-xs font-bold text-amber-300 mt-4">
          Agendar exames →
        </span>
      </a>
    </div>

    <!-- Banner Informativo de Parceria Credenciada (Regra de Negócio AGENTS.md) -->
    <div class="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4 text-xs text-white/70">
      <span class="text-2xl">🏛️</span>
      <div class="space-y-1">
        <p class="font-bold text-white">Educação com Validade Nacional (LDB 9.394/96)</p>
        <p>
          O Supletivo Brasil é o motor oficial de captação e conferência de matrícula. As aulas, tutores e certificação são integralmente ministrados pela instituição educacional credenciada no Conselho Estadual de Educação (CEE).
        </p>
      </div>
    </div>
  {/if}
</div>
