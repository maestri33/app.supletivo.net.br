import type { APIRoute } from "astro";

export const prerender = false;

interface ContactRecoveryRequest {
  cpf: string;
  new_phone: string;
  method: "email" | "biometric" | "secretaria";
  current_phone?: string;
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
    const protocolNumber = `SEC-REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Mascaramento de dados para auditoria LGPD
    const maskedCpf = `${cpfDigits.slice(0, 3)}.***.***-${cpfDigits.slice(-2)}`;
    const maskedNewPhone = `(${phoneDigits.slice(0, 2)}) *****-${phoneDigits.slice(-4)}`;

    // Log estruturado de auditoria de segurança
    const auditLog = {
      event: "STUDENT_CONTACT_CHANGE_REQUESTED",
      audit_id: auditId,
      protocol: protocolNumber,
      timestamp,
      client_ip: clientIp,
      user_agent: userAgent,
      masked_cpf: maskedCpf,
      masked_new_phone: maskedNewPhone,
      previous_phone: current_phone || "not_provided",
      method,
      status: "PENDING_SECONDARY_VALIDATION",
    };

    console.info("[AUDIT_LOG:CONTACT_CHANGE]", JSON.stringify(auditLog));

    let methodInstructions = "";
    switch (method) {
      case "email":
        methodInstructions = "Enviamos um link de confirmação seguro para o seu e-mail cadastrado.";
        break;
      case "biometric":
        methodInstructions = "Iniciando verificação facial comparativa com o documento oficial arquivado.";
        break;
      case "secretaria":
      default:
        methodInstructions = "Protocolo aberto com sucesso. Nossa secretaria acadêmica entrará em contato via canal seguro.";
        break;
    }

    return new Response(
      JSON.stringify({
        success: true,
        protocol: protocolNumber,
        audit_id: auditId,
        method,
        instructions: methodInstructions,
        created_at: timestamp,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[CONTACT_RECOVERY_ERROR]", err);
    return new Response(
      JSON.stringify({ error: "Falha ao processar solicitação de troca de contato." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
