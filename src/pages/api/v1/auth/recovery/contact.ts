import type { APIRoute } from "astro";

export const prerender = false;

interface ContactRecoveryRequest {
  cpf: string;
  new_phone: string;
  method?: "email" | "birth_date" | "biometric" | "secretaria";
  current_phone?: string;
  birth_date?: string;
  email?: string;
  otp?: string;
  turnstile_token?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: ContactRecoveryRequest = await request.json();
    const { cpf, new_phone, method, current_phone } = body;

    const cpfDigits = cpf ? cpf.replace(/\D/g, "") : "";
    const phoneDigits = new_phone ? new_phone.replace(/\D/g, "") : "";

    // Validações básicas de segurança
    if (cpfDigits.length !== 11) {
      return new Response(
        JSON.stringify({ error: "CPF inválido. Informe os 11 dígitos do documento." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      return new Response(
        JSON.stringify({ error: "Novo número de telefone inválido. Informe DDD + número." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Protocolo de auditoria rastreável
    const timestamp = new Date().toISOString();
    const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Mascaramento de dados para auditoria LGPD
    const maskedCpf = `${cpfDigits.slice(0, 3)}.***.***-${cpfDigits.slice(-2)}`;
    const maskedNewPhone = `(${phoneDigits.slice(0, 2)}) *****-${phoneDigits.slice(-4)}`;

    // Log estruturado de auditoria de segurança
    const auditLog = {
      event: "STUDENT_CONTACT_CHANGE_REQUESTED",
      audit_id: auditId,
      timestamp,
      client_ip: clientIp,
      user_agent: userAgent,
      masked_cpf: maskedCpf,
      masked_new_phone: maskedNewPhone,
      previous_phone: current_phone || "not_provided",
      method: method || "email",
      status: "PENDING_SECONDARY_VALIDATION",
    };

    console.info("[AUDIT_LOG:CONTACT_CHANGE]", JSON.stringify(auditLog));

    // Tenta delegar para o backend Django (/api/v1/clients/auth/recover-phone)
    const URL_BACKEND = process.env.URL_BACKEND ?? "https://backend.supletivo.net.br";
    try {
      const backendRes = await fetch(`${URL_BACKEND}/api/v1/clients/auth/recover-phone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": clientIp,
          "user-agent": userAgent,
        },
        body: JSON.stringify({
          cpf: cpfDigits,
          new_phone: phoneDigits,
          birth_date: body.birth_date,
          email: body.email,
          otp: body.otp,
          method: method || "email",
          turnstile_token: body.turnstile_token,
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (backendRes.status < 500) {
        interface BackendRecoveryData {
          success?: boolean;
          protocol?: string;
          status?: string;
          requires_challenge?: boolean;
          masked_email?: string;
          masked_new_phone?: string;
          message?: string;
          detail?: string;
        }
        const backendData = (await backendRes.json()) as BackendRecoveryData;
        return new Response(
          JSON.stringify({
            success: backendData.success ?? (backendRes.status === 200),
          protocol: backendData.protocol,
            status: backendData.status ?? (backendRes.status === 200 ? "COMPLETED" : "ERROR"),
            requires_challenge: backendData.requires_challenge ?? false,
            masked_email: backendData.masked_email,
            masked_new_phone: backendData.masked_new_phone || maskedNewPhone,
            instructions: backendData.message,
            error: backendData.detail || (backendRes.status >= 400 ? backendData.message : undefined),
          }),
          {
            status: backendRes.status,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } catch (backendErr) {
      console.warn("[CONTACT_RECOVERY] Backend unavailable; recovery was not confirmed.");
    }

    // An audit log cannot confirm that the backend performed the recovery.
    return new Response(
      JSON.stringify({
        success: false,
        error: "Não foi possível confirmar a recuperação. Tente novamente em instantes.",
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    console.error("[CONTACT_RECOVERY_ERROR]", err);
    return new Response(
      JSON.stringify({ error: "Falha ao processar solicitação de troca de contato." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
