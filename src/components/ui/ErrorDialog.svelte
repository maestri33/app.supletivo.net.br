<script lang="ts">
  import AlertDialog from "./AlertDialog.svelte";

  interface ActionConfig {
    label: string;
    action: () => void | Promise<void>;
  }

  interface Props {
    isOpen?: boolean;
    error?: string | null;
    title?: string;
    description?: string;
    code?: string;
    primaryAction?: ActionConfig;
    secondaryAction?: ActionConfig | null;
    onClose: () => void;
    loading?: boolean;
  }

  let {
    isOpen = false,
    error = null,
    title,
    description,
    code,
    primaryAction,
    secondaryAction,
    onClose,
    loading = false,
  }: Props = $props();

  let resolvedTitle = $derived.by(() => {
    if (title) return title;
    const msg = error || description || "";
    const c = code || "";
    if (c === "OTP_EXPIRED" || msg.toLowerCase().includes("expirado")) {
      return "Código Expirado";
    }
    if (c === "OTP_INVALID" || msg.toLowerCase().includes("incorreto")) {
      return "Código Incorreto";
    }
    if (c === "PHONE_WITHOUT_WHATSAPP" || msg.toLowerCase().includes("whatsapp")) {
      return "WhatsApp Não Localizado";
    }
    if (c === "RATE_LIMITED" || msg.toLowerCase().includes("aguarde")) {
      return "Aguarde para Reenviar";
    }
    if (msg.includes("502") || msg.toLowerCase().includes("indisponível") || msg.toLowerCase().includes("conectar")) {
      return "Serviço Indisponível";
    }
    return "Atenção";
  });

  let resolvedDescription = $derived.by(() => {
    if (description) return description;
    const msg = error || "";
    const c = code || "";
    if (c === "OTP_EXPIRED" || msg.toLowerCase().includes("expirado")) {
      return "O código de verificação expirou por tempo ou atingiu o limite de segurança. Deseja receber um novo código no seu WhatsApp agora?";
    }
    if (c === "OTP_INVALID" || msg.toLowerCase().includes("incorreto")) {
      return "O código digitado não confere com o enviado ao seu número. Confira as mensagens no WhatsApp e tente novamente.";
    }
    if (c === "PHONE_WITHOUT_WHATSAPP" || msg.toLowerCase().includes("whatsapp")) {
      return "O número informado não possui conta ativa no WhatsApp. O código de acesso é enviado exclusivamente por WhatsApp.";
    }
    return msg || "Ocorreu um erro durante a operação. Verifique os dados e tente novamente.";
  });

  let resolvedVariant = $derived.by(() => {
    const c = code || "";
    const msg = (error || "").toLowerCase();
    if (c === "OTP_EXPIRED" || msg.includes("expirado")) return "conversion" as const;
    if (c === "OTP_INVALID" || msg.includes("incorreto")) return "warning" as const;
    return "danger" as const;
  });

  let resolvedPrimaryLabel = $derived.by(() => {
    if (primaryAction?.label) return primaryAction.label;
    const c = code || "";
    const msg = (error || "").toLowerCase();
    if (c === "OTP_EXPIRED" || msg.includes("expirado")) return "Reenviar Código";
    if (c === "OTP_INVALID" || msg.includes("incorreto")) return "Digitar Novamente";
    return "Tentar Novamente";
  });

  let resolvedCancelLabel = $derived.by(() => {
    if (secondaryAction === null) return null;
    if (secondaryAction?.label) return secondaryAction.label;
    const c = code || "";
    const msg = (error || "").toLowerCase();
    if (c === "OTP_EXPIRED" || msg.includes("expirado")) return "Trocar Telefone";
    return "Fechar";
  });

  function handleConfirm() {
    if (primaryAction?.action) {
      primaryAction.action();
    } else {
      onClose();
    }
  }

  function handleCancel() {
    if (secondaryAction?.action) {
      secondaryAction.action();
    } else {
      onClose();
    }
  }
</script>

<AlertDialog
  {isOpen}
  title={resolvedTitle}
  description={resolvedDescription}
  variant={resolvedVariant}
  confirmLabel={resolvedPrimaryLabel}
  cancelLabel={resolvedCancelLabel}
  {loading}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
