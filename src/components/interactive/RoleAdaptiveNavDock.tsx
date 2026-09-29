"use client";

import * as React from "react";
import { FloatingDock, type FloatingDockItem } from "@/components/ui/floating-dock";
import {
  type UserRole,
  type StudentDockState,
  type PromoterDockState,
  type PoloDockState,
  type AdapterContext,
  getStudentDockItems,
  getPromoterDockItems,
  getPoloDockItems,
  useDockSync,
} from "./dock";

export type { UserRole };

export interface RoleAdaptiveNavDockProps {
  initialRole?: UserRole;
  role?: UserRole;
  variant?: "bottom-bar" | "floating";
  currentPath?: string;
  onNavigate?: (href: string) => void;
  onLogout?: () => void;
  bypassAuth?: boolean;
  studentState?: Partial<StudentDockState>;
  promoterState?: Partial<PromoterDockState>;
  poloState?: Partial<PoloDockState>;
}

/**
 * Componente Adaptativo Multi-Role & Multi-Estado.
 * Arquitetura em camadas desacopladas:
 * 1. Hook de sincronização reativo (`useDockSync`) isolando ciclo de vida, auth e eventos
 * 2. Adaptador polimórfico por Perfil (aluno, promotor, polo)
 * 3. Renderizador de casca limpo (Bottom Bar Nativa ou Floating Dock Cápsula)
 *
 * 100% aderente a AGENTS.md e DESIGN.md (Código em inglês, Interface 100% PT-BR).
 */
export const RoleAdaptiveNavDock: React.FC<RoleAdaptiveNavDockProps> = ({
  initialRole = "aluno",
  role: controlledRole,
  variant = "bottom-bar",
  currentPath = "/painel",
  onNavigate,
  onLogout,
  bypassAuth = false,
  studentState: controlledStudentState,
  promoterState: controlledPromoterState,
  poloState: controlledPoloState,
}) => {
  const {
    activeRole,
    isAuthenticated,
    isLocked,
    studentState: effectiveStudentState,
    promoterState: effectivePromoterState,
    poloState: effectivePoloState,
    handleLogout,
  } = useDockSync({
    initialRole,
    controlledRole,
    currentPath,
    bypassAuth,
    onLogout,
    controlledStudentState,
    controlledPromoterState,
    controlledPoloState,
  });

  // O status 'lead' do estudante opera como um wizard guia de 2 fases no dock
  const isLeadWizard =
    (activeRole === "student" || activeRole === "aluno") &&
    (effectiveStudentState.status === "lead" || currentPath.startsWith("/student/lead"));

  // Se não autenticado ou (bloqueado e não for o wizard do lead), suprime o dock
  if (!isAuthenticated || (isLocked && !isLeadWizard)) {
    return null;
  }

  const context: AdapterContext = {
    currentPath,
    onNavigate,
    onLogout: handleLogout,
  };

  // Mapeamento dinâmico de itens usando o adaptador do ambiente ativo
  let items: FloatingDockItem[] = [];
  switch (activeRole) {
    case "promoter":
    case "promotor":
      items = getPromoterDockItems(effectivePromoterState, context);
      break;
    case "hub":
    case "polo":
      items = getPoloDockItems(effectivePoloState, context);
      break;
    case "student":
    case "aluno":
    default:
      items = getStudentDockItems(effectiveStudentState, context);
      break;
  }

  // Renderização Opção 1: Bottom Bar Nativa (sem sobreposição de rodapé)
  if (variant === "bottom-bar") {
    return (
      <nav
        aria-label={`Navegação principal do ${activeRole}`}
        className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-[var(--ink)]/90 backdrop-blur-2xl shadow-2xl pb-[env(safe-area-inset-bottom)]"
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-[var(--green)] via-[var(--yellow)] to-[var(--blue)]" />
        <div className="mx-auto flex w-full max-w-lg items-center justify-around px-2 py-2">
          {items.map((item, index) => {
            const badgeBg =
              item.badgeVariant === "danger"
                ? "bg-[var(--danger)] text-white"
                : item.badgeVariant === "success"
                ? "bg-[var(--success)] text-white"
                : item.badgeVariant === "info"
                ? "bg-[var(--info)] text-white"
                : "bg-[var(--yellow)] text-[var(--ink)]";

            const content = (
              <>
                <div className="relative flex h-6 w-6 items-center justify-center">
                  <div className="h-5 w-5">{item.icon}</div>
                  {item.badge !== undefined && item.badge !== null && (
                    <span
                      className={`absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black shadow-md ${badgeBg}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight">{item.title}</span>
              </>
            );

            const commonClasses = `flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
              item.isActive
                ? "text-[var(--yellow)] font-bold drop-shadow-[0_0_8px_rgba(255,204,0,0.3)]"
                : "text-white/70 hover:text-white"
            } ${item.disabled ? "opacity-40 pointer-events-none cursor-not-allowed" : ""}`;

            if (item.onClick) {
              return (
                <button
                  key={`${item.title}-${index}`}
                  type="button"
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={commonClasses}
                >
                  {content}
                </button>
              );
            }

            return (
              <a
                key={`${item.title}-${index}`}
                href={item.href || "#"}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                    return;
                  }
                  if (onNavigate && item.href) {
                    e.preventDefault();
                    onNavigate(item.href);
                  }
                }}
                className={commonClasses}
              >
                {content}
              </a>
            );
          })}
        </div>
      </nav>
    );
  }

  // Renderização Opção 2: Floating Dock Cápsula
  return (
    <FloatingDock
      items={items}
      desktopClassName="w-fit"
      dockAriaLabel={`Navegação principal do ${activeRole}`}
    />
  );
};

export default RoleAdaptiveNavDock;
