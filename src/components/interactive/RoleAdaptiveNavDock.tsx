"use client";

import * as React from "react";
import { FloatingDock, type FloatingDockItem } from "@/components/ui/floating-dock";
import {
  IconHome,
  IconFileText,
  IconAward,
  IconCash,
  IconUsers,
  IconHelpCircle,
  IconSettings,
  IconDoorExit,
} from "@tabler/icons-react";

export type UserRole = "aluno" | "promotor" | "polo" | "admin";

export interface RoleAdaptiveNavDockProps {
  initialRole?: UserRole;
  currentPath?: string;
  onNavigate?: (href: string) => void;
  onLogout?: () => void;
}

/**
 * Componente Adaptativo Multi-Role & Multi-Estado.
 * Filtra e customiza dinamicamente as ações e badges do FloatingDock
 * com base no papel ativo do usuário e estado operacional.
 */
export const RoleAdaptiveNavDock: React.FC<RoleAdaptiveNavDockProps> = ({
  initialRole = "aluno",
  currentPath = "/painel",
  onNavigate,
  onLogout,
}) => {
  const [role, setRole] = React.useState<UserRole>(initialRole);
  const [pendingDocsCount] = React.useState<number>(1);
  const [newLeadsCount] = React.useState<number>(3);

  // Mapeamento dinâmico de itens baseado no perfil (Role-Based Navigation)
  const items: FloatingDockItem[] = React.useMemo(() => {
    switch (role) {
      case "promotor":
        return [
          {
            title: "Painel Promotor",
            icon: <IconHome className="h-full w-full" />,
            href: "/promotor/painel",
            isActive: currentPath.startsWith("/promotor/painel"),
          },
          {
            title: "Meus Leads",
            icon: <IconUsers className="h-full w-full" />,
            href: "/promotor/leads",
            badge: newLeadsCount > 0 ? newLeadsCount : null,
            badgeVariant: "success",
            isActive: currentPath.startsWith("/promotor/leads"),
          },
          {
            title: "Comissões",
            icon: <IconCash className="h-full w-full" />,
            href: "/promotor/comissoes",
            isActive: currentPath.startsWith("/promotor/comissoes"),
          },
          {
            title: "Suporte",
            icon: <IconHelpCircle className="h-full w-full" />,
            href: "/suporte",
          },
          {
            title: "Sair",
            icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
            onClick: onLogout,
          },
        ];

      case "polo":
        return [
          {
            title: "Painel Polo",
            icon: <IconHome className="h-full w-full" />,
            href: "/polo/painel",
            isActive: currentPath.startsWith("/polo/painel"),
          },
          {
            title: "Matrículas",
            icon: <IconFileText className="h-full w-full" />,
            href: "/polo/matriculas",
            isActive: currentPath.startsWith("/polo/matriculas"),
          },
          {
            title: "Configurações",
            icon: <IconSettings className="h-full w-full" />,
            href: "/polo/configuracoes",
            isActive: currentPath.startsWith("/polo/configuracoes"),
          },
          {
            title: "Sair",
            icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
            onClick: onLogout,
          },
        ];

      case "admin":
        return [
          {
            title: "Visão Geral",
            icon: <IconHome className="h-full w-full" />,
            href: "/admin",
            isActive: currentPath === "/admin",
          },
          {
            title: "Usuários",
            icon: <IconUsers className="h-full w-full" />,
            href: "/admin/usuarios",
            isActive: currentPath.startsWith("/admin/usuarios"),
          },
          {
            title: "Auditoria",
            icon: <IconFileText className="h-full w-full" />,
            href: "/admin/auditoria",
            isActive: currentPath.startsWith("/admin/auditoria"),
          },
          {
            title: "Sair",
            icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
            onClick: onLogout,
          },
        ];

      case "aluno":
      default:
        return [
          {
            title: "Meu Curso",
            icon: <IconHome className="h-full w-full" />,
            href: "/painel",
            isActive: currentPath === "/painel",
          },
          {
            title: "Documentos",
            icon: <IconFileText className="h-full w-full" />,
            href: "/documentos",
            badge: pendingDocsCount > 0 ? "!" : null,
            badgeVariant: "warning",
            isActive: currentPath.startsWith("/documentos"),
          },
          {
            title: "Certificação",
            icon: <IconAward className="h-full w-full" />,
            href: "/certificados",
            isActive: currentPath.startsWith("/certificados"),
          },
          {
            title: "Ajuda",
            icon: <IconHelpCircle className="h-full w-full" />,
            href: "/ajuda",
            isActive: currentPath.startsWith("/ajuda"),
          },
          {
            title: "Sair",
            icon: <IconDoorExit className="h-full w-full text-[var(--danger)]" />,
            onClick: onLogout,
          },
        ];
    }
  }, [role, currentPath, pendingDocsCount, newLeadsCount, onLogout]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Seletor rápido de simulação de role (útil para desenvolvimento & QA) */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--line-light)] bg-[var(--paper)]/80 backdrop-blur-sm text-xs text-[var(--ink)] dark:bg-[var(--ink-soft)] dark:text-[var(--paper)] dark:border-[rgba(255,255,255,0.1)]">
        <span className="font-semibold opacity-70">Perfil Ativo:</span>
        {(["aluno", "promotor", "polo", "admin"] as UserRole[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`px-2 py-0.5 rounded-md font-medium capitalize transition-colors ${
              role === r
                ? "bg-[var(--blue)] text-white"
                : "hover:bg-[var(--paper-soft)] dark:hover:bg-[rgba(255,255,255,0.08)]"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <FloatingDock
        items={items}
        desktopClassName="fixed bottom-6 inset-x-0 z-50"
        mobileClassName="fixed bottom-6 right-6 z-50"
        dockAriaLabel={`Navegação principal do ${role}`}
      />
    </div>
  );
};

export default RoleAdaptiveNavDock;