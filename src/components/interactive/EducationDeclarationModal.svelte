<script lang="ts">
  import { tick } from "svelte";
  type Role = "student" | "promoter";
  interface Props { role: Role; open: boolean; onConfirm: () => void; }
  let { role, open, onConfirm }: Props = $props();
  let accepted = $state(false);
  let checkbox: HTMLInputElement;
  let dialog: HTMLElement;
  let previousFocus: HTMLElement | null = null;
  const isStudent = $derived(role === "student");
  $effect(() => {
    if (open) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      accepted = false;
      void tick().then(() => checkbox?.focus());
    } else if (previousFocus) {
      previousFocus.focus();
      previousFocus = null;
    }
  });
  function confirm() { if (accepted) onConfirm(); }
  function keepFocus(event: KeyboardEvent) {
    if (event.key === "Escape") { event.preventDefault(); return; }
    if (event.key !== "Tab" || !dialog) return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>('button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.hasAttribute("disabled"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
</script>

{#if open}
  <div class="declaration-backdrop" role="presentation">
    <section bind:this={dialog} class="declaration-modal" role="dialog" aria-modal="true" aria-labelledby="education-declaration-title" aria-describedby="education-declaration-copy" onkeydown={keepFocus}>
      <div class="declaration-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3 4 7v5c0 5 3.3 8 8 9 4.7-1 8-4 8-9V7l-8-4Z" />
          <path d="m8.5 12 2.2 2.2 4.8-5" />
        </svg>
      </div>
      <p class="eyebrow">Declaração obrigatória</p>
      <h2 id="education-declaration-title">Confirme suas informações</h2>
      <p id="education-declaration-copy">
        {#if isStudent}
          Declaro que as informações escolares são verdadeiras. Sei que a instituição parceira usará esses dados na matrícula externa e que a documentação escolar será conferida depois; sem a documentação exigida, o início dos estudos ou a prova poderá ficar impedido.
        {:else}
          Declaro que as informações escolares e cadastrais são verdadeiras. Assumo a responsabilidade por elas no meu credenciamento de promotor e estou ciente de que a análise pode pedir comprovação.
        {/if}
      </p>
      <label class="declaration-check">
        <input bind:this={checkbox} type="checkbox" bind:checked={accepted} />
        <span>Li, entendi e confirmo que as informações são verdadeiras.</span>
      </label>
      <button class="btn declaration-submit" type="button" disabled={!accepted} onclick={confirm}>Confirmar e continuar</button>
      <p class="declaration-hint">Você poderá corrigir os dados antes de confirmar.</p>
    </section>
  </div>
{/if}

<style>
  .declaration-backdrop { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 1rem; background: color-mix(in srgb, var(--ink) 86%, transparent); backdrop-filter: blur(14px); }
  .declaration-modal { width: min(100%, 34rem); max-height: min(92dvh, 48rem); overflow: auto; padding: clamp(1.25rem, 4vw, 2rem); border: 1px solid var(--line-light); border-radius: var(--radius-lg); background: var(--paper); color: var(--ink); box-shadow: var(--shadow-zero-g); display: grid; gap: 1rem; animation: declaration-in .2s ease-out both; }
  .declaration-icon { width: 3.25rem; height: 3.25rem; display: grid; place-items: center; border-radius: 50%; background: var(--info-bg); color: var(--blue); }
  .declaration-icon svg { width: 1.75rem; height: 1.75rem; }
  .eyebrow { margin: 0; color: var(--blue); font-size: .75rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  h2 { margin: 0; font: 400 var(--text-h3)/1.2 var(--font-display); }
  p { margin: 0; line-height: 1.6; }
  #education-declaration-copy { color: var(--muted-on-light); }
  .declaration-check { display: flex; align-items: flex-start; gap: .75rem; min-height: var(--input-height); padding: .75rem; border: 1px solid var(--line-light); border-radius: var(--input-radius); font-weight: 700; line-height: 1.45; cursor: pointer; }
  .declaration-check input { width: 1.25rem; height: 1.25rem; margin-top: .1rem; accent-color: var(--green); flex: 0 0 auto; }
  .declaration-submit { width: 100%; min-height: var(--input-height); }
  .declaration-submit:disabled { opacity: .5; cursor: not-allowed; }
  .declaration-hint { color: var(--muted-on-light); font-size: .8rem; text-align: center; }
  button:focus-visible, input:focus-visible { outline: 2px solid var(--blue); outline-offset: 3px; }
  @keyframes declaration-in { from { opacity: 0; transform: translateY(.5rem) scale(.99); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce), (hover: none) { .declaration-modal { animation: none; } }
</style>
