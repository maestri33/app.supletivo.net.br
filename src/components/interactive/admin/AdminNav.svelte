<script lang="ts">
  interface Props {
    active: "dashboard" | "documentos" | "credenciais-siga" | "taxa-parceira" | "provas" | "diplomas";
  }

  let { active }: Props = $props();

  const ITEMS = [
    { key: "dashboard", label: "Painel", href: "/admin/dashboard" },
    { key: "documentos", label: "Documentos", href: "/admin/documentos" },
    { key: "credenciais-siga", label: "Credenciais SIGA", href: "/admin/credenciais-siga" },
    { key: "taxa-parceira", label: "Taxa Parceira", href: "/admin/taxa-parceira" },
    { key: "provas", label: "Provas", href: "/admin/provas" },
    { key: "diplomas", label: "Diplomas", href: "/admin/diplomas" },
  ] as const;
</script>

<nav class="flex flex-wrap gap-2 pt-1 text-xs font-bold" aria-label="Navegação administrativa">
  {#each ITEMS as item}
    <a
      href={item.href}
      class={`min-h-9 inline-flex items-center rounded-lg px-3 py-1.5 transition ${
        active === item.key
          ? "bg-[var(--yellow)] text-[#0b1220]"
          : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      {item.label}
    </a>
  {/each}
</nav>
