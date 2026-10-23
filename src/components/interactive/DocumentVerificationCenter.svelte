<script lang="ts">
  import { onMount } from "svelte";
  import { getEnrollmentMe, getLeadMe, getErrorMessage, whoami, type EnrollmentMe, type CheckoutOut } from "@/lib/api";
  import { openPrivateMedia } from "@/lib/private-media";
  import { safePartnerUrl } from "./student/workflow";
  import { expectedStatus, followEnrollmentStatus } from "./student/workflow";
  import "./student/workflow.css";

  let enrollment = $state<EnrollmentMe | null>(null);
  let loading = $state(true);
  let error = $state("");
  let refreshing = $state(false), updated = $state(false), opening = $state<string | null>(null);
  let checkout = $state<CheckoutOut | null>(null), paymentError = $state("");
  let active = true;
  const release = $derived(enrollment?.release);
  const labels: Record<string, string> = { approved: "Aprovado", pending: "Em análise", review: "Conferência do polo", rejected: "Precisa de novo envio", needs_kinship: "Vínculo com titular pendente" };
  const documents = $derived(enrollment ? [
    { name: "RG", status: enrollment.rg?.analysis_status ?? enrollment.rg?.validation_status, paths: [enrollment.rg?.full_photo || enrollment.rg?.front_photo, enrollment.rg?.back_photo].filter(Boolean) as string[] },
    { name: "Comprovante de endereço", status: enrollment.address_proof?.status, paths: [enrollment.address_proof?.photo].filter(Boolean) as string[] },
    { name: "Selfie e assinatura", status: enrollment.selfie?.analysis_status ?? enrollment.selfie_status, paths: [enrollment.selfie?.photo].filter(Boolean) as string[] },
  ] : []);
  async function openDocument(path: string) {
    opening = path; error = "";
    try { await openPrivateMedia(path); } catch (cause) { error = getErrorMessage(cause); }
    finally { opening = null; }
  }

  async function refresh() {
    if (refreshing) return;
    refreshing = true; error = "";
    try {
      const identity = await whoami();
      const studentStatus = identity.role_statuses?.student;
      if (studentStatus === "veteran") { window.location.replace("/student/veteran/dashboard"); return; }
      if (studentStatus === "active") { window.location.replace("/student/active/dashboard"); return; }
      if (studentStatus === "lead") { window.location.replace("/student/lead/payment"); return; }
      enrollment = await getEnrollmentMe();
      if (!active) return;
      followEnrollmentStatus(enrollment.status);
      window.dispatchEvent(new CustomEvent("supletivo:enrollment-state", { detail: { status: enrollment.status } }));
      updated = true;
    } catch (cause) {
      error = getErrorMessage(cause);
      const status = expectedStatus(cause);
      if (status) followEnrollmentStatus(status);
    }
    finally { if (active) { loading = false; refreshing = false; } }
  }

  onMount(() => {
    void refresh();
    void getLeadMe().then(data => { if (active) checkout = data.checkout ?? null; }).catch(() => { if (active) paymentError = "Não foi possível consultar os dados do pagamento agora."; });
    const onFocus = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { active = false; window.removeEventListener("focus", onFocus); };
  });
</script>

