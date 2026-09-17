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
 * 100% aderente a AGENTS.md (Código em inglês, Interface 100% PT-BR).
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

  // Escuta trocas de ambiente disparadas pelas tabs superiores
  React.useEffect(() => {
    const handleRoleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ role: UserRole }>;
      if (customEvent.detail?.role) {
        setRole(customEvent.detail.role);
      }
    };
    window.addEventListener("supletivo:role-change", handleRoleChange);
    return () => window.removeEventListener("supletivo:role-change", handleRoleChange);
  }, []);

  // Mapeamento dinâmico de itens baseado no perfil (Role-Based Navigation)
  const items: FloatingDockItem[] = React.useMemo(() => {
    switch (role) {
      case "promotor":
        return [
          {
            title: "Painel do Promotor",
            icon: <IconHome className="h-full w-full" />,
            href: "/promotor/painel",
            isActive: currentPath.startsWith("/promotor/painel"),
          },
          {
            title: "Meus Alunos Indicados",
            icon: <IconUsers className="h-full w-full" />,
            href: "/promotor/leads",
            badge: newLeadsCount > 0 ? newLeadsCount : null,
            badgeVariant: "success",
            isActive: currentPath.startsWith("/promotor/leads"),
          },
          {
            title: "Minhas Comissões",
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
            title: "Painel do Polo",
            icon: <IconHome className="h-full w-full" />,
            href: "/polo/painel",
            isActive: currentPath.startsWith("/polo/painel"),
          },
          {
            title: "Conferência de Matrículas",
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
            title: "Gestão de Usuários",
            icon: <IconUsers className="h-full w-full" />,
            href: "/admin/usuarios",
            isActive: currentPath.startsWith("/admin/usuarios"),
          },
          {
            title: "Auditoria do Sistema",
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
            title: "Documentação",
            icon: <IconFileText className="h-full w-full" />,
            href: "/documentos",
            badge: pendingDocsCount > 0 ? "!" : null,
            badgeVariant: "warning",
            isActive: currentPath.startsWith("/documentos"),
          },
          {
            title: "Certificação e Diploma",
            icon: <IconAward className="h-full w-full" />,
            href: "/certificados",
            isActive: currentPath.startsWith("/certificados"),
          },
          {
            title: "Ajuda e Suporte",
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
    <FloatingDock
      items={items}
      desktopClassName="fixed bottom-6 inset-x-0 z-50"
      mobileClassName="fixed bottom-6 right-6 z-50"
      dockAriaLabel={`Navegação principal do ${role}`}
    />
  );
};

export default RoleAdaptiveNavDock;
