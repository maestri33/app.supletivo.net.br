<script lang="ts">
  import { onMount } from "svelte";
  import { cleanOtpInput, splitOtpDigits, isOtpComplete } from "@/lib/otp";

  interface Props {
    value?: string;
    length?: number;
    disabled?: boolean;
    error?: boolean;
    oncomplete?: (code: string) => void;
    idPrefix?: string;
  }

  let {
    value = $bindable(""),
    length = 6,
    disabled = false,
    error = false,
    oncomplete,
    idPrefix = "otp",
  }: Props = $props();

  let mounted = $state(false);
  let digits = $state<string[]>(["", "", "", "", "", ""]);

  // Sync internal digits when external value changes
  $effect(() => {
    const splitted = splitOtpDigits(value, length);
    if (splitted.join("") !== digits.join("")) {
      digits = splitted;
    }
  });

  onMount(() => {
    mounted = true;
    focusInput(0);
  });

  export function focusInput(idx: number) {
    if (typeof document === "undefined") return;
    const target = document.getElementById(`${idPrefix}-${idx}`) as HTMLInputElement | null;
    if (target) {
      target.focus();
    } else {
      setTimeout(() => {
        const fallback = document.getElementById(`${idPrefix}-${idx}`) as HTMLInputElement | null;
        fallback?.focus();
      }, 10);
    }
  }

  export function clear() {
    digits = Array(length).fill("");
    value = "";
    focusInput(0);
  }

  function updateCodeAndNotify(newDigits: string[]) {
    digits = newDigits;
    const currentCode = newDigits.join("");
    value = currentCode;

    if (isOtpComplete(currentCode, length) && oncomplete) {
      oncomplete(currentCode);
    }
  }

  function handleInput(idx: number, e: Event) {
    const target = e.target as HTMLInputElement;
    const rawVal = target.value.replace(/\D/g, "");

    if (rawVal.length > 1) {
      // Paste / autofill handling
      const clean = cleanOtpInput(rawVal, length);
      const chars = clean.split("");
      const nextDigits = [...digits];
      for (let i = 0; i < length; i++) {
        nextDigits[i] = chars[i] || "";
      }
      updateCodeAndNotify(nextDigits);

      if (clean.length === length) {
        focusInput(length - 1);
      } else {
        focusInput(Math.min(clean.length, length - 1));
      }
      return;
    }

    const nextDigits = [...digits];
    nextDigits[idx] = rawVal;
    updateCodeAndNotify(nextDigits);

    if (rawVal && idx < length - 1) {
      focusInput(idx + 1);
    }
  }

  function handleKeyDown(idx: number, e: KeyboardEvent) {
    if (e.key === "Backspace") {
      if (!digits[idx] && idx > 0) {
        const nextDigits = [...digits];
        nextDigits[idx - 1] = "";
        updateCodeAndNotify(nextDigits);
        focusInput(idx - 1);
      } else {
        const nextDigits = [...digits];
        nextDigits[idx] = "";
        updateCodeAndNotify(nextDigits);
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      focusInput(idx - 1);
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      focusInput(idx + 1);
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData?.getData("text") || "";
    const clean = cleanOtpInput(pasted, length);
    if (!clean) return;

    const chars = clean.split("");
    const nextDigits = [...digits];
    for (let i = 0; i < length; i++) {
      nextDigits[i] = chars[i] || "";
    }
    updateCodeAndNotify(nextDigits);

    if (clean.length === length) {
      focusInput(length - 1);
    } else {
      focusInput(Math.min(clean.length, length - 1));
    }
  }
</script>

<div
  class="flex items-center justify-center gap-2 sm:gap-3"
  role="group"
  aria-label="Código de verificação de {length} dígitos"
  onpaste={handlePaste}
>
  <!-- Group 1 (First 3 digits) -->
  <div class="flex items-center gap-1.5 sm:gap-2">
    {#each [0, 1, 2] as i (i)}
      <input
        id="{idPrefix}-{i}"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength={i === 0 ? length : 1}
        autocomplete={i === 0 ? "one-time-code" : "off"}
        value={digits[i]}
        oninput={(e) => handleInput(i, e)}
        onkeydown={(e) => handleKeyDown(i, e)}
        {disabled}
        data-hydrated={mounted}
        aria-label="Dígito {i + 1} de {length}"
        class="size-12 sm:size-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl bg-white/5 border {error ? 'border-red-500/70 text-red-200 focus:ring-red-500/30' : 'border-white/20 text-white focus:border-yellow focus:ring-yellow/30'} focus:ring-2 focus:outline-none transition-all duration-150 shadow-inner {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}"
      />
    {/each}
  </div>

  <!-- Separator Slot -->
  <div class="text-white/30 font-bold px-0.5 select-none" aria-hidden="true">
    –
  </div>

  <!-- Group 2 (Last 3 digits) -->
  <div class="flex items-center gap-1.5 sm:gap-2">
    {#each [3, 4, 5] as i (i)}
      <input
        id="{idPrefix}-{i}"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength={1}
        autocomplete="off"
        value={digits[i]}
        oninput={(e) => handleInput(i, e)}
        onkeydown={(e) => handleKeyDown(i, e)}
        {disabled}
        data-hydrated={mounted}
        aria-label="Dígito {i + 1} de {length}"
        class="size-12 sm:size-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl bg-white/5 border {error ? 'border-red-500/70 text-red-200 focus:ring-red-500/30' : 'border-white/20 text-white focus:border-yellow focus:ring-yellow/30'} focus:ring-2 focus:outline-none transition-all duration-150 shadow-inner {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}"
      />
    {/each}
  </div>
</div>
