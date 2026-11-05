<script lang="ts">
  import { onMount } from "svelte";
  import { getVeteranMe, getErrorMessage, type VeteranMe } from "@/lib/api";
  import { openPrivateMedia } from "@/lib/private-media";
  import { safeMediaUrl, safePartnerUrl, dateLabel } from "./workflow";
  import Card from "@/components/ui/Card.svelte";
  import Badge from "@/components/ui/Badge.svelte";
  import Alert from "@/components/ui/Alert.svelte";
  import Skeleton from "@/components/ui/Skeleton.svelte";
  import EmptyState from "@/components/ui/EmptyState.svelte";

  let { view = "dashboard" }: { view?: "dashboard" | "diploma" | "records" | "assessments" } = $props();
  type Exam = { external_id: string; subject: string; scheduled_at: string; result: string; notes?: string | null; attempt_number: number };
  let me = $state<(VeteranMe & { exams?: Exam[] }) | null>(null), loading = $state(true), error = $state("");
  const diplomaUrl = $derived(safeMediaUrl(me?.diploma?.diploma_file));
  const transcriptUrl = $derived(safeMediaUrl(me?.diploma?.transcript_file));
  const partnerUrl = $derived(safePartnerUrl(me?.platform?.url));
  let actionError = $state("");

  async function openFile(path: string | null | undefined) {
    if (!path) return;
    actionError = "";
    try {
      await openPrivateMedia(path);
    } catch (cause) {
      actionError = cause instanceof Error ? cause.message : getErrorMessage(cause);
    }
  }

  async function load() {
    loading = true;
    error = "";
    try {
      me = await getVeteranMe();
    } catch (cause) {
      error = getErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  onMount(() => { void load(); });
</script>

<section class="w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-6 text-white" aria-busy={loading}>
  <div class="space-y-2">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-300">
      <span class="size-2 rounded-full bg-emerald-400"></span>
      Aluno Concluinte • Certificação
    </div>
    <h1 class="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
      {view === "dashboard" ? "Registros da Conclusão" : view === "diploma" ? "Diploma & Certificado" : view === "assessments" ? "Histórico de Provas" : "Histórico Escolar Oficial"}
    </h1>
    <p class="text-xs sm:text-sm text-white/70">
      Documentos acadêmicos oficiais e autenticações emitidas pela instituição credenciada.
    </p>
  </div>

  {#if loading}
    <div class="space-y-4">
      <Skeleton class="h-12 w-full rounded-2xl" />
      <Skeleton class="h-48 w-full rounded-3xl" />
    </div>
  {:else if error}
    <div class="space-y-3">
      <Alert variant="danger" title="Não foi possível consultar seus registros" description={error} />
      <button
        type="button"
        onclick={load}
        class="min-h-[48px] px-6 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition cursor-pointer"
      >
        Tentar novamente
      </button>
    </div>
  {:else if me}
    {#if actionError}
      <Alert variant="danger" title="Erro ao abrir documento" description={actionError} />
    {/if}

    {#if view === "dashboard"}
      <Card title="Situação da Conclusão" description="Registros pedagógicos autenticados">
        {#snippet actions()}
          <Badge variant="success" size="sm">✓ Concluído</Badge>
        {/snippet}

        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <dt class="text-xs text-white/60">Situação</dt>
            <dd class="text-base font-bold text-emerald-300 mt-0.5">{me.status ?? "Concluído"}</dd>
          </div>
          <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <dt class="text-xs text-white/60">Data de emissão</dt>
            <dd class="text-base font-bold text-white mt-0.5">{dateLabel(me.diploma?.issued_at)}</dd>
          </div>
          <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 sm:col-span-2">
            <dt class="text-xs text-white/60">Retirada física</dt>
            <dd class="text-sm font-semibold text-white/90 mt-0.5">
              {me.diploma?.picked_up_at ? dateLabel(me.diploma.picked_up_at) : "Disponível digitalmente / Retirada presencial sob demanda"}
            </dd>
          </div>
        </dl>

        {#snippet footer()}
          {#if partnerUrl}
            <a
              href={partnerUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="min-h-[48px] px-6 py-2.5 rounded-xl bg-[var(--yellow)] hover:bg-[var(--yellow-soft)] text-brand-ink font-bold text-xs sm:text-sm shadow-lg transition inline-flex items-center gap-2"
            >
              Abrir ambiente do parceiro →
            </a>
          {/if}
        {/snippet}
      </Card>
    {:else if view === "diploma"}
      <Card title="Diploma Registrado" description="Certificado de conclusão de curso com registro oficial">
        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          {#if diplomaUrl}
            <button
              type="button"
              onclick={() => openFile(me?.diploma?.diploma_file)}
              class="min-h-[48px] px-6 py-3 rounded-2xl bg-[var(--yellow)] hover:bg-[var(--yellow-soft)] text-brand-ink font-bold text-sm shadow-xl transition cursor-pointer"
            >
              Abrir diploma oficial (PDF) →
            </button>
          {:else}
            <p class="text-xs text-white/60">O diploma ainda não foi disponibilizado pelo polo.</p>
          {/if}

          {#if transcriptUrl}
            <button
              type="button"
              onclick={() => openFile(me?.diploma?.transcript_file)}
              class="min-h-[48px] px-6 py-3 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition cursor-pointer"
            >
              Abrir histórico escolar
            </button>
          {/if}
        </div>
      </Card>
    {:else if view === "assessments"}
      <Card title="Avaliações e Provas" description="Resultados das provas registradas no sistema acadêmico">
        <div class="space-y-3 pt-2">
          {#each me.exams ?? [] as exam (exam.external_id)}
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 class="text-sm font-bold text-white">{exam.subject}</h3>
                <p class="text-xs text-white/60 mt-0.5">{dateLabel(exam.scheduled_at)} • Tentativa {exam.attempt_number}</p>
                {#if exam.notes}
                  <p class="text-xs text-white/80 mt-1">{exam.notes}</p>
                {/if}
              </div>
              <Badge variant={exam.result === "passed" ? "success" : exam.result === "failed" ? "danger" : "warning"} size="sm">
                {exam.result === "passed" ? "✓ Aprovado" : exam.result === "failed" ? "✕ Reprovado" : "Aguardando resultado"}
              </Badge>
            </div>
          {/each}
          {#if !me.exams?.length}
            <EmptyState title="Nenhuma prova registrada" description="Nenhum registro de avaliação localizado nesta consulta." />
          {/if}
        </div>
      </Card>
    {:else}
      <Card title="Histórico Escolar" description="Registro acadêmico de notas e frequências">
        <div class="pt-2">
          {#if transcriptUrl}
            <button
              type="button"
              onclick={() => openFile(me?.diploma?.transcript_file)}
              class="min-h-[48px] px-6 py-3 rounded-2xl bg-[var(--yellow)] hover:bg-[var(--yellow-soft)] text-brand-ink font-bold text-sm shadow-xl transition cursor-pointer"
            >
              Abrir histórico escolar (PDF) →
            </button>
          {:else}
            <EmptyState title="Histórico em processamento" description="O histórico escolar ainda não foi disponibilizado pela secretaria do polo." />
          {/if}
        </div>
      </Card>
    {/if}
  {/if}
</section>
