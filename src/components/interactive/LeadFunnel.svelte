<script lang="ts">
  import { onMount } from "svelte";
  import { isValidCpf, maskCpf } from "@/lib/cpf";
  import { maskBrPhone, onlyDigits } from "@/lib/phone";
  import { isEmailFormatValid, suggestEmail } from "@/lib/funnel/email-domains";
  import { MODALS, PRICING, ageFromIso, type ModalKind, type Screen } from "@/lib/funnel/flow-data";
  import { formatBRL } from "@/lib/money";
  import { setLeadSession } from "@/lib/funnel/lead-session";
  import { saveSession, getSession } from "@/lib/session";

  interface Props {
    initialScreen?: Screen;
  }

  let { initialScreen = "check" }: Props = $props();

  let screen = $state<Screen>("check");
  let dir = $state<"right" | "left">("right");

  // Inputs
  let phone = $state("");
  let otp = $state(["", "", "", "", "", ""]);
  let cpf = $state("");
  let email = $state("");
  let selectedPlan = $state<"medio" | "fundamental">("medio");
  let paymentMethod = $state<"pix" | "card">("pix");
  let modalKind = $state<ModalKind | null>(null);

  // States
  let busy = $state(false);
  let busyMsg = $state<string | null>(null);
  let otpCountdown = $state(30);
  let pixCopied = $state(false);

  // Student Identity Mock
  let studentName = $state("Maria Aparecida da Silva");
  let birthDate = $state("1979-03-12");

  // Deriveds
  let phoneDigits = $derived(onlyDigits(phone));
  let isPhoneComplete = $derived(phoneDigits.length === 11);
  let cpfDigits = $derived(onlyDigits(cpf));
  let isCpfValid = $derived(isValidCpf(cpf));
  let emailSuggestions = $derived(suggestEmail(email));
  let otpCode = $derived(otp.join(""));
  let isOtpComplete = $derived(otpCode.length === 6);
  let studentAge = $derived(ageFromIso(birthDate));

  function goTo(nextScreen: Screen, nextDir: "right" | "left" = "right") {
    dir = nextDir;
    screen = nextScreen;
    if (typeof window !== "undefined") {
      const url = nextScreen === "check" ? "/" : `/${nextScreen}`;
      if (window.location.pathname !== url) {
        window.history.pushState({}, "", url);
      }
    }
  }

  // Handle phone input with auto-advance
  function onPhoneInput(e: Event) {
    const target = e.target as HTMLInputElement;
    phone = maskBrPhone(target.value);
    if (onlyDigits(phone).length === 11) {
      busy = true;
      busyMsg = "Verificando seu número…";
      setTimeout(() => {
        busy = false;
        busyMsg = null;
        if (phone.endsWith("99")) {
          modalKind = "invalid";
        } else if (phone.endsWith("00")) {
          modalKind = "server";
        } else {
          goTo("login", "right");
          startOtpTimer();
        }
      }, 700);
    }
  }

  function startOtpTimer() {
    otpCountdown = 30;
    const interval = setInterval(() => {
      if (otpCountdown > 0) {
        otpCountdown -= 1;
      } else {
        clearInterval(interval);
      }
    }, 1000);
  }

  function onOtpInput(index: number, e: Event) {
    const target = e.target as HTMLInputElement;
    const val = target.value.slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = val;
    otp = nextOtp;

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null;
      nextInput?.focus();
    }

    if (nextOtp.every((d) => d !== "")) {
      busy = true;
      busyMsg = "Conferindo seu código…";
      setTimeout(() => {
        busy = false;
        busyMsg = null;
        if (nextOtp.join("") === "000000") {
          modalKind = "otp";
        } else {
          saveSession({ phone, externalId: "lead-mock-uuid" });
          setLeadSession({ loggedIn: true, name: studentName });
          goTo("cpf", "right");
        }
      }, 600);
    }
  }

  function onCpfInput(e: Event) {
    const target = e.target as HTMLInputElement;
    cpf = maskCpf(target.value);
  }

  function confirmCpf() {
    if (!isCpfValid) {
      modalKind = "cpfinvalid";
      return;
    }
    busy = true;
    busyMsg = "Confirmando seu CPF…";
    setTimeout(() => {
      busy = false;
      busyMsg = null;
      goTo("email", "right");
    }, 500);
  }

  function selectEmailDomain(domain: string) {
    const prefix = email.split("@")[0];
    email = `${prefix}@${domain}`;
  }

  function confirmEmail() {
    if (!isEmailFormatValid(email)) return;
    busy = true;
    busyMsg = "Verificando seu e-mail…";
    setTimeout(() => {
      busy = false;
      busyMsg = null;
      goTo("planos", "right");
    }, 500);
  }

  function confirmPlan() {
    goTo("checkout", "right");
  }

  function copyPix() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("00020126580014br.gov.bcb.pix0136supletivo-brasil-pix-mock52040000530398654041.005802BR5925SUPLETIVO BRASIL LTDA6009SAO PAULO62070503***6304E8A2");
      pixCopied = true;
      setTimeout(() => {
        pixCopied = false;
      }, 3000);
    }
  }

  function simulatePaymentSuccess() {
    busy = true;
    busyMsg = "Confirmando recebimento do pagamento…";
    setTimeout(() => {
      busy = false;
      busyMsg = null;
      goTo("painel", "right");
    }, 1000);
  }

  onMount(() => {
    if (initialScreen && initialScreen !== "check") {
      screen = initialScreen;
    }
    // Sincronizar caminho inicial se recarregado
    const path = window.location.pathname.replace(/^\//, "");
    if (path && ["login", "cpf", "email", "planos", "checkout", "painel"].includes(path)) {
      screen = path as Screen;
    }
    const sess = getSession();
    if (sess?.phone) {
      phone = sess.phone;
    }
  });
</script>

<div class="flex flex-1 flex-col {dir === 'left' ? 'step-in-left' : 'step-in-right'}">
  <!-- Loading Overlay -->
  {#if busy}
    <div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-ink/70 backdrop-blur-sm px-6 text-center">
      <div class="size-10 animate-spin rounded-full border-4 border-brand-green border-t-transparent mb-4"></div>
      <p class="text-sm font-semibold text-white">{busyMsg}</p>
    </div>
  {/if}

  <!-- Modal Global -->
  {#if modalKind && MODALS[modalKind]}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div class="w-full max-w-sm rounded-2xl border border-white/10 bg-brand-surface p-6 shadow-2xl">
        <h3 class="text-base font-bold text-white mb-2">{MODALS[modalKind].title}</h3>
        <p class="text-sm text-white/80 leading-relaxed mb-6">{MODALS[modalKind].body}</p>
        <button
          onclick={() => { modalKind = null; }}
          class="w-full rounded-xl bg-brand-green py-3 text-sm font-bold text-white transition hover:bg-brand-green-dark"
        >
          {MODALS[modalKind].btn}
        </button>
      </div>
    </div>
  {/if}

  <!-- TELA 1: CHECK (Início / WhatsApp) -->
  {#if screen === "check"}
    <main id="conteudo" class="flex flex-1 px-6 py-3">
      <div class="m-auto flex w-full max-w-[400px] flex-col items-center gap-6">
        <!-- Bandeira / Diploma decorativo -->
        <div class="w-48 diploma-flag" aria-hidden="true">
          <svg viewBox="0 0 540 360" fill="none">
            <rect width="540" height="360" rx="16" fill="var(--color-brand-green)" />
            <path d="M270 30L510 180L270 330L30 180Z" fill="var(--color-brand-yellow)" />
            <circle cx="270" cy="180" r="85" fill="var(--color-brand-blue)" />
          </svg>
        </div>

        <div class="text-center">
          <h1 class="text-2xl font-extrabold text-white tracking-tight">Conclua o Ensino Médio</h1>
          <p class="mt-1 text-xs font-semibold text-emerald-400">Válido para faculdade, concurso e emprego</p>
        </div>

        <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <label for="phone-input" class="block text-xs font-semibold text-white/90 mb-2">
            Digite seu WhatsApp para iniciar
          </label>
          <input
            id="phone-input"
            type="tel"
            inputmode="numeric"
            placeholder="(11) 90000-0000"
            value={phone}
            oninput={onPhoneInput}
            class="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3.5 text-center text-lg font-bold text-white placeholder:text-white/30 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
          />
          <p class="mt-3 text-center text-[11px] text-white/60">
            Avanço automático ao completar 11 dígitos.
          </p>
        </div>

        <!-- Badges de Confiança -->
        <div class="flex items-center justify-center gap-4 text-[11px] text-white/70">
          <span class="flex items-center gap-1">✓ MEC &amp; LDB</span>
          <span>·</span>
          <span class="flex items-center gap-1">✓ 100% Online</span>
          <span>·</span>
          <span class="flex items-center gap-1">✓ Início Imediato</span>
        </div>
      </div>
    </main>
  {/if}

  <!-- TELA 2: LOGIN (OTP) -->
  {#if screen === "login"}
    <main id="conteudo" class="flex flex-1 px-6 py-3">
      <div class="m-auto flex w-full max-w-[400px] flex-col items-center gap-6">
        <div class="text-center">
          <h1 class="text-xl font-bold text-white">Código de Confirmação</h1>
          <p class="mt-1 text-xs text-white/75">
            Enviamos um código de 6 dígitos no WhatsApp <strong>{phone}</strong>
          </p>
        </div>

        <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div class="flex justify-center gap-2 mb-4">
            {#each otp as digit, idx (idx)}
              <input
                id="otp-{idx}"
                type="text"
                inputmode="numeric"
                maxlength="1"
                value={digit}
                oninput={(e) => onOtpInput(idx, e)}
                class="size-12 rounded-lg border border-white/20 bg-black/40 text-center text-xl font-extrabold text-white focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              />
            {/each}
          </div>

          <div class="flex items-center justify-between text-xs text-white/70 pt-2 border-t border-white/10">
            <button
              onclick={() => goTo("check", "left")}
              class="underline hover:text-white"
            >
              Trocar número
            </button>
            <span>
              {otpCountdown > 0 ? `Reenviar em ${otpCountdown}s` : "Reenviar código"}
            </span>
          </div>
        </div>
      </div>
    </main>
  {/if}

  <!-- TELA 3: CPF -->
  {#if screen === "cpf"}
    <main id="conteudo" class="flex flex-1 px-6 py-3">
      <div class="m-auto flex w-full max-w-[400px] flex-col items-center gap-6">
        <div class="text-center">
          <h1 class="text-xl font-bold text-white">Identificação</h1>
          <p class="mt-1 text-xs text-white/75">Informe seu CPF para emissão da declaração de matrícula</p>
        </div>

        <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <label for="cpf-field" class="block text-xs font-semibold text-white/90 mb-2">CPF</label>
          <input
            id="cpf-field"
            type="tel"
            inputmode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            oninput={onCpfInput}
            class="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3.5 text-center text-lg font-bold text-white placeholder:text-white/30 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
          />

          {#if isCpfValid}
            <div class="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300">
              <p class="font-bold">{studentName}</p>
              <p class="text-white/70">{studentAge ? `${studentAge} anos` : "Data de nascimento confirmada"}</p>
            </div>
          {/if}

          <button
            onclick={confirmCpf}
            disabled={!isCpfValid}
            class="mt-6 w-full rounded-xl bg-brand-green py-3 text-sm font-bold text-white transition hover:bg-brand-green-dark disabled:opacity-40"
          >
            Continuar →
          </button>
        </div>
      </div>
    </main>
  {/if}

  <!-- TELA 4: EMAIL -->
  {#if screen === "email"}
    <main id="conteudo" class="flex flex-1 px-6 py-3">
      <div class="m-auto flex w-full max-w-[400px] flex-col items-center gap-6">
        <div class="text-center">
          <h1 class="text-xl font-bold text-white">Seu melhor e-mail</h1>
          <p class="mt-1 text-xs text-white/75">Você receberá o acesso ao ambiente do aluno por aqui</p>
        </div>

        <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <label for="email-field" class="block text-xs font-semibold text-white/90 mb-2">E-mail</label>
          <input
            id="email-field"
            type="email"
            placeholder="seu.nome@gmail.com"
            bind:value={email}
            class="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
          />

          <!-- Sugestões de Domínio -->
          {#if emailSuggestions && emailSuggestions.length > 0}
            <div class="mt-3 flex flex-wrap gap-1.5">
              {#each emailSuggestions as sug (sug)}
                <button
                  onclick={() => selectEmailDomain(sug.domain)}
                  class="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/10"
                >
                  @{sug.domain}
                </button>
              {/each}
            </div>
          {/if}

          <button
            onclick={confirmEmail}
            disabled={!isEmailFormatValid(email)}
            class="mt-6 w-full rounded-xl bg-brand-green py-3 text-sm font-bold text-white transition hover:bg-brand-green-dark disabled:opacity-40"
          >
            Ver planos disponíveis →
          </button>
        </div>
      </div>
    </main>
  {/if}

  <!-- TELA 5: PLANOS -->
  {#if screen === "planos"}
    <main id="conteudo" class="flex flex-1 px-6 py-3">
      <div class="m-auto flex w-full max-w-[420px] flex-col items-center gap-5">
        <div class="text-center">
          <h1 class="text-xl font-bold text-white">Escolha sua Modalidade</h1>
          <p class="mt-1 text-xs text-white/75">Certificado oficial reconhecido pelo MEC e Diário Oficial</p>
        </div>

        <div class="flex w-full flex-col gap-3">
          <!-- Card Ensino Médio -->
          <button
            type="button"
            onclick={() => { selectedPlan = "medio"; }}
            class="flex w-full flex-col rounded-2xl border p-4 text-left transition {selectedPlan === 'medio' ? 'border-brand-green bg-brand-green/10 shadow-lg ring-1 ring-brand-green' : 'border-white/10 bg-white/5 hover:border-white/25'}"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-white">Ensino Médio Completo</span>
              <span class="rounded-full bg-brand-green px-2 py-0.5 text-[10px] font-extrabold text-white uppercase tracking-wider">Mais Escolhido</span>
            </div>
            <p class="mt-1 text-xs text-white/70">Ideal para quem precisa do diploma para faculdade ou concurso.</p>
            <div class="mt-3 flex items-baseline gap-1 text-emerald-400">
              <span class="text-xs font-semibold">12x de</span>
              <span class="text-xl font-extrabold">{formatBRL(PRICING.card.installment)}</span>
              <span class="text-xs text-white/60">ou {formatBRL(PRICING.pix)} à vista</span>
            </div>
          </button>

          <!-- Card Ensino Fundamental -->
          <button
            type="button"
            onclick={() => { selectedPlan = "fundamental"; }}
            class="flex w-full flex-col rounded-2xl border p-4 text-left transition {selectedPlan === 'fundamental' ? 'border-brand-green bg-brand-green/10 shadow-lg ring-1 ring-brand-green' : 'border-white/10 bg-white/5 hover:border-white/25'}"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-white">Ensino Fundamental + Médio</span>
            </div>
            <p class="mt-1 text-xs text-white/70">Conclusão rápida do 6º ao 9º ano e Ensino Médio completo.</p>
            <div class="mt-3 flex items-baseline gap-1 text-emerald-400">
              <span class="text-xs font-semibold">12x de</span>
              <span class="text-xl font-extrabold">{formatBRL(PRICING.card.installment)}</span>
              <span class="text-xs text-white/60">ou {formatBRL(PRICING.pix)} à vista</span>
            </div>
          </button>
        </div>

        <button
          onclick={confirmPlan}
          class="w-full rounded-xl bg-brand-green py-3.5 text-sm font-bold text-white transition hover:bg-brand-green-dark"
        >
          Matricular no {selectedPlan === 'medio' ? 'Ensino Médio' : 'Fundamental + Médio'} →
        </button>
      </div>
    </main>
  {/if}

  <!-- TELA 6: CHECKOUT -->
  {#if screen === "checkout"}
    <main id="conteudo" class="flex flex-1 px-6 py-3">
      <div class="m-auto flex w-full max-w-[400px] flex-col items-center gap-5">
        <div class="text-center">
          <h1 class="text-xl font-bold text-white">Pagamento da Matrícula</h1>
          <p class="mt-1 text-xs text-white/75">Liberação imediata de acesso ao portal do aluno</p>
        </div>

        <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <!-- Toggle PIX / Cartão -->
          <div class="grid grid-cols-2 gap-2 rounded-xl bg-black/30 p-1 mb-5">
            <button
              type="button"
              onclick={() => { paymentMethod = "pix"; }}
              class="rounded-lg py-2 text-xs font-bold transition {paymentMethod === 'pix' ? 'bg-brand-green text-white shadow' : 'text-white/60 hover:text-white'}"
            >
              PIX (Instantâneo)
            </button>
            <button
              type="button"
              onclick={() => { paymentMethod = "card"; }}
              class="rounded-lg py-2 text-xs font-bold transition {paymentMethod === 'card' ? 'bg-brand-green text-white shadow' : 'text-white/60 hover:text-white'}"
            >
              Cartão de Crédito
            </button>
          </div>

          {#if paymentMethod === "pix"}
            <div class="flex flex-col items-center text-center">
              <div class="size-44 rounded-xl bg-white p-3 shadow-inner flex items-center justify-center">
                <!-- QR Code SVG ilustrativo -->
                <svg class="size-full text-black" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 10h10v10H40zM50 20h10v10H50zM40 40h20v20H40zM10 40h10v20H10zM70 40h10v20H70zM80 50h20v10H80zM40 70h10v10H40zM60 70h20v20H60zM40 90h10v10H40z" />
                </svg>
              </div>
              <p class="mt-3 text-xs font-bold text-white">Valor: {formatBRL(PRICING.pix)}</p>

              <button
                onclick={copyPix}
                class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/20"
              >
                {pixCopied ? "✓ Código PIX copiado!" : "Copiar código PIX"}
              </button>

              <button
                onclick={simulatePaymentSuccess}
                class="mt-3 w-full rounded-xl bg-brand-green py-3 text-sm font-bold text-white hover:bg-brand-green-dark"
              >
                Já realizei o pagamento →
              </button>
            </div>
          {:else}
            <div class="flex flex-col gap-3">
              <div>
                <label for="card-num" class="block text-[11px] font-semibold text-white/80 mb-1">Número do Cartão</label>
                <input id="card-num" type="text" placeholder="0000 0000 0000 0000" class="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label for="card-exp" class="block text-[11px] font-semibold text-white/80 mb-1">Validade</label>
                  <input id="card-exp" type="text" placeholder="MM/AA" class="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label for="card-cvv" class="block text-[11px] font-semibold text-white/80 mb-1">CVV</label>
                  <input id="card-cvv" type="text" placeholder="123" class="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <button
                onclick={simulatePaymentSuccess}
                class="mt-3 w-full rounded-xl bg-brand-green py-3 text-sm font-bold text-white hover:bg-brand-green-dark"
              >
                Pagar {PRICING.card.installments}x de {formatBRL(PRICING.card.installment)} →
              </button>
            </div>
          {/if}
        </div>
      </div>
    </main>
  {/if}

  <!-- TELA 7: PAINEL -->
  {#if screen === "painel"}
    <main id="conteudo" class="flex flex-1 px-6 py-3">
      <div class="m-auto flex w-full max-w-[420px] flex-col items-center gap-5 text-center">
        <div class="size-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <svg class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div>
          <h1 class="text-2xl font-extrabold text-white">Matrícula Confirmada!</h1>
          <p class="mt-1 text-xs text-white/75">
            Parabéns, <strong>{studentName}</strong>. Seu acesso ao Supletivo Brasil está liberado.
          </p>
        </div>

        <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl">
          <h2 class="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">Próximo Passo</h2>
          <p class="text-xs text-white/80 leading-relaxed mb-4">
            Envie seus documentos de identificação (RG ou CNH) para validarmos seu prontuário acadêmico e emitirmos seu plano de estudos.
          </p>
          <a
            href="/matricula"
            class="block w-full text-center rounded-xl bg-brand-green py-3.5 text-sm font-bold text-white transition hover:bg-brand-green-dark"
          >
            Enviar Documentos (Matrícula) →
          </a>
        </div>
      </div>
    </main>
  {/if}
</div>
