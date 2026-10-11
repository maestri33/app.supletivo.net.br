<script lang="ts">
  import { onMount } from "svelte";
  import { getEnrollmentMe, getErrorMessage, whoami, type EnrollmentMe } from "@/lib/api";
  import { expectedStatus, followEnrollmentStatus } from "./student/workflow";
  import "./student/workflow.css";

  let enrollment = $state<EnrollmentMe | null>(null);
  let loading = $state(true);
  let error = $state("");

  async function refresh() {
    loading = true; error = "";
    try {
      const identity = await whoami();
      const studentStatus = identity.role_statuses?.student;
      if (studentStatus === "veteran") { window.location.replace("/student/veteran/dashboard"); return; }
      if (studentStatus === "active") { window.location.replace("/student/active/dashboard"); return; }
      if (studentStatus === "lead") { window.location.replace("/student/lead/payment"); return; }
      enrollment = await getEnrollmentMe();
      followEnrollmentStatus(enrollment.status);
      window.dispatchEvent(new CustomEvent("supletivo:enrollment-state", { detail: { status: enrollment.status } }));
    } catch (cause) {
      error = getErrorMessage(cause);
      const status = expectedStatus(cause);
      if (status) followEnrollmentStatus(status);
    }
    finally { loading = false; }
  }

  onMount(() => { void refresh(); });
</script>

<section class="student-workflow" aria-busy={loading}>
  {#if loading}
    <h1>Consultando sua matrícula</h1>
    <p class="muted" role="status">Buscando a etapa atual no polo…</p>
  {:else if enrollment?.status === "awaiting_release"}
    <h1>Aguardando liberação do polo</h1>
    <div class="panel">
      <p>O polo está conferindo sua matrícula. O acesso ao ambiente da instituição parceira será disponibilizado após a liberação.</p>
      <p class="muted">Você pode voltar a esta página para acompanhar a atualização.</p>
      <button type="button" class="btn" onclick={refresh}>Atualizar matrícula</button>
    </div>
  {:else}
    <h1>Documentação da matrícula</h1>
    <p class="muted">{enrollment ? "Consultando a próxima etapa da sua matrícula." : "A etapa atual será exibida após a consulta ao polo."}</p>
    <button type="button" class="secondary" onclick={refresh}>Consultar novamente</button>
  {/if}
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</section>
