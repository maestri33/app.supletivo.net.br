<script lang="ts">
  import { onMount } from "svelte";
  import { maskCep, isValidCep } from "@/lib/cep";
  import { onlyDigits } from "@/lib/phone";
  import { compressImage } from "@/lib/image-compression";

  const STEPS = [
    { key: "rg", label: "Documento" },
    { key: "address", label: "Endereço" },
    { key: "education", label: "Estudos" },
    { key: "selfie", label: "Selfie" },
  ] as const;

  let currentStep = $state(0);
  let busy = $state(false);
  let busyMsg = $state<string | null>(null);

  // Step 1: RG / CNH
  let rgFront = $state<string | null>(null);
  let rgBack = $state<string | null>(null);

  // Step 2: Endereço
  let cep = $state("");
  let street = $state("");
  let number = $state("");
  let complement = $state("");
  let neighborhood = $state("");
  let city = $state("");
  let uf = $state("");
  let cepLoading = $state(false);

  // Step 3: Estudos
  let educationStage = $state<"fundamental" | "medio">("fundamental");
  let lastGrade = $state("9º ano");
  let completionYear = $state("2015");

  // Step 4: Selfie
  let selfie = $state<string | null>(null);
  let videoEl = $state<HTMLVideoElement | null>(null);
  let stream = $state<MediaStream | null>(null);
  let cameraActive = $state(false);

  // Terminal screen
  let completed = $state(false);

  // Derived validation
  let isRgValid = $derived(rgFront !== null && rgBack !== null);
  let isAddressValid = $derived(
    isValidCep(cep) && street.trim().length > 0 && number.trim().length > 0 && city.trim().length > 0 && uf.trim().length > 0
  );
  let isEducationValid = $derived(lastGrade.length > 0 && completionYear.length === 4);
  let isSelfieValid = $derived(selfie !== null);

  async function handleFileUpload(field: "front" | "back", e: Event) {
    const input = e.target as HTMLInputElement;
    const rawFile = input.files?.[0];
    if (!rawFile) return;

    const file = await compressImage(rawFile);
    const reader = new FileReader();
    reader.onload = () => {
      if (field === "front") rgFront = reader.result as string;
      if (field === "back") rgBack = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function onCepInput(e: Event) {
    const target = e.target as HTMLInputElement;
    cep = maskCep(target.value);
    const raw = onlyDigits(cep);
    if (raw.length === 8) {
      cepLoading = true;
      try {
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await res.json();
        if (!data.erro) {
          street = data.logradouro || "";
          neighborhood = data.bairro || "";
          city = data.localidade || "";
          uf = data.uf || "";
        }
      } catch {
        // Fallback para preenchimento manual
      } finally {
        cepLoading = false;
      }
    }
  }

  async function startCamera() {
    try {
      cameraActive = true;
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoEl) {
        videoEl.srcObject = stream;
        videoEl.play();
      }
    } catch {
      cameraActive = false;
      alert("Não foi possível acessar a câmera. Por favor, permita o acesso ou faça upload.");
    }
  }

  function captureSelfie() {
    if (!videoEl) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth || 640;
    canvas.height = videoEl.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      selfie = canvas.toDataURL("image/jpeg", 0.85);
      stopCamera();
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    cameraActive = false;
  }

  function advanceStep() {
    if (currentStep < 3) {
      busy = true;
      busyMsg = "Salvando informações…";
      setTimeout(() => {
        busy = false;
        busyMsg = null;
        currentStep += 1;
      }, 400);
    } else {
      // Finalizar matrícula
      busy = true;
      busyMsg = "Emitindo prontuário acadêmico…";
      setTimeout(() => {
        busy = false;
        busyMsg = null;
        completed = true;
      }, 900);
    }
  }

  function previousStep() {
    if (currentStep > 0) {
      stopCamera();
      currentStep -= 1;
    }
  }

  onMount(() => {
    return () => {
      stopCamera();
    };
  });
</script>

<div class="flex flex-1 flex-col px-4 py-3 sm:px-6">
  <!-- Loading Overlay -->
  {#if busy}
    <div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-ink/70 backdrop-blur-sm px-6 text-center">
      <div class="size-10 animate-spin rounded-full border-4 border-brand-green border-t-transparent mb-4"></div>
      <p class="text-sm font-semibold text-white">{busyMsg}</p>
    </div>
  {/if}

  {#if completed}
    <main id="conteudo" class="m-auto flex w-full max-w-[440px] flex-col items-center text-center gap-5">
      <div class="size-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
        <svg class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <div>
        <h1 class="text-2xl font-extrabold text-white">Matrícula em Processamento!</h1>
        <p class="mt-1 text-xs text-white/75">
          Recebemos seus documentos e sua identificação com sucesso.
        </p>
      </div>

      <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl">
        <h2 class="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Status Acadêmico</h2>
        <p class="text-xs text-white/80 leading-relaxed mb-4">
          Nossa secretaria escolar está validando sua documentação junto ao MEC. Você já pode acompanhar suas pendências documentais e provas no portal do aluno.
        </p>
        <div class="flex flex-col gap-2">
          <a
            href="/aluno"
            class="block w-full text-center rounded-xl bg-brand-green py-3 text-sm font-bold text-white transition hover:bg-brand-green-dark"
          >
            Acessar Prontuário do Aluno →
          </a>
          <a
            href="/provas"
            class="block w-full text-center rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Agendamento de Provas →
          </a>
        </div>
      </div>
    </main>
  {:else}
    <div class="m-auto flex w-full max-w-[460px] flex-col gap-5">
      <!-- Top Navigation & Stepper -->
      <div class="flex items-center justify-between">
        {#if currentStep > 0}
          <button
            onclick={previousStep}
            class="flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white"
          >
            ← Voltar
          </button>
        {:else}
          <span class="text-xs font-semibold text-white/40">Passo 1 de 4</span>
        {/if}

        <div class="flex gap-1.5">
          {#each STEPS as s, idx (s.key)}
            <div
              class="h-1.5 w-7 rounded-full transition-all {idx <= currentStep ? 'bg-brand-green' : 'bg-white/15'}"
            ></div>
          {/each}
        </div>
      </div>

      <div class="text-left">
        <h1 class="text-xl font-bold text-white">{STEPS[currentStep].label}</h1>
        <p class="mt-0.5 text-xs text-white/75">
          {#if currentStep === 0}Envie a foto da frente e do verso do seu RG ou CNH.{/if}
          {#if currentStep === 1}Informe seu CEP e endereço de residência.{/if}
          {#if currentStep === 2}Qual foi o último ano escolar que você concluiu?{/if}
          {#if currentStep === 3}Tire uma selfie nítida para confirmação de identidade.{/if}
        </p>
      </div>

      <!-- STEP 0: DOCUMENTO RG/CNH -->
      {#if currentStep === 0}
        <div class="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <!-- Frente -->
          <div class="flex flex-col gap-2">
            <span class="text-xs font-semibold text-white/90">Frente do Documento (com foto)</span>
            <label class="flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/20 p-4 text-center hover:border-brand-green">
              {#if rgFront}
                <img src={rgFront} alt="Frente do RG" class="max-h-28 rounded object-contain" />
                <span class="mt-2 text-[10px] text-emerald-400 font-semibold">✓ Imagem carregada (Clique para trocar)</span>
              {:else}
                <span class="text-xs font-bold text-white">Toque para anexar a Frente</span>
                <span class="text-[10px] text-white/50 mt-1">PNG, JPG ou PDF de até 10MB</span>
              {/if}
              <input type="file" accept="image/*" class="hidden" onchange={(e) => handleFileUpload("front", e)} />
            </label>
          </div>

          <!-- Verso -->
          <div class="flex flex-col gap-2">
            <span class="text-xs font-semibold text-white/90">Verso do Documento</span>
            <label class="flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/20 p-4 text-center hover:border-brand-green">
              {#if rgBack}
                <img src={rgBack} alt="Verso do RG" class="max-h-28 rounded object-contain" />
                <span class="mt-2 text-[10px] text-emerald-400 font-semibold">✓ Imagem carregada (Clique para trocar)</span>
              {:else}
                <span class="text-xs font-bold text-white">Toque para anexar o Verso</span>
                <span class="text-[10px] text-white/50 mt-1">PNG, JPG ou PDF de até 10MB</span>
              {/if}
              <input type="file" accept="image/*" class="hidden" onchange={(e) => handleFileUpload("back", e)} />
            </label>
          </div>

          <button
            onclick={advanceStep}
            disabled={!isRgValid}
            class="mt-2 w-full rounded-xl bg-brand-green py-3 text-sm font-bold text-white transition hover:bg-brand-green-dark disabled:opacity-40"
          >
            Avançar para Endereço →
          </button>
        </div>
      {/if}

      <!-- STEP 1: ENDEREÇO -->
      {#if currentStep === 1}
        <div class="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div>
            <label for="cep-input" class="block text-xs font-semibold text-white/90 mb-1">CEP</label>
            <div class="relative">
              <input
                id="cep-input"
                type="tel"
                inputmode="numeric"
                placeholder="00000-000"
                value={cep}
                oninput={onCepInput}
                class="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-brand-green focus:outline-none"
              />
              {#if cepLoading}
                <span class="absolute right-3 top-2.5 text-xs text-brand-green">Buscando…</span>
              {/if}
            </div>
          </div>

          <div>
            <label for="street-input" class="block text-xs font-semibold text-white/90 mb-1">Logradouro / Rua</label>
            <input
              id="street-input"
              type="text"
              bind:value={street}
              placeholder="Rua das Flores"
              class="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-brand-green focus:outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="number-input" class="block text-xs font-semibold text-white/90 mb-1">Número</label>
              <input
                id="number-input"
                type="text"
                bind:value={number}
                placeholder="123"
                class="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-brand-green focus:outline-none"
              />
            </div>
            <div>
              <label for="complement-input" class="block text-xs font-semibold text-white/90 mb-1">Complemento</label>
              <input
                id="complement-input"
                type="text"
                bind:value={complement}
                placeholder="Apto 4B"
                class="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-brand-green focus:outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="neighborhood-input" class="block text-xs font-semibold text-white/90 mb-1">Bairro</label>
              <input
                id="neighborhood-input"
                type="text"
                bind:value={neighborhood}
                placeholder="Centro"
                class="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-brand-green focus:outline-none"
              />
            </div>
            <div>
              <label for="city-input" class="block text-xs font-semibold text-white/90 mb-1">Cidade / UF</label>
              <input
                id="city-input"
                type="text"
                value={city && uf ? `${city} - ${uf}` : city}
                placeholder="São Paulo - SP"
                class="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-brand-green focus:outline-none"
              />
            </div>
          </div>

          <button
            onclick={advanceStep}
            disabled={!isAddressValid}
            class="mt-2 w-full rounded-xl bg-brand-green py-3 text-sm font-bold text-white transition hover:bg-brand-green-dark disabled:opacity-40"
          >
            Avançar para Estudos →
          </button>
        </div>
      {/if}

      <!-- STEP 2: ESTUDOS -->
      {#if currentStep === 2}
        <div class="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div>
            <span class="block text-xs font-semibold text-white/90 mb-2">Última etapa escolar cursada</span>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                onclick={() => { educationStage = "fundamental"; lastGrade = "9º ano"; }}
                class="rounded-xl border p-3 text-xs font-bold transition {educationStage === 'fundamental' ? 'border-brand-green bg-brand-green/20 text-white' : 'border-white/15 bg-black/30 text-white/70'}"
              >
                Ensino Fundamental
              </button>
              <button
                type="button"
                onclick={() => { educationStage = "medio"; lastGrade = "1º ano"; }}
                class="rounded-xl border p-3 text-xs font-bold transition {educationStage === 'medio' ? 'border-brand-green bg-brand-green/20 text-white' : 'border-white/15 bg-black/30 text-white/70'}"
              >
                Ensino Médio
              </button>
            </div>
          </div>

          <div>
            <label for="grade-select" class="block text-xs font-semibold text-white/90 mb-1">Última série concluída</label>
            <select
              id="grade-select"
              bind:value={lastGrade}
              class="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-brand-green focus:outline-none"
            >
              {#if educationStage === "fundamental"}
                <option value="5º ano">5º ano / 4ª série</option>
                <option value="6º ano">6º ano / 5ª série</option>
                <option value="7º ano">7º ano / 6ª série</option>
                <option value="8º ano">8º ano / 7ª série</option>
                <option value="9º ano">9º ano / 8ª série</option>
              {:else}
                <option value="1º ano">1º ano do Ensino Médio</option>
                <option value="2º ano">2º ano do Ensino Médio</option>
                <option value="3º ano">3º ano incompleto</option>
              {/if}
            </select>
          </div>

          <div>
            <label for="year-input" class="block text-xs font-semibold text-white/90 mb-1">Ano aproximado de conclusão</label>
            <input
              id="year-input"
              type="number"
              bind:value={completionYear}
              placeholder="Ex: 2015"
              class="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-brand-green focus:outline-none"
            />
          </div>

          <button
            onclick={advanceStep}
            disabled={!isEducationValid}
            class="mt-2 w-full rounded-xl bg-brand-green py-3 text-sm font-bold text-white transition hover:bg-brand-green-dark disabled:opacity-40"
          >
            Avançar para Selfie →
          </button>
        </div>
      {/if}

      <!-- STEP 3: SELFIE BIOMÉTRICA -->
      {#if currentStep === 3}
        <div class="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl">
          {#if selfie}
            <div class="relative size-44 overflow-hidden rounded-full border-4 border-emerald-400 shadow-xl">
              <img src={selfie} alt="Selfie capturada" class="size-full object-cover" />
            </div>
            <p class="text-xs text-emerald-400 font-bold">✓ Prova de vida capturada</p>
            <button
              onclick={() => { selfie = null; startCamera(); }}
              class="text-xs text-white/70 underline hover:text-white"
            >
              Tirar outra foto
            </button>
          {:else if cameraActive}
            <div class="relative size-48 overflow-hidden rounded-full border-4 border-white/30 bg-black">
              <video
                bind:this={videoEl}
                autoplay
                playsinline
                muted
                class="size-full object-cover"
              ></video>
            </div>
            <button
              onclick={captureSelfie}
              class="w-full rounded-xl bg-brand-green py-3 text-sm font-bold text-white transition hover:bg-brand-green-dark"
            >
              Capturar Foto Agora
            </button>
          {:else}
            <div class="size-36 rounded-full border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/60">
              <svg class="size-10 text-white/40 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span class="text-[10px]">Câmera do Dispositivo</span>
            </div>

            <button
              onclick={startCamera}
              class="w-full rounded-xl bg-white/10 py-3 text-sm font-bold text-white border border-white/20 transition hover:bg-white/20"
            >
              Abrir Câmera para Selfie
            </button>
          {/if}

          <button
            onclick={advanceStep}
            disabled={!isSelfieValid}
            class="mt-2 w-full rounded-xl bg-brand-green py-3.5 text-sm font-bold text-white transition hover:bg-brand-green-dark disabled:opacity-40"
          >
            Concluir Matrícula →
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
