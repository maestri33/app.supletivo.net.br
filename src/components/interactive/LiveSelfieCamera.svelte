<script lang="ts">
  import { onMount, tick } from "svelte";
  import { bounded, stopTracks, waitForCameraFrame } from "@/lib/camera-session";
  import ErrorDialog from "@/components/ui/ErrorDialog.svelte";

  let { disabled = false, onCapture }: { disabled?: boolean; onCapture: (file: File) => Promise<void> } = $props();
  let video = $state<HTMLVideoElement>();
  let stream = $state<MediaStream | null>(null);
  let opening = $state(false);
  let capturing = $state(false);
  let error = $state("");
  let mounted = false;
  let operation: AbortController | undefined;
  let ready = $state(false);
  let fileInput = $state<HTMLInputElement>();
  let uploadingFile = $state(false);

  async function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    uploadingFile = true;
    error = "";
    try {
      await onCapture(file);
    } catch {
      error = "Não foi possível enviar a foto. Tente novamente.";
    } finally {
      uploadingFile = false;
      if (input) input.value = "";
    }
  }

  function stopCamera() {
    operation?.abort(); operation = undefined;
    opening = false; ready = false;
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    if (video) video.srcObject = null;
  }

  async function openCamera() {
    if (disabled || opening || stream) return;
    error = ""; opening = true;
    const current = new AbortController(); operation = current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("CAMERA_UNAVAILABLE");
      const opened = await bounded(navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 720 } } }), current.signal, 15000, stopTracks);
      if (!mounted || disabled || current.signal.aborted) { stopTracks(opened); return; }
      stream = opened;
      await tick();
      if (current.signal.aborted) return;
      if (!video) throw new Error("CAMERA_UNAVAILABLE");
      video.srcObject = opened;
      await bounded(video.play(), current.signal, 8000);
      await waitForCameraFrame(video, current.signal);
      if (current.signal.aborted) return;
      ready = true;
      opened.getVideoTracks().forEach(track => track.addEventListener("ended", () => {
        if (operation !== current) return;
        stopCamera(); error = "A câmera foi desconectada. Conecte-a e tente novamente.";
      }, { once: true }));
    } catch (cause) {
      if (operation !== current || current.signal.aborted) return;
      stopCamera();
      const name = cause instanceof DOMException ? cause.name : "";
      error = name === "TimeoutError"
        ? "A câmera não respondeu. Confira a permissão no navegador e tente novamente. Se estiver em um navegador dentro de outro app, abra app.supletivo.net.br no Chrome ou Safari."
        : name === "NotReadableError"
          ? "A câmera está ocupada ou indisponível. Feche outros apps que usam a câmera e tente novamente."
        : name === "NotAllowedError" || name === "SecurityError"
        ? "Autorize a câmera no navegador para tirar sua selfie."
        : name === "NotFoundError"
          ? "Não encontramos uma câmera. Abra o app em um celular com câmera."
          : "Não foi possível abrir a câmera. Confira a permissão e tente novamente.";
    } finally { if (operation === current) opening = false; }
  }

  async function capture() {
    if (disabled || capturing || !ready || !video || !stream || !operation) return;
    const current = operation;
    if (!video.videoWidth || !video.videoHeight) { error = "Aguarde a câmera ficar pronta."; return; }
    capturing = true; error = "";
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("CAMERA_CAPTURE_UNAVAILABLE");
      context.drawImage(video, 0, 0);
      const photo = await bounded(new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("CAMERA_CAPTURE_FAILED")), "image/jpeg", 0.92)), current.signal, 8000);
      if (!mounted || disabled || current.signal.aborted) return;
      stopCamera();
      await onCapture(new File([photo], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" }));
    } catch { if (!current.signal.aborted) { stopCamera(); error = "Não foi possível capturar a foto. Abra a câmera e tente novamente."; } }
    finally { capturing = false; }
  }

  onMount(() => { mounted = true; return () => { mounted = false; stopCamera(); }; });
  $effect(() => { if (disabled) stopCamera(); });
</script>

<div class="live-selfie-camera" aria-busy={opening || capturing}>
  <p>Tire sua selfie agora, olhando de frente para a câmera e com boa iluminação.</p>
  {#if stream}
    <!-- svelte-ignore a11y_media_has_caption (silent live camera preview) -->
    <video bind:this={video} autoplay muted playsinline aria-label="Prévia da câmera para selfie"></video>
    <button type="button" class="btn" disabled={disabled || capturing || !ready} onclick={capture}>{capturing ? "Capturando…" : opening ? "Preparando câmera…" : "Fotografar e enviar selfie"}</button>
    <button type="button" class="secondary" onclick={stopCamera} disabled={capturing}>Fechar câmera</button>
  {:else}
    <div class="flex flex-col gap-2.5">
      <button type="button" class="btn" disabled={disabled || opening || capturing || uploadingFile} onclick={openCamera}>
        {opening ? "Abrindo câmera…" : "Abrir câmera para selfie"}
      </button>

      <div class="relative flex py-1 items-center">
        <div class="flex-grow border-t border-white/10"></div>
        <span class="flex-shrink mx-3 text-[11px] text-white/50 uppercase tracking-wider font-semibold">ou alternativa</span>
        <div class="flex-grow border-t border-white/10"></div>
      </div>

      <label class="flex items-center justify-center gap-2.5 min-h-[48px] px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition active:scale-[0.98]">
        <svg class="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span>{uploadingFile ? "Enviando foto..." : "Tirar foto no celular ou enviar da galeria"}</span>
        <input
          bind:this={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          class="hidden"
          onchange={handleFileInput}
          disabled={disabled || opening || capturing || uploadingFile}
        />
      </label>
    </div>
  {/if}
  {#if opening}
    <p role="status">Autorize o uso da câmera quando o navegador pedir. A imagem só será enviada ao tocar em fotografar.</p>
    <button type="button" class="secondary" onclick={stopCamera}>Cancelar abertura</button>
  {/if}
  {#if error}
    <p class="camera-error" role="alert">{error}</p>
    <ErrorDialog
      isOpen={Boolean(error)}
      error={error}
      primaryAction={{
        label: "Tentar Novamente",
        action: () => {
          error = "";
          if (!stream) void openCamera();
        }
      }}
      secondaryAction={{
        label: "Enviar Foto da Galeria",
        action: () => {
          error = "";
          fileInput?.click();
        }
      }}
      onClose={() => { error = ""; }}
    />
  {/if}
</div>

<style>
  .live-selfie-camera { display: grid; gap: 1rem; }
  video { width: 100%; max-height: 28rem; object-fit: contain; background: var(--ink); border-radius: var(--input-radius); }
  button { min-height: var(--input-height); padding: .75rem 1.25rem; cursor: pointer; font: inherit; }
  .secondary { color: var(--paper); background: var(--ink-soft); border: 1px solid var(--glass-border-dark); border-radius: var(--input-radius); }
  button:disabled { opacity: .6; cursor: not-allowed; }
  button:focus-visible { outline: 2px solid var(--yellow); outline-offset: 3px; }
  .camera-error { color: var(--danger); background: var(--danger-bg); padding: 1rem; border-radius: var(--input-radius); }
</style>
