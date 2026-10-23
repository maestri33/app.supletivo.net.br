<script lang="ts">
  import { onMount } from "svelte";
  import { requestAuth, getErrorMessage } from "@/lib/api";
  import { openPrivateMedia } from "@/lib/private-media";

  interface Archive { documents: { kind: string; name: string; path: string; status?: string | null }[]; contract_version?: string | null; accepted_at?: string | null }
  let archive = $state<Archive | null>(null);
  let loading = $state(true);
  let opening = $state<string | null>(null);
  let error = $state("");
  async function load() {
    loading = true; error = "";
    try { archive = await requestAuth<Archive>("/api/v1/collaborators/promoter/documents"); }
    catch (cause) { error = getErrorMessage(cause); }
    finally { loading = false; }
  }
  async function open(path: string) {
    opening = path; error = "";
    try { await openPrivateMedia(path); }
    catch (cause) { error = cause instanceof Error ? cause.message : getErrorMessage(cause); }
    finally { opening = null; }
  }
  const labels: Record<string, string> = { approved: "Aprovado", pending: "Em análise", review: "Em revisão", rejected: "Precisa de novo envio", needs_kinship: "Vínculo com titular pendente" };
  onMount(() => { void load(); });
</script>

<section class="document-archive">
  <header><h1>Meus documentos</h1><p>Consulte os documentos enviados no seu credenciamento e o registro da assinatura.</p></header>
  {#if error}<div class="feedback" role="alert"><p>{error}</p><button type="button" class="btn" onclick={load}>Atualizar documentos</button></div>{/if}
  {#if loading}<p role="status">Consultando seus documentos…</p>
  {:else if archive}
    {#if archive.documents.length}
      <ul>{#each archive.documents as item (item.kind)}<li><div><h2>{item.name}</h2><p>{labels[item.status ?? ""] ?? "Enviado"}</p></div><button class="btn" type="button" disabled={opening !== null} onclick={() => open(item.path)}>{opening === item.path ? "Carregando…" : `Abrir ${item.name}`}</button></li>{/each}</ul>
    {:else}<p>Seu cadastro ainda não tem arquivos enviados.</p>{/if}
    {#if archive.accepted_at}<section class="signature"><h2>Assinatura registrada</h2><p>Termo {archive.contract_version ?? "registrado"} · {new Date(archive.accepted_at).toLocaleString("pt-BR")}</p><p>A selfie e o aceite do termo foram registrados durante o cadastro.</p></section>{/if}
  {/if}
</section>

<style>
  .document-archive { width: min(100%, var(--container-narrow)); margin-inline: auto; display: grid; gap: 1.5rem; color: var(--paper); font-family: var(--font-sans); }
  h1, h2 { font-family: var(--font-display); } h1 { font-size: var(--text-h2-sm); } h2 { font-size: var(--text-h3); }
  p { line-height: 1.6; } ul { list-style: none; padding: 0; display: grid; gap: 1rem; }
  li, .signature { padding: 1.25rem; background: var(--ink-soft); border: 1px solid var(--glass-border-dark); border-radius: var(--radius); }
  li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; }
  .btn { min-height: var(--input-height); padding: .75rem 1.25rem; } .feedback { background: var(--danger-bg); color: var(--danger); padding: 1rem; border-radius: var(--input-radius); }
  button:disabled { opacity: .6; cursor: wait; } :focus-visible { outline: 3px solid var(--yellow); outline-offset: 3px; }
</style>
