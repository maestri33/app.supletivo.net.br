"use client";

import React, { useState } from "react";
import { EnvironmentTabs } from "@/components/interactive/EnvironmentTabs";

export function TabsDemo() {
  const [selectedScenario, setSelectedScenario] = useState<string>("aluno_promotor");

  const scenarios = [
    {
      id: "aluno_promotor",
      label: "Aluno + Promotor (2 Roles)",
      roles: ["aluno", "promotor"],
      description: "Aluno matriculado que também atua como consultor/afiliado indicando novos alunos e gerando comissões.",
    },
    {
      id: "aluno_polo",
      label: "Aluno + Coordenador do Polo (2 Roles)",
      roles: ["aluno", "polo"],
      description: "Coordenador da unidade regional credenciada que também conclui sua própria formação no Ensino Médio.",
    },
    {
      id: "completo",
      label: "Aluno + Promotor + Coordenador do Polo (3 Roles)",
      roles: ["aluno", "promotor", "polo"],
      description: "Acesso integral aos 3 perfis da plataforma: estudo/formação, afiliação/comissões e secretaria do polo.",
    },
    {
      id: "apenas_aluno",
      label: "Apenas Aluno (1 Role • Regra de Ouro)",
      roles: ["aluno"],
      description: "Regra Canônica: usuário com 1 único papel NÃO possui barra de abas no topo, entrando direto no ambiente dele.",
    },
    {
      id: "apenas_promotor",
      label: "Apenas Promotor (1 Role • Regra de Ouro)",
      roles: ["promotor"],
      description: "Regra Canônica: consultor educacional exclusivo entra direto no painel de leads e repasses, sem abas no topo.",
    },
    {
      id: "apenas_polo",
      label: "Apenas Coordenador do Polo (1 Role • Regra de Ouro)",
      roles: ["polo"],
      description: "Regra Canônica: equipe da secretaria regional entra direto na fila de validação de documentos físicos, sem abas.",
    },
  ];

  const currentScenario = scenarios.find((s) => s.id === selectedScenario) || scenarios[0];

  return (
    <div className="w-full min-h-[calc(100dvh-53px)] flex flex-col items-center relative">
      {/* PARTE SUPERIOR: Renderização do EnvironmentTabs diretamente no topo */}
      <div className="w-full">
        <EnvironmentTabs
          key={currentScenario.roles.join("-")}
          roles={currentScenario.roles}
          studentName="Lucas Maestri"
          partnerUrl="https://ava.instituicaoparceira.edu.br/aluno"
          stickyTop={true}
        />
      </div>

      {/* PARTE INFERIOR: Simulador Flutuante de Perfis (Tester Dock) */}
      <aside
        aria-label="Simulador de Perfis Multi-Role"
        className="fixed bottom-3 inset-x-0 mx-auto max-w-4xl w-[94%] z-40 p-3 rounded-2xl bg-[var(--ink)]/95 border border-white/15 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-[var(--yellow)] animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--yellow)] font-sans">
              Simulador de Perfis Multi-Role
            </span>
          </div>
          <span className="text-[11px] text-white/60 font-mono">
            {currentScenario.roles.length > 1
              ? `Multi-Role (${currentScenario.roles.length} perfis: ${currentScenario.roles.join(", ")}) • Abas na Parte Superior`
              : `Perfil Único (${currentScenario.roles[0]}) • Regra de Ouro: Zero Abas`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => setSelectedScenario(sc.id)}
              className={`px-2.5 py-2 rounded-xl text-[11px] font-semibold text-center transition-all cursor-pointer truncate ${
                selectedScenario === sc.id
                  ? "bg-[var(--blue)] text-white shadow-lg ring-1 ring-white/30 font-bold"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              title={sc.description}
            >
              {sc.label.split(" (")[0]}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default TabsDemo;