<section class="student-workflow release-view" aria-busy={loading || refreshing}>
  {#if loading}
    <h1>Consultando sua matrícula</h1>
    <p class="muted" role="status">Buscando a etapa atual no polo…</p>
  {:else if enrollment && ["awaiting_release", "fee_paid", "fee_scheduled"].includes(enrollment.status)}
    <header id="tracking">
      <div class="release-art" aria-hidden="true">
        <svg viewBox="0 0 200 132" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="100" cy="66" r="55" class="orbit" />
          <g class="document"><path d="M63 25h48l19 19v62H63z"/><path d="M111 25v20h19M77 56h37M77 67h25M77 78h19"/></g>
          <g class="seal"><circle cx="124" cy="91" r="18"/><path d="m115 91 6 6 12-13"/></g>
          <g class="key"><circle cx="151" cy="49" r="10"/><path d="m144 56-22 22m6-6 5 5m-10 0 5 5"/></g>
          <path class="spark" d="M40 48v8m-4-4h8M157 95v8m-4-4h8"/>
        </svg>
      </div>
      <p class="eyebrow">PREPARANDO ACESSO</p>
      <h1>Teu próximo passo é começar a estudar</h1>
      <p class="muted">Recebemos teu cadastro. Agora o polo prepara a matrícula na instituição parceira e disponibiliza teu acesso aos estudos.</p>
    </header>
    <section class="panel next-step" aria-labelledby="next-title">
      <p class="eyebrow">PRÓXIMA ETAPA</p>
      <h2 id="next-title">{release?.stage === "document_review" ? "Conferência da documentação" : release?.stage === "access_preparation" ? "Preparação do teu acesso" : "Matrícula na instituição parceira"}</h2>
      <p>{release?.next_action ?? "O coordenador do polo precisa concluir tua matrícula na instituição parceira e registrar os dados de acesso."}</p>
      {#if release?.action_required && release.action_route && /^\/student\/enrollment\/(rg|address|education|selfie)$/.test(release.action_route)}<a class="btn" href={release.action_route}>Resolver pendência</a>{/if}
      <button type="button" class="secondary" onclick={refresh} disabled={refreshing}>{refreshing ? "Verificando…" : "Verificar atualização"}</button>
      {#if updated}<p class="muted update-note" role="status">{refreshing ? "Consultando a situação atual…" : "Situação consultada nesta visita."}</p>{/if}
      <p class="muted">Quando a liberação for concluída, esta página abrirá teu painel de aluno. O acesso também será enviado pelos canais cadastrados.</p>
    </section>
    <section id="documents" class="panel" aria-labelledby="documents-title">
      <h2 id="documents-title">Meus documentos</h2>
      <ul class="documents">{#each documents as item}<li><div><strong>{item.name}</strong><p class:approved={item.status === "approved"}>{labels[item.status ?? ""] ?? "Situação ainda não informada"}</p></div>
        {#each item.paths as path, index}<button class="secondary" type="button" disabled={opening !== null} onclick={() => openDocument(path)} aria-label={`Abrir ${item.name}${item.paths.length > 1 ? ` — ${index === 0 ? "frente" : "verso"}` : ""}`}>{opening === path ? "Abrindo…" : item.paths.length > 1 ? index === 0 ? "Frente" : "Verso" : "Abrir"}</button>{/each}
      </li>{/each}</ul>
      <p class="muted">Escolaridade: {enrollment.education ? "informações recebidas" : "informações ainda não disponíveis"}.</p>
    </section>
    <section id="payment" class="panel" aria-labelledby="payment-title">
      <h2 id="payment-title">Pagamento da matrícula</h2>
      {#if checkout}<p>{checkout.is_paid ? "Pagamento confirmado" : "Confirmação ainda não disponível"}{checkout.amount ? ` · ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(checkout.amount))}` : ""}</p>
        <p class="muted">Forma de pagamento: {checkout.payment_method === "PIX" || checkout.payment_method === "pix" ? "Pix" : "Cartão"}.</p>
        {#if checkout.is_paid && safePartnerUrl(checkout.receipt_url)}<a class="secondary" href={safePartnerUrl(checkout.receipt_url)!} target="_blank" rel="noopener noreferrer">Ver comprovante</a>{/if}
      {:else}<p class="muted">{paymentError || (release?.payment_confirmed ? "Pagamento confirmado. Consultando os detalhes do recebimento." : "Os dados do pagamento aparecerão após a consulta.")}</p>{/if}
    </section>
    <section id="contact" class="panel" aria-labelledby="contact-title">
      <h2 id="contact-title">Falar com o polo</h2>
      <p>{release?.hub_name ?? "Polo responsável"}</p>
      {#if release?.coordinator_name}<p class="muted">Responsável: {release.coordinator_name}</p>{/if}
      {#if release?.contact_url && /^https:\/\/wa\.me\/\d+(\?.*)?$/.test(release.contact_url)}<a class="btn" href={release.contact_url} target="_blank" rel="noopener noreferrer">Conversar com o polo</a>
      {:else}<p class="muted">O contato oficial do polo ainda não foi disponibilizado. As atualizações da matrícula serão enviadas pelos canais cadastrados.</p>{/if}
    </section>
  {:else}
    <h1>Documentação da matrícula</h1>
    <p class="muted">{enrollment ? "Consultando a próxima etapa da sua matrícula." : "A etapa atual será exibida após a consulta ao polo."}</p>
    <button type="button" class="secondary" onclick={refresh}>Consultar novamente</button>
  {/if}
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</section>

<style>
  .release-view header { display: grid; gap: 1rem; }
  .release-art { width: 200px; margin-inline: auto; color: var(--paper); }
  .release-art svg { width: 100%; height: auto; }
  .orbit { stroke: var(--glass-border-dark); stroke-dasharray: 3 8; }
  .seal { color: var(--green); fill: var(--ink-soft); animation: seal-in 6s ease-in-out infinite; transform-origin: 124px 91px; }
  .key { color: var(--yellow); animation: key-float 6s ease-in-out infinite; }
  .spark { color: var(--muted-on-dark); }
  .eyebrow { color: var(--yellow); font-size: .8rem; font-weight: 700; letter-spacing: .12em; }
  .next-step { border-color: var(--yellow); }
  .documents { list-style: none; padding: 0; display: grid; gap: 1rem; }
  .documents li { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; padding-block: .5rem; border-bottom: 1px solid var(--glass-border-dark); }
  .documents li > div { flex: 1; min-width: 10rem; }
  .documents p { color: var(--muted-on-dark); font-size: .9rem; }
  .documents .approved { color: var(--yellow-soft); }
  .update-note { font-size: .85rem; }
  #tracking, #documents, #payment, #contact { scroll-margin-top: 6rem; }
  @keyframes seal-in { 0%, 100% { transform: scale(.94); } 30%, 70% { transform: scale(1); } }
  @keyframes key-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  @media (prefers-reduced-motion: reduce), (hover: none) { .seal, .key { animation: none; } }
</style>
