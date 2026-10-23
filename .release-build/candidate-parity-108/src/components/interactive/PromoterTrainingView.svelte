<script lang="ts">
  import { onMount } from "svelte";
  import { getErrorMessage, mediaUrl, requestAuth, whoami } from "@/lib/api";

  interface Material {
    material_external_id: string;
    title: string;
    blocking: boolean;
    kind: string;
    assignment_status: string;
    submission_status: string;
    grade?: string | null;
    justification?: string | null;
    text_content?: string;
    content_blocks?: { type?: string; text?: string; url?: string; src?: string; alt?: string }[];
    question?: string;
    video?: string | null;
    photo?: string | null;
  }
  interface Promoter { locked: boolean; status: string; pending_materials?: { material_external_id: string }[]; }
  const base = "/api/v1/collaborators";
  let materials = $state<Material[]>([]);
  let selectedId = $state("");
  let answer = $state("");
  let promoter = $state<Promoter | null>(null);
  let loading = $state(true);
  let busy = $state(false);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);
  let pollTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  let pollDelay = 2500;
  let active = $derived(materials.find(item => item.material_external_id === selectedId) ?? materials[0] ?? null);
  let waiting = $derived(active?.submission_status === "pending");
  let approved = $derived(active?.submission_status === "approved" || active?.assignment_status === "approved");
  let rejected = $derived(active?.submission_status === "rejected");
  let unlocked = $derived(promoter?.locked === false);

  function statusLabel(item: Material) {
    if (item.assignment_status === "approved" || item.submission_status === "approved") return "Concluído";
    if (item.submission_status === "pending") return "Em correção";
    if (item.submission_status === "rejected") return "Precisa de ajuste";
    return item.blocking ? "Obrigatório" : "Disponível";
  }

  async function refresh() {
    try {
      const identity = await whoami();
      if (identity.role_statuses?.promoter === "candidate") { window.location.replace("/promoter/candidate"); return; }
      const [state, list] = await Promise.all([
        requestAuth<Promoter>(`${base}/promoter/me`),
        requestAuth<Material[]>(`${base}/training/materials`),
      ]);
      if (disposed) return;
      promoter = state;
      materials = Array.isArray(list) ? list : [];
      if (!selectedId || !materials.some(item => item.material_external_id === selectedId)) selectedId = materials[0]?.material_external_id ?? "";
      const selected = materials.find(item => item.material_external_id === selectedId);
      if (selected?.submission_status !== "rejected") answer = "";
      error = null;
      window.dispatchEvent(new CustomEvent("supletivo:promoter-state", { detail: { status: state.locked ? "training" : "active" } }));
      const needsPoll = materials.some(item => item.submission_status === "pending") || state.locked;
      clearTimeout(pollTimer);
      if (needsPoll && !disposed) pollTimer = setTimeout(() => { if (!busy && document.visibilityState === "visible") void refresh(); }, pollDelay);
    } catch (cause) { error = getErrorMessage(cause); }
    finally { loading = false; }
  }

  onMount(() => {
    void refresh();
    const onFocus = () => { if (!busy) void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { disposed = true; clearTimeout(pollTimer); window.removeEventListener("focus", onFocus); };
  });

  async function submit() {
    if (!active || !answer.trim() || busy || waiting || approved) return;
    busy = true; error = null; notice = null;
    try {
      const result = await requestAuth<{ status: string; material_external_id: string }>(`${base}/training/submissions`, {
        method: "POST", json: { material_external_id: active.material_external_id, answer: answer.trim() },
      });
      if (result.status === "pending") notice = "Resposta recebida. A correção será feita pelo backend.";
      await refresh();
    } catch (cause) { error = getErrorMessage(cause); }
    finally { busy = false; }
  }

  function contentBlock(block: Material["content_blocks"][number]) {
    return block.text || block.url || block.src || "";
  }
</script>

<div class="training-view" data-testid="promoter-training">
  <header class="glass-panel training-header">
    <p class="eyebrow">Treinamento obrigatório</p>
    <h1>Capacitação do promotor</h1>
    <p>As matérias e perguntas abaixo são carregadas da sua atribuição atual. A liberação depende da correção do backend.</p>
    {#if promoter}<p class:locked={promoter.locked} class:released={!promoter.locked} class="state-pill">{promoter.locked ? "Painel bloqueado enquanto houver matéria pendente" : "Painel liberado"}</p>{/if}
  </header>
  {#if error}<p class="feedback error" role="alert">{error}</p>{/if}
  {#if notice}<p class="feedback info" role="status">{notice}</p>{/if}
  {#if loading}<p role="status">Consultando matérias atribuídas…</p>
  {:else if materials.length === 0}
    <section class="training-card"><h2>Nenhuma matéria atribuída</h2><p>O treinamento aparecerá quando a coordenação atribuir uma matéria ao seu perfil.</p></section>
  {:else}
    <nav class="materials" aria-label="Matérias atribuídas">
      {#each materials as item}
        <button type="button" class:current={item.material_external_id === selectedId} class="material-tab" onclick={() => { selectedId = item.material_external_id; answer = item.submission_status === "rejected" ? "" : answer; }}>
          <span>{item.title}</span><small>{statusLabel(item)}</small>
        </button>
      {/each}
    </nav>
    {#if active}
      <article class="training-card">
        <div class="card-heading"><div><p class="kicker">{active.kind === "transitory" ? "Atualização" : "Matéria atribuída"}</p><h2>{active.title}</h2></div><span class="status">{statusLabel(active)}</span></div>
        {#if active.text_content}<p class="material-text">{active.text_content}</p>{/if}
        {#each active.content_blocks ?? [] as block}
          {#if block.type === "video" && (block.url || block.src)}<video controls preload="metadata" src={mediaUrl(block.url ?? block.src) ?? undefined}></video>
          {:else if block.type === "image" && (block.url || block.src)}<img loading="lazy" decoding="async" src={mediaUrl(block.url ?? block.src) ?? undefined} alt={block.alt ?? active.title} />
          {:else if contentBlock(block)}<p>{contentBlock(block)}</p>{/if}
        {/each}
        {#if active.video}<video controls preload="metadata" src={mediaUrl(active.video) ?? undefined}></video>{/if}
        {#if active.photo}<img loading="lazy" decoding="async" src={mediaUrl(active.photo) ?? undefined} alt={active.title} />{/if}
        {#if active.question}<div class="question"><strong>Verificação</strong><p>{active.question}</p>
          {#if waiting}<p class="pending-text">Resposta em correção. Aguarde o resultado real do backend.</p>
          {:else if approved}<p class="success-text">Matéria aprovada pelo backend.</p>
          {:else if rejected}<p class="rejected-text">{active.justification ?? "A resposta precisa de ajuste. Envie uma nova resposta."}</p>
            <textarea id="training-answer" bind:value={answer} rows="5" disabled={busy} placeholder="Explique com suas palavras…"></textarea>
            <button class="btn" type="button" disabled={busy || !answer.trim()} onclick={submit}>{busy ? "Enviando…" : "Enviar nova resposta"}</button>
          {:else}<textarea id="training-answer" bind:value={answer} rows="5" disabled={busy} placeholder="Escreva sua resposta…"></textarea><button class="btn" type="button" disabled={busy || !answer.trim()} onclick={submit}>{busy ? "Enviando…" : "Submeter resposta"}</button>{/if}
        </div>{/if}
      </article>
    {/if}
  {/if}
  {#if unlocked}<a class="btn continue" href="/promoter/active">Acessar painel do promotor</a>{/if}
  <button class="refresh-action" type="button" disabled={busy || loading} onclick={() => refresh()}>Atualizar progresso</button>
</div>

<style>
  .training-view { width: min(100%, var(--container-narrow)); margin-inline: auto; display: grid; gap: 1.25rem; color: var(--paper); font-family: var(--font-sans); }
  .training-header, .training-card { border-radius: var(--radius-lg); padding: clamp(1.25rem, 4vw, 2rem); }
  .training-header { background: var(--blue); }.training-card { display: grid; gap: 1rem; background: var(--ink-soft); border: 1px solid var(--glass-border-dark); }
  h1, h2 { font-family: var(--font-display); line-height: 1.08; } h1 { font-size: var(--text-h2-sm); margin-block: .5rem 1rem; } h2 { font-size: var(--text-h3); }
  p { line-height: 1.6; }.eyebrow, .kicker { color: var(--yellow); font-weight: 700; }.state-pill, .status { padding: .4rem .7rem; border-radius: var(--radius-pill); width: fit-content; font-weight: 700; font-size: .85rem; }.locked, .rejected-text { color: var(--warning); background: var(--warning-bg); }.released, .success-text { color: var(--success); background: var(--success-bg); }.pending-text { color: var(--info); background: var(--info-bg); }
  .materials { display: grid; gap: .75rem; }.material-tab { min-height: var(--input-height); border: 1px solid var(--glass-border-dark); border-radius: var(--input-radius); background: var(--ink-soft); color: var(--paper); display: flex; justify-content: space-between; gap: 1rem; padding: .75rem 1rem; cursor: pointer; text-align: left; }.material-tab.current { border-color: var(--yellow); }.material-tab small { color: var(--muted-on-dark); white-space: nowrap; }
  .card-heading { display: flex; align-items: start; justify-content: space-between; gap: 1rem; }.material-text { white-space: pre-wrap; }.question { display: grid; gap: .75rem; padding-top: 1rem; border-top: 1px solid var(--glass-border-dark); } textarea { width: 100%; min-height: 8rem; padding: 1rem; border-radius: var(--input-radius); color: var(--ink); background: var(--paper); font: inherit; }.btn, .refresh-action { min-height: var(--input-height); padding: .75rem 1.25rem; cursor: pointer; }.refresh-action { border: 1px solid var(--glass-border-dark); border-radius: var(--input-radius); background: var(--ink-soft); color: var(--paper); }.continue { text-align: center; }.feedback { padding: 1rem; border-radius: var(--input-radius); }.error { background: var(--danger-bg); color: var(--danger); }.info { background: var(--info-bg); color: var(--info); } :focus-visible { outline: 3px solid var(--yellow); outline-offset: 3px; } button:disabled { opacity: .6; cursor: wait; } video, img { width: 100%; max-height: 28rem; object-fit: contain; border-radius: var(--input-radius); background: var(--ink); }
</style>
