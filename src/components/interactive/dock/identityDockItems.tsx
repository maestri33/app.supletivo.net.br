import * as React from "react";
import { IconId, IconHome, IconSchool, IconCamera } from "@tabler/icons-react";
import type { FloatingDockItem } from "@/components/ui/floating-dock";
import type { ItemHealthStatus } from "./types";

type IdentityStep = "documents" | "address" | "education" | "selfie";
export function identityDockItems(options: {
  documentTitle: string;
  active: string;
  paths: Record<IdentityStep, string>;
  health: Partial<Record<IdentityStep, ItemHealthStatus>>;
  enabled?: Partial<Record<IdentityStep, boolean>>;
}): FloatingDockItem[] {
  const steps = [
    { id: "documents", title: options.documentTitle, icon: IconId },
    { id: "address", title: "Endereço", icon: IconHome },
    { id: "education", title: "Escolaridade", icon: IconSchool },
    { id: "selfie", title: "Selfie", icon: IconCamera },
  ] as const;
  return steps.map(({ id, title, icon: Icon }) => {
    const health = options.health[id];
    const disabled = options.enabled?.[id] === false;
    return {
      id, title, icon: <Icon className="h-full w-full" />,
      href: options.paths[id], disabled, isActive: options.active === id,
      badge: health === "approved" ? "OK" : health === "rejected" ? "!" : health === "under_review" ? "Análise" : undefined,
      badgeVariant: health === "approved" ? "success" : health === "rejected" ? "danger" : "warning",
      statusIndicator: disabled ? "disabled" : health === "approved" ? "success" : health === "rejected" ? "danger" : health === "under_review" ? "warning" : "normal",
    } satisfies FloatingDockItem;
  });
}
