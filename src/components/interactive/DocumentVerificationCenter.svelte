<script lang="ts">
  import { onMount } from "svelte";
  import {
    fetchContact,
    getCurrentPayment,
    getEnrollmentRg,
    getEnrollmentStatus,
    getErrorMessage,
    whoami,
    type EnrollmentChecklistItem,
    type EnrollmentStatusResponse,
    type RgSection,
    type StudentCurrentPayment,
    type WhoAmI,
  } from "@/lib/api";
  import { resolveSupportHref, type InstitutionalContact } from "@/lib/config";
  import { getLogin, saveLogin } from "@/lib/session";
  import { dateTimeLabel, enrollmentPath, STUDENT_STATUS_LABELS } from "@/components/interactive/student/workflow";
  import { Alert, Badge, Card } from "@/components/ui";

  let loading = $state(true);
  let error = $state("");

  let me = $state<WhoAmI | null>(null);
  let statusInfo = $state<EnrollmentStatusResponse | null>(null);
  let rg = $state<RgSection | null>(null);
  let payment = $state<StudentCurrentPayment | null>(null);
  let contact = $state<InstitutionalContact | null>(null);

  const supportHref = $derived(resolveSupportHref(contact));

  const checklistSteps = $derived.by(() => {
    const ch = statusInfo?.checklist;
    const rows: Array<{
      key: string;
      title: string;
      href: string;
      item: EnrollmentChecklistItem | undefined;
    }> = [
      { key: "rg", title: "1. RG ou CIN (frente e verso)", href: "/student/enrollment/rg", item: ch?.rg },
      {
        key: "proof_of_residence",
        title: "2. Comprovante de residência",
        href: "/student/enrollment/address",
        item: ch?.proof_of_residence,
      },
      {
        key: "education_level",
        title: "3. Escolaridade anterior",
        href: "/student/enrollment/education",
        item: ch?.education_level,
      },
      {
        key: "contract_signature",
        title: "4. Assinatura do contrato",
        href: "/student/enrollment/selfie",
        item: ch?.contract_signature,
      },
      {
        key: "selfie",
        title: "5. Selfie de verificação",
        href: "/student/enrollment/selfie",
        item: ch?.selfie,
      },
    ];
    return rows;
  });

  const nextActionHref = $derived(
    enrollmentPath(statusInfo?.substatus ?? statusInfo?.step) ?? "/student/enrollment/rg"
  );

  function statusBadge(item: EnrollmentChecklistItem | undefined): {
    label: string;
    variant: "success" | "warning" | "error" | "info" | "default";
  } {
    if (!item || !item.submitted) return { label: "Pendente", variant: "warning" };
    if (item.status === "approved") return { label: "Aprovado", variant: "success" };
    if (item.status === "rejected") return { label: "Reprovado", variant: "error" };
    if (item.status === "review" || item.needs_manual_review) {
      return { label: "Em revisão", variant: "info" };
    }
    return { label: "Recebido", variant: "info" };
  }

  onMount(async () => {
    try {
      const [userRes, statusRes, rgRes, payRes, contactRes] = await Promise.all([
        whoami().catch(() => null),
        getEnrollmentStatus(),
        getEnrollmentRg().catch(() => null),
        getCurrentPayment().catch(() => null),
        fetchContact().catch(() => null),
      ]);

      me = userRes;
      statusInfo = statusRes;
      rg = rgRes;
      payment = payRes;
      contact = contactRes;

      if (userRes) {
        saveLogin({
          ...getLogin(),
          ...userRes,
          status: statusRes.current_status || userRes.status,
          substatus: statusRes.substatus ?? userRes.substatus ?? null,
        });
      }
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  });
</script>

<section class="mx-auto max-w-3xl px-4 pb-28 pt-6 space-y-5">
  <header class="space-y-2">
    <div class="flex flex-wrap items-center gap-2">
      <Badge variant="info">
        {STUDENT_STATUS_LABELS[statusInfo?.substatus ?? statusInfo?.current_status ?? "pre_enrolled"] ?? "Matrícula em andamento"}
      </Badge>
      {#if me?.name}
        <span class="text-xs font-semibold text-slate-600">{me.name}</span>
      {/if}
    </div>
    <h1 class="text-2xl font-extrabold tracking-tight text-[#0b1220]">
      Central de documentos da matrícula
    </h1>
    <p class="text-sm text-slate-600">
      {statusInfo?.message || "Envie os 5 itens abaixo para liberarmos seu acesso ao portal acadêmico."}
    </p>
  </header>

  {#if loading}
    <Card class="p-6"><p class="text-sm text-slate-500">Carregando seu checklist de matrícula...</p></Card>
  {:else}
    {#if error}
      <Alert variant="error" title="Erro ao carregar checklist">{error}</Alert>
    {/if}

    {#if statusInfo?.substatus === "pending_siga" || statusInfo?.all_basic_docs_ready}
      <Alert variant="success" title="Documentação inicial concluída">
        Seus documentos básicos já foram recebidos! A secretaria está preparando suas credenciais de acesso ao SIGA.
      </Alert>
    {:else}
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ffc400]/50 bg-[#ffc400]/15 p-4">
        <div>
          <p class="text-sm font-bold text-[#0b1220]">Próxima etapa pendente</p>
          <p class="text-xs text-slate-700">Continue de onde você parou sem perder seus envios anteriores.</p>
        </div>
        <a
          href={nextActionHref}
          class="min-h-11 inline-flex items-center rounded-xl bg-[#0b1220] px-4 text-sm font-bold text-white hover:opacity-95"
        >
          Continuar envio
        </a>
      </div>
    {/if}

    <div class="space-y-3">
      {#each checklistSteps as step}
        {@const badge = statusBadge(step.item)}
        <Card class="p-4 sm:p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-sm font-bold text-[#0b1220]">{step.title}</h2>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              {#if step.item?.rejection_reason}
                <p class="text-xs font-medium text-red-700">
                  Motivo da revisão: {step.item.rejection_reason}
                </p>
              {/if}
              {#if step.key === "rg" && rg?.front_photo && !rg?.back_photo && !rg?.full_photo}
                <p class="text-xs text-amber-700">Frente enviada; falta o verso do RG.</p>
              {/if}
            </div>

            <a
              href={step.href}
              class="min-h-10 inline-flex items-center rounded-xl border border-black/15 px-3.5 text-xs font-bold text-[#0b1220] hover:bg-black/5"
            >
              {step.item?.status === "approved"
                ? "Ver etapa"
                : step.item?.submitted
                ? "Atualizar"
                : "Enviar agora"}
            </a>
          </div>
        </Card>
      {/each}
    </div>

    {#if payment}
      <Card class="p-4 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <span>
          Taxa de matrícula: <strong class="text-[#0b1220]">{payment.amount}</strong>
          ({payment.status === "paid" ? "Confirmada" : payment.status})
          {#if payment.paid_at} — paga em {dateTimeLabel(payment.paid_at)}{/if}
        </span>
        {#if payment.receipt_url}
          <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" class="font-bold text-[#002776] underline">
            Abrir recibo InfinitePay
          </a>
        {/if}
      </Card>
    {/if}

    <div class="text-center text-xs text-slate-500">
      Dúvidas sobre seus documentos?
      <a href={supportHref} class="font-semibold text-[#002776] underline">Falar com atendimento</a>
    </div>
  {/if}
</section>
