"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

export type DockStatusIndicator =
  | "danger"      // 🔴 Sombra vermelha: deu problema / recusado / erro
  | "warning"     // 🟠 Sombra laranja: em análise / aguardando
  | "disabled"    // ⚪ Fosco: indisponível / travado
  | "success"     // 🟢 Sombra verde: aprovado / concluído
  | "normal";     // 🔘 Normal: padrão / sem nada

/**
 * Contrato genérico de item do FloatingDock.
 * Suporta navegação (href), ações interativas (onClick), badges de estado,
 * verificação de rota ativa, indicador de situação (statusIndicator) e acessibilidade.
 */
export interface FloatingDockItem {
  id?: string;
  title: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  statusIndicator?: DockStatusIndicator;
  badge?: string | number | null;
  badgeVariant?: "danger" | "success" | "warning" | "info";
  disabled?: boolean;
  "aria-label"?: string;
}

export function getStatusIndicatorClasses(
  indicator?: DockStatusIndicator,
  disabled?: boolean
): string {
  if (disabled || indicator === "disabled") {
    return "opacity-35 grayscale contrast-75 cursor-not-allowed pointer-events-none border-dashed border-neutral-400 dark:border-neutral-600";
  }
  switch (indicator) {
    case "danger":
      return "ring-2 ring-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.7)] border-rose-500 text-rose-500 dark:shadow-[0_0_22px_rgba(244,63,94,0.8)]";
    case "warning":
      return "ring-2 ring-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.7)] border-amber-500 text-amber-500 dark:shadow-[0_0_22px_rgba(245,158,11,0.8)]";
    case "success":
      return "ring-2 ring-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.7)] border-emerald-500 text-emerald-500 dark:shadow-[0_0_22px_rgba(16,185,129,0.8)]";
    case "normal":
    default:
      return "";
  }
}

export interface FloatingDockProps {
  items: FloatingDockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
  dockAriaLabel?: string;
  className?: string;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  items,
  desktopClassName,
  mobileClassName,
  dockAriaLabel = "Navegação rápida",
  className,
}) => {
  return (
    <nav
      aria-label={dockAriaLabel}
      data-testid="role-adaptive-dock"
      className={cn("fixed bottom-6 inset-x-0 z-50 flex justify-center items-center pointer-events-none", className)}
    >
      <div className="pointer-events-auto">
        <FloatingDockDesktop items={items} className={desktopClassName} />
        <FloatingDockMobile items={items} className={mobileClassName} />
      </div>
    </nav>
  );
};

const FloatingDockMobile: React.FC<{
  items: FloatingDockItem[];
  className?: string;
}> = ({ items, className }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="dock-mobile-menu"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            className="absolute inset-x-0 bottom-full mb-3 flex flex-col gap-2.5 items-center z-50"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.id ?? item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: { delay: idx * 0.03 },
                }}
                transition={{ delay: (items.length - 1 - idx) * 0.03 }}
              >
                <DockButtonOrLink
                  item={item}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-200 relative",
                    "shadow-lg",
                    item.isActive
                      ? "bg-[var(--yellow)] text-[var(--ink)] border-[var(--ink)] ring-2 ring-[var(--yellow)]/50"
                      : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line-light)] hover:bg-[var(--paper-soft)] dark:bg-[var(--ink-soft)] dark:text-[var(--paper)] dark:border-white/10",
                    getStatusIndicatorClasses(item.statusIndicator, item.disabled)
                  )}
                  onItemClick={() => setOpen(false)}
                >
                  <div className="h-5 w-5 flex items-center justify-center">
                    {item.icon}
                  </div>
                  {item.badge !== undefined && item.badge !== null && (
                    <span
                      className={cn(
                        "absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                        item.badgeVariant === "danger" && "bg-[var(--danger)] text-white",
                        item.badgeVariant === "warning" && "bg-[var(--warning)] text-white",
                        item.badgeVariant === "success" && "bg-[var(--success)] text-white",
                        (!item.badgeVariant || item.badgeVariant === "info") && "bg-[var(--blue)] text-white"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </DockButtonOrLink>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Abrir ou fechar menu de navegação flutuante"
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full border shadow-xl transition-all duration-200",
          open
            ? "bg-[var(--ink)] text-[var(--yellow)] border-[var(--ink)] dark:bg-[var(--paper)] dark:text-[var(--ink)]"
            : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line-light)] active:scale-95 dark:bg-[var(--ink)] dark:text-[var(--paper)] dark:border-white/10"
        )}
      >
        <IconLayoutNavbarCollapse className="h-5 w-5 transition-transform duration-200" />
      </button>
    </div>
  );
};

