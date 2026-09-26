"use client";

import React, { useState } from "react";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { RoleAdaptiveNavDock } from "@/components/interactive/RoleAdaptiveNavDock";
import type { UserRole, StudentDockState, PromoterDockState, PoloDockState } from "@/components/interactive/dock/types";
import {
  IconFileText,
  IconChecklist,
  IconSchool,
  IconAward,
  IconUsers,
  IconCash,
  IconFileCheck,
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
  IconLock,
  IconLayoutNavbar,
} from "@tabler/icons-react";

export interface RoleStatusTabsProps {
  initialRole?: UserRole;
  initialVariant?: "bottom-bar" | "floating";
}

export const RoleStatusTabs: React.FC<RoleStatusTabsProps> = ({
  initialRole = "aluno",
  initialVariant = "bottom-bar",
}) => {
  const [activeRole, setActiveRole] = useState<UserRole>(initialRole);
  const [dockVariant, setDockVariant] = useState<"bottom-bar" | "floating">(initialVariant);

  // Status ativos por perfil
  const [studentStatus, setStudentStatus] = useState<string>("awaiting_documents");
  const [promoterStatus, setPromoterStatus] = useState<string>("candidate");
  const [poloStatus, setPoloStatus] = useState<string>("pending_validation");

  // Dicionário de tabs de status para o Aluno
  const studentTabs: TabItem[] = [
    {
      title: "1. Envio de Documentos",
      value: "awaiting_documents",
      badge: "Pendente",
      content: (
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <IconFileText className="size-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Etapa 1 • Matrícula & Documentação</span>
                <h3 className="text-xl font-bold text-white">Coleta de Documentos Obrigatórios</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold w-fit">
              Ação Requerida do Aluno
            </span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            O aluno concluiu o pagamento da matrícula e precisa digitalizar o RG (frente e verso), comprovante de endereço e histórico escolar anterior para liberação do ambiente pedagógico.
          </p>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
            <IconAlertTriangle className="size-5 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <strong className="font-semibold block mb-0.5">Comportamento do Dock:</strong>
              O ícone <strong className="text-white">Documentação</strong> fica em destaque ativo com badge de exclamação <span className="bg-amber-400 text-black px-1.5 py-0.5 rounded-full font-black text-[10px]">!</span> para guiar imediatamente o aluno à regularização. Provas e Certificação permanecem inativos.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "2. Análise da Secretaria",
      value: "documents_under_review",
      badge: "Em Análise",
      content: (
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <IconClock className="size-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Etapa 2 • Secretaria de Polo</span>
                <h3 className="text-xl font-bold text-white">Documentação em Conferência</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold w-fit">
              Aguardando Polo
            </span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            Os arquivos foram enviados com sucesso e estão na esteira de conferência da secretaria escolar credenciada. O polo valida a autenticidade e emite o parecer pedagógico.
          </p>
          <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-200 flex items-start gap-3">
            <IconClock className="size-5 shrink-0 mt-0.5 text-sky-400" />
            <div>
              <strong className="font-semibold block mb-0.5">Comportamento do Dock:</strong>
              O ícone <strong className="text-white">Documentação</strong> exibe um indicador sutil <span className="bg-sky-500 text-white px-1.5 py-0.5 rounded-full font-black text-[10px]">•</span>. O aluno pode estudar as apostilas no ambiente, mas as provas continuam aguardando liberação da secretaria.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "3. Prova Liberada",
      value: "exam_released",
      badge: "Liberada",
      content: (
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <IconSchool className="size-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Etapa 3 • Banca Avaliadora</span>
                <h3 className="text-xl font-bold text-white">Avaliações Finais Disponíveis</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold w-fit">
              Pronto para Agendar
            </span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            Documentação validada e carga horária integralizada. O aluno está 100% apto a realizar ou agendar sua avaliação final do Ensino Médio.
          </p>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-3">
            <IconCircleCheck className="size-5 shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <strong className="font-semibold block mb-0.5">Comportamento do Dock:</strong>
              O foco salta diretamente para <strong className="text-white">Provas & Avaliações</strong>, com badge de sucesso <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black text-[10px]">Liberada</span> e destaque ativo no menu inferior.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "4. Emissão de Diploma",
      value: "awaiting_diploma_issuance",
      badge: "Emissão",
      content: (
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <IconAward className="size-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Etapa 4 • Registro Oficial MEC</span>
                <h3 className="text-xl font-bold text-white">Conferência no GDAE / Diário Oficial</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold w-fit">
              Emissão em Andamento
            </span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            Aluno aprovado com êxito em todas as bancas. A instituição emissora credenciada iniciou o registro no livro de concluintes e a publicação oficial no Diário Oficial / SISTEC-MEC.
          </p>
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-start gap-3">
            <IconAward className="size-5 shrink-0 mt-0.5 text-purple-400" />
            <div>
              <strong className="font-semibold block mb-0.5">Comportamento do Dock:</strong>
              O ícone <strong className="text-white">Certificação e Diploma</strong> ganha o badge <span className="bg-sky-500 text-white px-2 py-0.5 rounded-full font-black text-[10px]">Emissão</span> e assume o destaque visual de conclusão.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "5. Aluno Formado",
      value: "veteran",
      badge: "Concluído",
      content: (
        <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <IconAward className="size-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Etapa Final • Certificação Concluída</span>
                <h3 className="text-xl font-bold text-white">Diploma Registrado e Disponível</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-black w-fit">
              FORMADO 🎓
            </span>
          </div>
          <p className="text-sm text-white/85 leading-relaxed">
            Parabéns! O diploma oficial do Ensino Médio com publicação no Diário Oficial está pronto para download do certificado digital com assinatura ICP-Brasil ou retirada física no polo.
          </p>
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-3">
            <IconCircleCheck className="size-5 shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <strong className="font-semibold block mb-0.5">Comportamento do Dock:</strong>
              Badge verde <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black text-[10px]">Concluído</span> com acesso direto à via digital do diploma e opção de indicação de novos alunos como promotor parceiro.
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Dicionário de tabs de status para o Promotor
  const promoterTabs: TabItem[] = [
    {
      title: "1. Credenciamento",
      value: "candidate",
      badge: "Onboarding",
      content: (
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <IconChecklist className="size-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Candidato a Promotor</span>
                <h3 className="text-xl font-bold text-white">Onboarding & Cadastro de Chave PIX</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold w-fit">
              Etapa Inicial
            </span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            O consultor está finalizando sua ficha cadastral, termo de adesão ao programa de indicação e inserção da chave PIX para repasse automático de bonificações.
          </p>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
            <IconAlertTriangle className="size-5 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <strong className="font-semibold block mb-0.5">Comportamento do Dock:</strong>
              O Dock fica restrito a <strong className="text-white">Credenciamento</strong>, Suporte e Sair. As abas de Leads e Comissões ficam ocultas até a homologação.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "2. Treinamento",
      value: "training",
      badge: "Travado",
      content: (
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <IconLock className="size-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Capacitação Obrigatória</span>
                <h3 className="text-xl font-bold text-white">Módulos de Conformidade & Ética</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold w-fit">
              Painel Travado
            </span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            Regra regulatória: antes de gerar links de indicação, o promotor deve assistir aos vídeos curtos de conformidade do MEC e práticas autorizadas de divulgação.
          </p>
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200 flex items-start gap-3">
            <IconLock className="size-5 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <strong className="font-semibold block mb-0.5">Comportamento do Dock:</strong>
              Exibe o item <strong className="text-white">Treinamento Obrigatório</strong> com badge de atenção, e o <strong className="text-white">Painel Bloqueado</strong> com cadeado e badge <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-black text-[10px]">Travado</span>.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "3. Promotor Ativo",
      value: "active",
      badge: "Liberado",
      content: (
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <IconCash className="size-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Operação Ativa</span>
                <h3 className="text-xl font-bold text-white">Gestão Completa de Leads e Comissões</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold w-fit">
              Acesso Total
            </span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            Promotor 100% ativo! Pode divulgar seu link personalizado, cadastrar candidatos pelo WhatsApp e acompanhar os repasses financeiros no PIX.
          </p>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-3">
            <IconCircleCheck className="size-5 shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <strong className="font-semibold block mb-0.5">Comportamento do Dock:</strong>
              O Dock libera todos os itens operacionais: <strong className="text-white">Painel</strong>, <strong className="text-white">Leads</strong> (com badge dinâmico de 3 novos leads), <strong className="text-white">Comissões & PIX</strong>, Suporte e Logout.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "4. Acesso Suspenso",
      value: "suspended",
      badge: "Bloqueado",
      content: (
        <div className="w-full rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <IconAlertTriangle className="size-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Segurança & Auditoria</span>
                <h3 className="text-xl font-bold text-white">Conta Temporariamente Suspensa</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-bold w-fit">
              Suspenso
            </span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            A conta foi pausada preventivamente para conferência de conformidade pedagógica ou regularização cadastral da chave bancária.
          </p>
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-3">
            <IconAlertTriangle className="size-5 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <strong className="font-semibold block mb-0.5">Comportamento do Dock:</strong>
              Todas as ações de captação são desativadas. O Dock exibe <strong className="text-white">Acesso Suspenso</strong> em vermelho, Falar com Coordenação e Logout.
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Dicionário de tabs de status para o Polo
  const poloTabs: TabItem[] = [
    {
      title: "1. Fila Documental",
      value: "pending_validation",
      badge: "5 Pendentes",
      content: (
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <IconFileCheck className="size-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Secretaria do Polo</span>
                <h3 className="text-xl font-bold text-white">Conferência de Matrículas e Documentos</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold w-fit">
              5 Documentos Aguardando
            </span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            Fila prioritária da secretaria para validação de legibilidade de RG, histórico escolar do Ensino Fundamental e comprovantes de endereço.
          </p>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
            <IconChecklist className="size-5 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <strong className="font-semibold block mb-0.5">Comportamento do Dock:</strong>
              O item <strong className="text-white">Fila de Conferência</strong> é ativado com badge de contagem <span className="bg-amber-400 text-black px-1.5 py-0.5 rounded-full font-black text-[10px]">5</span> para o coordenador auditar os anexos.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "2. Bancas & Provas",
      value: "pending_exams",
      badge: "2 Agendadas",
      content: (
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <IconSchool className="size-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Banca Examinadora</span>
                <h3 className="text-xl font-bold text-white">Agendamento & Aplicação Presencial</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold w-fit">
              2 Sessões Ativas
            </span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            Gestão das bancas de provas presenciais no polo credenciado, lançamento de atas de avaliação e confirmação de presença com biometria facial.
          </p>
          <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-200 flex items-start gap-3">
            <IconSchool className="size-5 shrink-0 mt-0.5 text-sky-400" />
            <div>
              <strong className="font-semibold block mb-0.5">Comportamento do Dock:</strong>
              O item <strong className="text-white">Bancas & Provas</strong> fica ativo com badge azul <span className="bg-sky-500 text-white px-1.5 py-0.5 rounded-full font-black text-[10px]">2</span>.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "3. Entrega de Diplomas",
      value: "ready_diplomas",
      badge: "4 Prontos",
      content: (
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <IconAward className="size-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Expedição & Retirada</span>
                <h3 className="text-xl font-bold text-white">Livro de Registro e Entrega de Diplomas</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold w-fit">
              4 Diplomas Físicos
            </span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            Diplomas com selo MEC e publicação oficial prontos para coleta de assinatura do concluinte no livro de registro do polo.
          </p>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-3">
            <IconAward className="size-5 shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <strong className="font-semibold block mb-0.5">Comportamento do Dock:</strong>
              O item <strong className="text-white">Diplomas Oficiais</strong> é ativado com badge verde <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-black text-[10px]">4</span>.
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Estado atual mapeado para o dock conforme o papel
  const studentDockState: StudentDockState = {
    status: studentStatus,
    pendingDocsCount: studentStatus === "awaiting_documents" ? 2 : 0,
    hasPartnerUrl: studentStatus !== "awaiting_documents",
  };

  const promoterDockState: PromoterDockState = {
    status: promoterStatus,
    newLeadsCount: promoterStatus === "active" ? 3 : 0,
    isCandidate: promoterStatus === "candidate",
    isTrainingBlocked: promoterStatus === "training",
  };

  const poloDockState: PoloDockState = {
    status: poloStatus,
    pendingValidationCount: poloStatus === "pending_validation" ? 5 : 0,
    pendingExamsCount: poloStatus === "pending_exams" ? 2 : 0,
    readyDiplomasCount: poloStatus === "ready_diplomas" ? 4 : 0,
  };

  return (
    <div className="w-full flex flex-col items-center pb-32">
      {/* Top Controls: Role Selector & Dock Variant Switcher */}
      <div className="w-full max-w-4xl px-4 py-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0b1220]/80 border border-white/15 backdrop-blur-xl">
          {/* Seletor de Role */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white/60">Perfil:</span>
            <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveRole("aluno")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeRole === "aluno"
                    ? "bg-[var(--blue)] text-white shadow-md"
                    : "text-white/70 hover:text-white"
                }`}
              >
                🎓 Aluno
              </button>
              <button
                type="button"
                onClick={() => setActiveRole("promotor")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeRole === "promotor"
                    ? "bg-[var(--blue)] text-white shadow-md"
                    : "text-white/70 hover:text-white"
                }`}
              >
                💼 Promotor
              </button>
              <button
                type="button"
                onClick={() => setActiveRole("polo")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeRole === "polo"
                    ? "bg-[var(--blue)] text-white shadow-md"
                    : "text-white/70 hover:text-white"
                }`}
              >
                🏫 Polo
              </button>
            </div>
          </div>

          {/* Seletor de Variante do Dock */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white/60">Estilo do Dock:</span>
            <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setDockVariant("bottom-bar")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dockVariant === "bottom-bar"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <IconLayoutNavbar className="size-3.5" />
                Opção 1 (Barra Nativa)
              </button>
              <button
                type="button"
                onClick={() => setDockVariant("floating")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dockVariant === "floating"
                    ? "bg-[var(--yellow)] text-black shadow-md"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Cápsula Flutuante
              </button>
            </div>
          </div>
        </div>

        {/* TABS DE STATUS DO PERFIL SELECIONADO */}
        <div className="w-full">
          {activeRole === "aluno" && (
            <Tabs
              tabs={studentTabs}
              value={studentStatus}
              onChange={(newStatus) => setStudentStatus(newStatus)}
              ariaLabel="Etapas e Status do Aluno"
              tablistWrapperClassName="mb-4"
            />
          )}

          {activeRole === "promotor" && (
            <Tabs
              tabs={promoterTabs}
              value={promoterStatus}
              onChange={(newStatus) => setPromoterStatus(newStatus)}
              ariaLabel="Etapas e Status do Promotor"
              tablistWrapperClassName="mb-4"
            />
          )}

          {activeRole === "polo" && (
            <Tabs
              tabs={poloTabs}
              value={poloStatus}
              onChange={(newStatus) => setPoloStatus(newStatus)}
              ariaLabel="Etapas e Status do Coordenador do Polo"
              tablistWrapperClassName="mb-4"
            />
          )}
        </div>
      </div>

      {/* RENDERIZAÇÃO DO DOCK SINCRONIZADO COM O STATUS ATIVO */}
      <RoleAdaptiveNavDock
        role={activeRole}
        variant={dockVariant}
        studentState={studentDockState}
        promoterState={promoterDockState}
        poloState={poloDockState}
        bypassAuth={true}
      />
    </div>
  );
};

export default RoleStatusTabs;
