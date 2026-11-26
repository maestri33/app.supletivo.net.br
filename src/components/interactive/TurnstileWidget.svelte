<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  interface Props {
    onToken: (token: string) => void;
    onExpired?: () => void;
    onError?: () => void;
    resetKey?: number;
  }

  let { onToken, onExpired, onError, resetKey = 0 }: Props = $props();

  const SITE_KEY = String(import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();

  let container = $state<HTMLDivElement | null>(null);
  let widgetId = $state<string | null>(null);
  let fallbackMode = $state(false);
  let statusNote = $state("");

  type TurnstileGlobal = {
    render: (
      el: HTMLElement,
      options: {
        sitekey: string;
        theme?: "light" | "dark" | "auto";
        callback?: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
      },
    ) => string;
    reset: (id?: string) => void;
    remove: (id?: string) => void;
  };

  function readTestToken(): string {
    if (typeof window === "undefined") return "";
    const w = window as unknown as { __TEST_TURNSTILE_TOKEN__?: unknown };
    return typeof w.__TEST_TURNSTILE_TOKEN__ === "string" ? w.__TEST_TURNSTILE_TOKEN__.trim() : "";
  }

  function getTurnstile(): TurnstileGlobal | null {
    if (typeof window === "undefined") return null;
    const w = window as unknown as { turnstile?: TurnstileGlobal };
    return w.turnstile ?? null;
  }

  function loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (getTurnstile()) {
        resolve();
        return;
      }
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]',
      );
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("turnstile_load_failed")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("turnstile_load_failed"));
      document.head.appendChild(script);
    });
  }

  async function mountWidget() {
    const testToken = readTestToken();
    if (testToken) {
      fallbackMode = true;
      statusNote = "Verificação automatizada pronta.";
      onToken(testToken);
      return;
    }

    if (!SITE_KEY) {
      fallbackMode = true;
      statusNote = "Verificação anti-bot desativada neste ambiente.";
      onToken("");
      return;
    }

    if (!container) return;

    try {
      await loadScript();
      const ts = getTurnstile();
      if (!ts || !container) {
        throw new Error("turnstile_unavailable");
      }
      if (widgetId) {
        try {
          ts.remove(widgetId);
        } catch {
          // ignore cleanup failure
        }
        widgetId = null;
      }
      widgetId = ts.render(container, {
        sitekey: SITE_KEY,
        theme: "light",
        callback: (token: string) => {
          onToken(token);
        },
        "expired-callback": () => {
          onToken("");
          onExpired?.();
        },
        "error-callback": () => {
          onToken("");
          onError?.();
        },
      });
    } catch {
      fallbackMode = true;
      statusNote = "Não foi possível carregar o desafio de segurança. Recarregue a página se o envio falhar.";
      onError?.();
    }
  }

  onMount(() => {
    void mountWidget();
  });

  $effect(() => {
    const _key = resetKey;
    if (_key <= 0) return;
    const testToken = readTestToken();
    if (testToken) {
      onToken(testToken);
      return;
    }
    const ts = getTurnstile();
    if (ts && widgetId) {
      try {
        ts.reset(widgetId);
        onToken("");
      } catch {
        void mountWidget();
      }
    }
  });

  onDestroy(() => {
    const ts = getTurnstile();
    if (ts && widgetId) {
      try {
        ts.remove(widgetId);
      } catch {
        // ignore cleanup failure
      }
    }
  });
</script>

<div class="space-y-2">
  {#if !fallbackMode}
    <div bind:this={container} class="min-h-[66px]"></div>
  {:else if statusNote}
    <p class="rounded-lg border border-black/10 bg-[#f6f6f2] px-3 py-2 text-xs text-slate-600">
      {statusNote}
    </p>
  {/if}
</div>
