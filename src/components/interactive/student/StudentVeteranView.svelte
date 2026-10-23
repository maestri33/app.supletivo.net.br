<script lang="ts">
  import { onMount } from "svelte";
  import { getVeteranMe, getErrorMessage, type VeteranMe } from "@/lib/api";
  import { openPrivateMedia } from "@/lib/private-media";
  import { safeMediaUrl, safePartnerUrl, dateLabel } from "./workflow";
  import "./workflow.css";
  let { view = "dashboard" }: { view?: "dashboard" | "diploma" | "records" | "assessments" } = $props();
  type Exam = { external_id: string; subject: string; scheduled_at: string; result: string; notes?: string | null; attempt_number: number };
  let me = $state<(VeteranMe & { exams?: Exam[] }) | null>(null), loading = $state(true), error = $state("");
  const diplomaUrl = $derived(safeMediaUrl(me?.diploma?.diploma_file));
  const transcriptUrl = $derived(safeMediaUrl(me?.diploma?.transcript_file));
  const partnerUrl = $derived(safePartnerUrl(me?.platform?.url));
  let actionError = $state("");
  async function openFile(path: string | null | undefined) { if (!path) return; actionError = ""; try { await openPrivateMedia(path); } catch (cause) { actionError = cause instanceof Error ? cause.message : getErrorMessage(cause); } }
  async function load() { loading = true; error = ""; try { me = await getVeteranMe(); } catch (cause) { error = getErrorMessage(cause); } finally { loading = false; } }
  onMount(() => { void load(); });
</script>
<section class="student-workflow" aria-busy={loading}>
  {#if loading}<h1>Consultando sua conclusão</h1><p role="status">Buscando os registros do servidor…</p>
  {:else if error}<h1>Não foi possível consultar seus registros</h1><p class="error" role="alert">{error}</p><button class="secondary" onclick={load}>Tentar novamente</button>
  {:else if me}
    {#if actionError}<p class="error" role="alert">{actionError}</p>{/if}
    {#if view === "dashboard"}<h1>Registros da conclusão</h1><div class="panel"><p>Status: {me.status ?? "não informado"}</p><p>Emissão: {dateLabel(me.diploma?.issued_at)}</p><p>Retirada: {me.diploma?.picked_up_at ? dateLabel(me.diploma.picked_up_at) : "Ainda não registrada"}</p>{#if partnerUrl}<a class="btn" href={partnerUrl} target="_blank" rel="noopener noreferrer">Abrir ambiente do parceiro</a>{/if}</div>
    {:else if view === "diploma"}<h1>Diploma</h1><div class="panel">{#if diplomaUrl}<button class="btn" onclick={() => openFile(me?.diploma?.diploma_file)}>Abrir diploma</button>{:else}<p class="muted">O diploma ainda não foi disponibilizado pelo polo.</p>{/if}{#if transcriptUrl}<button class="secondary" onclick={() => openFile(me?.diploma?.transcript_file)}>Abrir histórico escolar</button>{/if}</div>
    {:else if view === "assessments"}<h1>Suas provas</h1><div class="panel">{#each me.exams ?? [] as exam (exam.external_id)}<div class="stack"><h2>{exam.subject}</h2><p>{dateLabel(exam.scheduled_at)} — tentativa {exam.attempt_number}</p><p>Resultado: {exam.result === "passed" ? "Aprovado" : exam.result === "failed" ? "Reprovado" : "Aguardando resultado"}</p>{#if exam.notes}<p>{exam.notes}</p>{/if}</div>{/each}{#if !me.exams?.length}<p class="muted">Nenhuma prova registrada nesta consulta.</p>{/if}</div>
    {:else}<h1>Histórico escolar</h1><div class="panel">{#if transcriptUrl}<button class="btn" onclick={() => openFile(me?.diploma?.transcript_file)}>Abrir histórico escolar</button>{:else}<p class="muted">O histórico escolar ainda não foi disponibilizado pelo polo.</p>{/if}</div>{/if}
  {/if}
</section>
