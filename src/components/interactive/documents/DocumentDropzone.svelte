<script lang="ts">
  interface Props {
    accept?: string;
    label?: string;
    description?: string;
    disabled?: boolean;
    loading?: boolean;
    error?: string | null;
    onSelectFile: (file: File) => void;
  }

  let {
    accept = "image/jpeg,image/png,application/pdf",
    label = "Enviar documento",
    description = "Arraste uma foto ou PDF, ou clique para escolher do dispositivo (máx. 10MB)",
    disabled = false,
    loading = false,
    error = null,
    onSelectFile,
  }: Props = $props();

  let isDragging = $state(false);
  let fileInput: HTMLInputElement | null = $state(null);

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (disabled || loading) return;
    isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    if (disabled || loading) return;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      onSelectFile(files[0]);
    }
  }

  function handleFileInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      onSelectFile(files[0]);
      target.value = "";
    }
  }

  function triggerSelect() {
    if (disabled || loading) return;
    fileInput?.click();
  }
</script>

<div
  role="region"
  aria-label={label}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  onclick={triggerSelect}
  onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); triggerSelect(); } }}
  tabindex={disabled || loading ? -1 : 0}
  class="relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer select-none text-center {isDragging ? 'border-yellow bg-yellow/10 scale-[1.01]' : error ? 'border-red-500/60 bg-red-950/20' : 'border-white/20 bg-white/[0.03] hover:border-white/40 hover:bg-white/[0.06]'} {disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}"
>
  <input
    bind:this={fileInput}
    type="file"
    {accept}
    onchange={handleFileInput}
    {disabled}
    class="hidden"
    aria-hidden="true"
  />

  <div class="size-12 rounded-full flex items-center justify-center mb-3 transition-transform duration-200 {isDragging ? 'scale-110 bg-yellow text-ink' : 'bg-white/10 text-white'}">
    {#if loading}
      <span class="inline-block size-5 border-2 border-white/30 border-t-yellow rounded-full animate-spin"></span>
    {:else}
      <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    {/if}
  </div>

  <span class="text-sm font-bold text-white mb-1">
    {label}
  </span>
  <p class="text-xs text-white/60 max-w-xs leading-relaxed">
    {description}
  </p>

  {#if error}
    <div class="mt-3 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-1.5">
      <span>⚠️</span>
      <span>{error}</span>
    </div>
  {/if}
</div>
