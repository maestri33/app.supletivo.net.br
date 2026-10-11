<script lang="ts">
  import { onMount } from "svelte";
  import { requestAuth } from "@/lib/api";

  interface Student { id?: string; external_id?: string; name?: string; status?: string; }
  interface Payload { items?: Student[]; }

  let students = $state<Student[]>([]);
  let loading = $state(true);
  let error = $state("");

  async function refresh() {
    loading = true; error = "";
    try {
      const data = await requestAuth<Payload | Student[]>("/api/v1/leadership/students");
      students = Array.isArray(data) ? data : (data.items ?? []);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Não foi possível consultar os alunos do polo.";
    } finally { loading = false; }
  }

  onMount(() => { void refresh(); });

  const examStudents = $derived(students.filter((item) => item.status === "exam_released" || item.status === "exam_scheduled"));
</script>

<section class="w-full max-w-4xl mx-auto flex-1 flex flex-col p-4 sm:p-6 pb-28 space-y-6" aria-busy={loading}>
  <div class="border-b border-white/10 pb-4">
    <span class="text-xs font-semibold text-sky-400 uppercase tracking-wider">Secretaria de Polo</span>
    <h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display">Bancas e provas</h1>
    <p class="text-sm text-white/70 mt-2">Esta fila mostra somente alunos que o servidor liberou ou agendou para avaliação.</p>
  </div>

  {#if error}
    <div class="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-100" role="alert">{error}</div>
  {:else if loading}
    <p class="text-sm text-white/60" role="status">Consultando o servidor…</p>
  {:else if examStudents.length === 0}
    <div class="p-6 rounded-2xl border border-white/10 bg-white/5 text-white/70">Nenhuma avaliação liberada ou agendada no momento.</div>
  {:else}
    <div class="grid gap-4 sm:grid-cols-2">
      {#each examStudents as item}
        <article class="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h2 class="text-base font-bold text-white">{item.name || item.external_id || item.id || "Aluno"}</h2>
          <p class="text-xs text-sky-200">Status do servidor: {item.status === "exam_scheduled" ? "Prova agendada" : "Prova liberada"}</p>
        </article>
      {/each}
    </div>
  {/if}
  <button type="button" class="btn w-fit px-4 py-2 text-xs font-bold" onclick={refresh} disabled={loading}>Atualizar fila</button>
</section>