const FloatingDockDesktop: React.FC<{
  items: FloatingDockItem[];
  className?: string;
}> = ({ items, className }) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden h-16 items-end gap-3 rounded-2xl px-4 pb-3 border backdrop-blur-md transition-shadow duration-300 md:flex",
        "bg-[var(--paper)]/90 border-[var(--line-light)] shadow-2xl",
        "dark:bg-[var(--ink)]/90 dark:border-white/10 dark:shadow-2xl",
        className
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.id ?? item.title} item={item} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  item,
}: {
  mouseX: MotionValue;
  item: FloatingDockItem;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [42, 74, 42]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [42, 74, 42]);

  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 36, 20]);
  const heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 36, 20]);

  const width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const widthIcon = useSpring(widthTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 });
  const heightIcon = useSpring(heightTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 });

  const [hovered, setHovered] = React.useState(false);

  return (
    <DockButtonOrLink item={item}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-full border transition-all duration-200 cursor-pointer",
          item.isActive
            ? "bg-[var(--yellow)] text-[var(--ink)] border-[var(--ink)] font-bold shadow-md ring-2 ring-[var(--yellow)]/60"
            : "bg-[var(--paper-soft)] border-[var(--line-light)] text-[var(--ink)] hover:border-[var(--blue)] dark:bg-[var(--ink-soft)] dark:border-white/10 dark:text-[var(--paper)]",
          getStatusIndicatorClasses(item.statusIndicator, item.disabled)
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="pointer-events-none absolute -top-9 left-1/2 w-fit rounded-md border border-[var(--line-light)] bg-[var(--paper)] px-2.5 py-1 text-xs font-semibold whitespace-pre text-[var(--ink)] shadow-lg dark:border-white/15 dark:bg-[var(--ink)] dark:text-white z-50"
            >
              {item.title}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center relative"
        >
          {item.icon}
        </motion.div>

        {item.badge !== undefined && item.badge !== null && (
          <span
            className={cn(
              "absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold z-20 shadow-sm",
              item.badgeVariant === "danger" && "bg-[var(--danger)] text-white",
              item.badgeVariant === "warning" && "bg-[var(--warning)] text-white",
              item.badgeVariant === "success" && "bg-[var(--success)] text-white",
              (!item.badgeVariant || item.badgeVariant === "info") && "bg-[var(--blue)] text-white"
            )}
          >
            {item.badge}
          </span>
        )}
      </motion.div>
    </DockButtonOrLink>
  );
}

/**
 * Renderizador Polimórfico:
 * Renderiza <a> se href existir; caso contrário, renderiza <button>.
 */
const DockButtonOrLink: React.FC<{
  item: FloatingDockItem;
  className?: string;
  children: React.ReactNode;
  onItemClick?: () => void;
}> = ({ item, className, children, onItemClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    if (item.onClick) {
      item.onClick();
    }
    if (onItemClick) {
      onItemClick();
    }
  };

  const label = item["aria-label"] ?? item.title;

  if (item.href) {
    return (
      <a
        href={item.href}
        className={className}
        aria-label={label}
        aria-current={item.isActive ? "page" : undefined}
        onClick={handleClick}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      disabled={item.disabled}
      aria-label={label}
      aria-pressed={item.isActive}
    >
      {children}
    </button>
  );
};