import i18n from "./i18n"

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error" | "conflict"

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const MESSAGES = {
  en: {
    dirty: "Unsaved changes",
    saving: "Saving…",
    error: "Save failed — retrying on next edit",
    conflict: "Edited elsewhere — reload to continue",
    saved: (time: string | null) => (time ? `Saved at ${time}` : "Saved"),
    idle: (time: string | null) => (time ? `Last saved at ${time}` : "Not saved yet"),
  },
  id: {
    dirty: "Perubahan belum disimpan",
    saving: "Menyimpan…",
    error: "Penyimpanan gagal — mencoba lagi saat penyuntingan berikutnya",
    conflict: "Disunting di tempat lain — muat ulang untuk melanjutkan",
    saved: (time: string | null) => (time ? `Tersimpan pada ${time}` : "Tersimpan"),
    idle: (time: string | null) =>
      time ? `Terakhir disimpan pada ${time}` : "Belum pernah disimpan",
  },
} as const

export function saveStatusText(state: SaveState, savedAt: string | null): string {
  const currentLang = i18n.resolvedLanguage || i18n.language || "en"
  const lang = currentLang.startsWith("id") ? "id" : "en"
  const dict = MESSAGES[lang]
  const time = savedAt ? formatTime(savedAt) : null

  if (state === "saved") {
    return dict.saved(time)
  }
  if (state === "idle") {
    return dict.idle(time)
  }
  return dict[state]
}
