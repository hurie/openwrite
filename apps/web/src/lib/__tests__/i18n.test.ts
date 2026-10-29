import { describe, expect, it } from "vitest"
import i18n, { defaultNS, supportedLanguages } from "../i18n"

describe("i18n infrastructure", () => {
  it("initializes with default namespace and fallback language", () => {
    expect(defaultNS).toBe("common")
    expect(supportedLanguages).toHaveLength(2)
    expect(supportedLanguages.map((l) => l.code)).toEqual(["en", "id"])
  })

  it("translates common namespace strings in English", async () => {
    await i18n.changeLanguage("en")
    expect(i18n.t("actions.save")).toBe("Save")
    expect(i18n.t("actions.cancel")).toBe("Cancel")
    expect(i18n.t("actions.delete")).toBe("Delete")
  })

  it("translates common namespace strings in Indonesian", async () => {
    await i18n.changeLanguage("id")
    expect(i18n.t("actions.save")).toBe("Simpan")
    expect(i18n.t("actions.cancel")).toBe("Batal")
    expect(i18n.t("actions.delete")).toBe("Hapus")
  })

  it("resolves scoped namespaces properly", async () => {
    await i18n.changeLanguage("en")
    expect(i18n.t("write", { ns: "navigation" })).toBe("Write")
    expect(i18n.t("chapters", { ns: "editor" })).toBe("Chapters")
    expect(i18n.t("storyMap", { ns: "canvas" })).toBe("Story Map")

    await i18n.changeLanguage("id")
    expect(i18n.t("write", { ns: "navigation" })).toBe("Menulis")
    expect(i18n.t("chapters", { ns: "editor" })).toBe("Bab")
    expect(i18n.t("storyMap", { ns: "canvas" })).toBe("Peta Cerita")
  })
})
