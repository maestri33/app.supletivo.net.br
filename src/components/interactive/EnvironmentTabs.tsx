import React from "react";
import { Tabs } from "@/components/ui/tabs";
import { normalizeUserRoles } from "@/lib/roles";

export interface EnvironmentTabsProps {
  roles?: string[];
  studentName?: string;
  partnerUrl?: string | null;
  stickyTop?: boolean;
}

export const EnvironmentTabs: React.FC<EnvironmentTabsProps> = ({
  roles = ["aluno"],
  studentName = "Aluno",
  partnerUrl,
  stickyTop = true,
}) => {
  // Normaliza roles usando utilitário canônico
  const activeRoles = normalizeUserRoles(roles);

  // Dicionário de definição de cada ambiente
  const allTabsMap: Record<string, { title: string; value: string; content: React.ReactNode }> = {
    aluno: {
      title: "🎓 Aluno",
      value: "aluno",
      content: (
        <div className="w-full overflow-hidden relative rounded-3xl p-6 sm:p-8 text-white glass-panel border border-white/15 bg-gradient-to-br from-[var(--blue)]/80 to-[var(--blue-deep)]/90 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-300 mb-2">
                <span className="size-2 rounded-full bg-emerald-400"></span>
                Ambiente de Formação Ativo
              </div>
              <h2 className="text-2xl sm:text-3xl font-display text-white">
                Olá, {studentName}!
              </h2>
              <p className="text-xs sm:text-sm text-white/70 mt-1">
                Acesse seus conteúdos, histórico e acompanhe a conclusão do Ensino Médio.
              </p>
            </div>

            {partnerUrl && (
              <a
                href={partnerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn inline-flex items-center gap-2 text-xs py-2.5 px-5 font-bold uppercase tracking-wider text-[var(--ink)]"
              >
                Acessar Sala de Aula ↗
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/60 uppercase font-semibold">Status Curricular</span>
              <p className="text-lg font-bold text-white mt-1">Disciplinas Liberadas</p>
              <p className="text-xs text-emerald-400 mt-2">12 de 12 matérias ativas</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/60 uppercase font-semibold">Documentação</span>
              <p className="text-lg font-bold text-white mt-1">Validação Concluída</p>
              <p className="text-xs text-white/70 mt-2">Apto para prova de certificação</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/60 uppercase font-semibold">Diploma Oficial</span>
              <p className="text-lg font-bold text-white mt-1">Credenciado MEC</p>
              <p className="text-xs text-white/70 mt-2">Publicação no GDAE / Diário Oficial</p>
            </div>
          </div>
        </div>
      ),
    },
    promotor: {
      title: "💼 Promotor",
      value: "promotor",
      content: (
        <div className="w-full overflow-hidden relative rounded-3xl p-6 sm:p-8 text-white glass-panel border border-white/15 bg-gradient-to-br from-[var(--green-deep)]/80 to-[var(--blue)]/80 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--yellow)]/15 border border-[var(--yellow)]/30 text-xs font-semibold text-[var(--yellow)] mb-2">
                Painel do Consultor Educacional
              </div>
              <h2 className="text-2xl sm:text-3xl font-display text-white">
                Gestão de Indicações & Comissões
              </h2>
              <p className="text-xs sm:text-sm text-white/70 mt-1">
                Acompanhe o funil de matrículas e seus repasses financeiros.
              </p>
            </div>

            <a
              href="/promotor/leads"
              className="inline-flex items-center gap-2 text-xs py-2.5 px-5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
            >
              Ver Meus Leads →
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/60 uppercase font-semibold">Leads Ativos</span>
              <p className="text-2xl font-bold text-white mt-1">24</p>
              <p className="text-xs text-emerald-400 mt-1">+3 nas últimas 24h</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/60 uppercase font-semibold">Matrículas Confirmadas</span>
              <p className="text-2xl font-bold text-white mt-1">18</p>
              <p className="text-xs text-white/70 mt-1">Conversão de 75%</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/60 uppercase font-semibold">Saldo a Receber</span>
              <p className="text-2xl font-bold text-[var(--yellow)] mt-1">R$ 2.450,00</p>
              <p className="text-xs text-white/70 mt-1">Próximo fechamento semanal</p>
            </div>
          </div>
        </div>
      ),
    },
    polo: {
      title: "🏫 Coordenador do Polo",
      value: "polo",
      content: (
        <div className="w-full overflow-hidden relative rounded-3xl p-6 sm:p-8 text-white glass-panel border border-white/15 bg-gradient-to-br from-[var(--ink)]/90 to-[var(--blue)]/90 shadow-2xl">
          <div className="border-b border-white/10 pb-6 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-xs font-semibold text-blue-300 mb-2">
              Secretaria do Polo Regional
            </div>
            <h2 className="text-2xl sm:text-3xl font-display text-white">
              Conferência Documental & Turmas
            </h2>
            <p className="text-xs sm:text-sm text-white/70 mt-1">
              Validação de documentação física, agendamento de bancas e entrega de certificados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/60 uppercase font-semibold">Pendências de Validação</span>
              <p className="text-xl font-bold text-amber-300 mt-1">5 documentos para análise</p>
              <p className="text-xs text-white/60 mt-1">RG, Histórico e Comprovantes em fila</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/60 uppercase font-semibold">Diplomas Prontos para Retirada</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">12 certificados impressos</p>
              <p className="text-xs text-white/60 mt-1">Aguardando assinatura do concluinte</p>
            </div>
          </div>
        </div>
      ),
    },
  };

  // Suporte canônico tanto para chaves em inglês quanto legadas em português
  allTabsMap.student = allTabsMap.aluno;
  allTabsMap.promoter = allTabsMap.promotor;
  allTabsMap.hub = allTabsMap.polo;

  // Filtra APENAS as tabs que correspondem às roles reais do usuário
  const matchingTabs = activeRoles
    .map((r) => allTabsMap[r])
    .filter(Boolean);

  // Fallback: se nenhuma bateu, exibe a do aluno
  const filteredTabs = matchingTabs.length > 0 ? matchingTabs : [allTabsMap.student || allTabsMap.aluno];

  // REGRA DO USUÁRIO:
  // Se o usuário tem apenas 1 role, NÃO exibe barra de navegação/tabs em cima — renderiza direto o ambiente dele!
  if (filteredTabs.length === 1) {
    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center px-4 pt-4 pb-28">
        {filteredTabs[0].content}
      </div>
    );
  }

  // Se tem mais de 1 role: renderiza as tabs NA PARTE SUPERIOR (Upper Navigation Bar)
  return (
    <div className="w-full flex flex-col items-center">
      <Tabs
        tabs={filteredTabs}
        containerClassName="w-full"
        tablistWrapperClassName={
          stickyTop
            ? "sticky top-0 z-30 w-full py-3 bg-[rgba(11,18,32,0.85)] backdrop-blur-xl border-b border-white/10 shadow-lg px-4"
            : "py-3 w-full px-4"
        }
        tablistClassName="shadow-xl"
        tabClassName="text-xs sm:text-sm font-semibold tracking-wide text-white/70 hover:text-white"
        activeTabClassName="bg-[var(--blue)] text-white shadow-lg ring-1 ring-white/30"
        contentClassName="w-full max-w-5xl mx-auto px-4 pt-4 pb-28"
      />
    </div>
  );
};

export default EnvironmentTabs;
