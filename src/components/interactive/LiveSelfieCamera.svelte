<script lang="ts">
  import { onMount, tick } from "svelte";

  let { disabled = false, onCapture }: { disabled?: boolean; onCapture: (file: File) => Promise<void> } = $props();
  let video = $state<HTMLVideoElement>();
  let stream = $state<MediaStream | null>(null);
  let opening = $state(false);
  let capturing = $state(false);
  let error = $state("");
  let mounted = false;

  function stopCamera() {
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    if (video) video.srcObject = null;
  }

  async function openCamera() {
    if (disabled || opening || stream) return;
    error = ""; opening = true;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("CAMERA_UNAVAILABLE");
      const opened = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } });
      if (!mounted || disabled) { opened.getTracks().forEach(track => track.stop()); return; }
      stream = opened;
      await tick();
      if (video && stream) { video.srcObject = stream; await video.play(); }
    } catch (cause) {
      stopCamera();
      const name = cause instanceof DOMException ? cause.name : "";
      error = name === "NotAllowedError"
        ? "Autorize a câmera no navegador para tirar sua selfie."
        : name === "NotFoundError"
          ? "Não encontramos uma câmera. Abra o app em um celular com câmera."
          : "Não foi possível abrir a câmera. Confira a permissão e tente novamente.";
    } finally { opening = false; }
  }

  async function capture() {
    if (disabled || capturing || !video || !stream) return;
    if (!video.videoWidth || !video.videoHeight) { error = "Aguarde a câmera ficar pronta."; return; }
    capturing = true; error = "";
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("CAMERA_CAPTURE_UNAVAILABLE");
      context.drawImage(video, 0, 0);
      const photo = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("CAMERA_CAPTURE_FAILED")), "image/jpeg", 0.92));
      if (!mounted || disabled) return;
      stopCamera();
      await onCapture(new File([photo], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" }));
    } catch { error = "Não foi possível capturar a foto. Abra a câmera e tente novamente."; }
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
    <button type="button" class="btn" disabled={disabled || capturing} onclick={capture}>{capturing ? "Capturando…" : "Fotografar e enviar selfie"}</button>
    <button type="button" class="secondary" onclick={stopCamera} disabled={capturing}>Fechar câmera</button>
  {:else}
    <button type="button" class="btn" disabled={disabled || opening || capturing} onclick={openCamera}>{opening ? "Abrindo câmera…" : "Abrir câmera para selfie"}</button>
  {/if}
  {#if error}<p class="camera-error" role="alert">{error}</p>{/if}
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
