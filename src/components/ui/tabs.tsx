"use client";

import React, { useState, useRef, useId, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface TabItem {
  title: string;
  value: string;
  content?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string;
}

export type Tab = TabItem;

export interface TabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  onTabChange?: (tab: TabItem) => void;
  containerClassName?: string;
  tablistWrapperClassName?: string;
  tablistClassName?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  contentClassName?: string;
  ariaLabel?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultValue,
  value: controlledValue,
  onChange,
  onTabChange,
  containerClassName,
  tablistWrapperClassName,
  tablistClassName,
  tabClassName,
  activeTabClassName,
  contentClassName,
  ariaLabel = "Navegação por abas de conteúdo",
}) => {
  const baseId = useId();
  const shouldReduceMotion = useReducedMotion();

  const [internalValue, setInternalValue] = useState<string>(
    () => defaultValue || tabs?.[0]?.value || ""
  );

  const activeValue = controlledValue !== undefined ? controlledValue : internalValue;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!tabs || tabs.length === 0) return;
    // Garante que a aba ativa existe na lista atual de abas
    if (!tabs.some((t) => t.value === activeValue)) {
      const fallback = tabs[0]?.value || "";
      setInternalValue(fallback);
      onChange?.(fallback);
    }
  }, [tabs, activeValue, onChange]);

  // Defensiva contra array vazio
  if (!tabs || tabs.length === 0) {
    return null;
  }

  const handleSelectTab = (tab: TabItem) => {
    if (tab.value === activeValue) return;
    if (controlledValue === undefined) {
      setInternalValue(tab.value);
    }
    onChange?.(tab.value);
    onTabChange?.(tab);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let targetIndex = -1;

    switch (e.key) {
      case "ArrowRight":
        targetIndex = (currentIndex + 1) % tabs.length;
        break;
      case "ArrowLeft":
        targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        targetIndex = 0;
        break;
      case "End":
        targetIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    const nextTab = tabs[targetIndex];
    if (nextTab) {
      handleSelectTab(nextTab);
      tabRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div className={cn("w-full flex flex-col items-center", containerClassName)}>
      {/* Barra de Abas na Parte Superior (WAI-ARIA Tablist) */}
      <div className={cn("w-full flex justify-center", tablistWrapperClassName)}>
        <div
          role="tablist"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        className={cn(
          "relative flex flex-row items-center justify-start sm:justify-center p-1.5 rounded-full",
          "bg-[rgba(11,18,32,0.7)] backdrop-blur-md border border-white/10 shadow-[var(--shadow-glass)]",
          "overflow-x-auto no-visible-scrollbar max-w-full touch-pan-x gap-1",
          tablistClassName
        )}
        style={{
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {tabs.map((tab, idx) => {
          const isActive = tab.value === activeValue;
          const tabId = `${baseId}-tab-${tab.value}`;
          const panelId = `${baseId}-panel-${tab.value}`;

          return (
            <button
              key={tab.value}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleSelectTab(tab)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={cn(
                "relative z-10 px-4 sm:px-5 py-2.5 min-h-[48px] rounded-full inline-flex items-center justify-center gap-2",
                "font-sans text-xs sm:text-sm font-semibold tracking-wide transition-colors duration-200 select-none cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]",
                isActive
                  ? "text-white"
                  : "text-[var(--muted-on-dark)] hover:text-white",
                tabClassName
              )}
              style={{
                touchAction: "manipulation",
              }}
            >
              {/* Indicador Ativo com Física Antigravity e Kill-Switch de Movimento */}
              {isActive && (
                <motion.div
                  layoutId={shouldReduceMotion ? undefined : `${baseId}-active-tab-indicator`}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: "spring", bounce: 0.18, duration: 0.45 }
                  }
                  className={cn(
                    "absolute inset-0 rounded-full bg-[var(--blue)] shadow-[0_8px_20px_-4px_rgba(0,39,118,0.6)] border border-white/20",
                    activeTabClassName
                  )}
                  style={{ zIndex: -1 }}
                />
              )}

              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span className="relative z-10 whitespace-nowrap">{tab.title}</span>

              {tab.badge && (
                <span
                  className={cn(
                    "ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full",
                    isActive
                      ? "bg-[var(--yellow)] text-[var(--ink)]"
                      : "bg-white/10 text-white/80"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      </div>

      {/* Painéis com Isolamento de Foco e Acessibilidade WCAG */}
      <div className={cn("relative w-full mt-6", contentClassName)}>
        {tabs.map((tab) => {
          const isActive = tab.value === activeValue;
          const tabId = `${baseId}-tab-${tab.value}`;
          const panelId = `${baseId}-panel-${tab.value}`;

          return (
            <div
              key={tab.value}
              id={panelId}
              role="tabpanel"
              aria-labelledby={tabId}
              tabIndex={0}
              hidden={!isActive}
              inert={!isActive}
              className={cn(
                "w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] rounded-3xl",
                !isActive && "hidden"
              )}
            >
              {isActive && (
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: 0.28, ease: [0.16, 1, 0.3, 1] }
                  }
                  className="w-full"
                >
                  {tab.content}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
