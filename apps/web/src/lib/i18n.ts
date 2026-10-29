import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import authEn from "@/locales/en/auth.json"
import canvasEn from "@/locales/en/canvas.json"
import commonEn from "@/locales/en/common.json"
import editorEn from "@/locales/en/editor.json"
import navigationEn from "@/locales/en/navigation.json"
import projectsEn from "@/locales/en/projects.json"
import settingsEn from "@/locales/en/settings.json"

import authId from "@/locales/id/auth.json"
import canvasId from "@/locales/id/canvas.json"
import commonId from "@/locales/id/common.json"
import editorId from "@/locales/id/editor.json"
import navigationId from "@/locales/id/navigation.json"
import projectsId from "@/locales/id/projects.json"
import settingsId from "@/locales/id/settings.json"

export const defaultNS = "common"

export const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    navigation: navigationEn,
    projects: projectsEn,
    editor: editorEn,
    canvas: canvasEn,
    settings: settingsEn,
  },
  id: {
    common: commonId,
    auth: authId,
    navigation: navigationId,
    projects: projectsId,
    editor: editorId,
    canvas: canvasId,
    settings: settingsId,
  },
} as const

export const supportedLanguages = [
  { code: "en", name: "English" },
  { code: "id", name: "Bahasa Indonesia" },
] as const

export type SupportedLanguage = (typeof supportedLanguages)[number]["code"]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: "en",
    supportedLngs: ["en", "id"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "openwrite_language",
    },
  })

export { default } from "i18next"
