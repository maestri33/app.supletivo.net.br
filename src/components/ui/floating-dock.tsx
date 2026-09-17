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

/**
 * Contrato genérico de item do FloatingDock.
 * Suporta navegação (href), ações interativas (onClick), badges de estado,
 * verificação de rota ativa e atributos de acessibilidade.
 */
export interface FloatingDockItem {
  id?: string;
  title: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  badge?: string | number | null;
  badgeVariant?: "danger" | "success" | "warning" | "info";
  disabled?: boolean;
  "aria-label"?: string;
}

export interface FloatingDockProps {
  items: FloatingDockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
  dockAriaLabel?: string;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  items,
  desktopClassName,
  mobileClassName,
  dockAriaLabel = "Navegação rápida",
}) => {
  return (
    <nav aria-label={dockAriaLabel} data-testid="role-adaptive-dock">
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
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
                    "shadow-[0_8px_20px_-6px_rgba(11,18,32,0.22)]",
                    item.isActive
                      ? "bg-[var(--yellow)] text-[var(--ink)] border-[var(--ink)] ring-2 ring-[var(--yellow)]/50"
                      : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line-light)] hover:bg-[var(--paper-soft)] dark:bg-[var(--ink-soft)] dark:text-[var(--paper)] dark:border-[rgba(255,255,255,0.12)]"
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
          "flex h-12 w-12 items-center justify-center rounded-full border shadow-[0_12px_28px_-6px_rgba(11,18,32,0.2)] transition-all duration-200",
          open
            ? "bg-[var(--ink)] text-[var(--yellow)] border-[var(--ink)] dark:bg-[var(--paper)] dark:text-[var(--ink)]"
            : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line-light)] active:scale-95 dark:bg-[var(--ink)] dark:text-[var(--paper)] dark:border-[rgba(255,255,255,0.12)]"
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
        "bg-[var(--paper)]/90 border-[var(--line-light)] shadow-[0_20px_45px_-15px_rgba(11,18,32,0.14)]",
        "dark:bg-[var(--ink)]/90 dark:border-[rgba(255,255,255,0.12)] dark:shadow-[0_20px_45px_-15px_rgba(0,0,0,0.45)]",
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
          "relative flex aspect-square items-center justify-center rounded-full border transition-colors duration-200 cursor-pointer",
          item.isActive
            ? "bg-[var(--yellow)] text-[var(--ink)] border-[var(--ink)] font-bold shadow-md ring-2 ring-[var(--yellow)]/60"
            : "bg-[var(--paper-soft)] border-[var(--line-light)] text-[var(--ink)] hover:border-[var(--blue)] dark:bg-[var(--ink-soft)] dark:border-[rgba(255,255,255,0.08)] dark:text-[var(--paper)]",
          item.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="pointer-events-none absolute -top-9 left-1/2 w-fit rounded-md border border-[var(--line-light)] bg-[var(--paper)] px-2.5 py-1 text-xs font-semibold whitespace-pre text-[var(--ink)] shadow-lg dark:border-[rgba(255,255,255,0.15)] dark:bg-[var(--ink)] dark:text-white z-50"
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