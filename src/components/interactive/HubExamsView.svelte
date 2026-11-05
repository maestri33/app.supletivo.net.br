<script lang="ts">
  import { onMount } from "svelte";
  import { requestAuth } from "@/lib/api";
  import Badge from "@/components/ui/Badge.svelte";
  import Alert from "@/components/ui/Alert.svelte";
  import EmptyState from "@/components/ui/EmptyState.svelte";
  import Skeleton from "@/components/ui/Skeleton.svelte";
  import Card from "@/components/ui/Card.svelte";

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
    <Badge variant="info" size="sm" class="mb-2">Secretaria de Polo</Badge>
    <h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display">Provas presenciais</h1>
    <p class="text-sm text-white/70 mt-2">Esta fila mostra somente alunos que o servidor liberou ou agendou para avaliação.</p>
  </div>

  {#if error}
    <Alert variant="danger" title="Erro na consulta" description={error} />
  {:else if loading}
    <div class="grid gap-4 sm:grid-cols-2">
      <Skeleton class="h-28 w-full rounded-2xl" />
      <Skeleton class="h-28 w-full rounded-2xl" />
    </div>
  {:else if examStudents.length === 0}
    <EmptyState
      icon="📝"
      title="Nenhuma avaliação agendada"
      description="Nenhuma avaliação liberada ou agendada no polo no momento."
    />
  {:else}
    <div class="grid gap-4 sm:grid-cols-2">
      {#each examStudents as item}
        <Card
          title={item.name || item.external_id || item.id || "Aluno"}
          description={`ID: ${item.external_id || item.id || "—"}`}
        >
          {#snippet actions()}
            <Badge variant={item.status === "exam_scheduled" ? "warning" : "success"} size="sm" pulse={item.status === "exam_scheduled"}>
              {item.status === "exam_scheduled" ? "Prova agendada" : "Prova liberada"}
            </Badge>
          {/snippet}
        </Card>
      {/each}
    </div>
  {/if}
  <button type="button" class="btn w-fit px-4 py-2 text-xs font-bold" onclick={refresh} disabled={loading}>Atualizar fila</button>
</section>
