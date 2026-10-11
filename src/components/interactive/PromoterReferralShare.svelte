<script lang="ts">
  let { url }: { url: string } = $props();
  let notice = $state("");
  let error = $state("");
  async function copy(forInstagram = false) {
    notice = ""; error = "";
    try { await navigator.clipboard.writeText(url); notice = forInstagram ? "Link copiado. Cole na bio ou no adesivo de link dos seus stories no Instagram." : "Link copiado."; }
    catch { error = "Não foi possível copiar. Selecione e copie o link exibido acima."; }
  }
  async function share() {
    notice = ""; error = "";
    if (!navigator.share) { await copy(); return; }
    try { await navigator.share({ title: "Supletivo Brasil", text: "Conheça o Supletivo Brasil pelo meu link de indicação.", url }); }
    catch (cause) { if (!(cause instanceof Error && cause.name === "AbortError")) error = "Não foi possível abrir o compartilhamento. Copie o link e envie pelo aplicativo escolhido."; }
  }
</script>

<div class="referral-share" aria-label="Compartilhar link de indicação">
  <div class="actions">
    <button type="button" class="btn" disabled={!url} onclick={() => copy()}>Copiar link</button>
    <a class="share-action" href={`https://wa.me/?text=${encodeURIComponent(`Conheça o Supletivo Brasil pelo meu link: ${url}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
    <a class="share-action" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
    <button type="button" class="share-action" disabled={!url} onclick={() => copy(true)}>Instagram</button>
    <button type="button" class="share-action" disabled={!url} onclick={share}>Outros aplicativos</button>
  </div>
  {#if notice}<p class="notice" role="status">{notice}</p>{/if}
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</div>

<style>
  .actions { display: flex; flex-wrap: wrap; gap: .75rem; } .btn, .share-action { min-height: var(--input-height); display: inline-flex; align-items: center; justify-content: center; padding: .75rem 1rem; font: inherit; cursor: pointer; }
  .share-action { border: 1px solid var(--glass-border-dark); border-radius: var(--input-radius); background: var(--ink-soft); color: var(--paper); text-decoration: none; }
  .notice, .error { margin-top: .75rem; padding: .75rem 1rem; border-radius: var(--input-radius); line-height: 1.6; } .notice { background: var(--info-bg); color: var(--info); } .error { background: var(--danger-bg); color: var(--danger); }
  :focus-visible { outline: 3px solid var(--yellow); outline-offset: 3px; } button:disabled { opacity: .6; cursor: default; }
</style>
