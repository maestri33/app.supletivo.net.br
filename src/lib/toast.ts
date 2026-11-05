/**
 * Toast notification store — Supletivo
 * Universal, accessible notification engine using Svelte store.
 */
import { writable } from "svelte/store";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

function createToastStore() {
  const { subscribe, update, set } = writable<ToastItem[]>([]);

  function add(type: ToastItem["type"], message: string, duration = 4000) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newItem: ToastItem = { id, type, message, duration };

    update((items) => [...items, newItem]);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
    return id;
  }

  function dismiss(id: string) {
    update((items) => items.filter((item: ToastItem) => item.id !== id));
  }

  function clear() {
    set([]);
  }

  return {
    subscribe,
    add,
    dismiss,
    clear,
    success: (msg: string, duration?: number) => add("success", msg, duration),
    error: (msg: string, duration?: number) => add("error", msg, duration),
    info: (msg: string, duration?: number) => add("info", msg, duration),
    warning: (msg: string, duration?: number) => add("warning", msg, duration),
  };
}

export const toast = createToastStore();
