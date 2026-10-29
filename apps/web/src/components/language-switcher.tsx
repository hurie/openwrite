import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type SupportedLanguage, supportedLanguages } from "@/lib/i18n"

interface LanguageSwitcherProps {
  className?: string
  showLabel?: boolean
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "outline" | "ghost" | "default"
}

export function LanguageSwitcher({
  className,
  showLabel = false,
  variant = "ghost",
  size = "icon",
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()
  const currentLang = (i18n.resolvedLanguage || i18n.language || "en") as SupportedLanguage

  const currentLangObj =
    supportedLanguages.find((l) => l.code === currentLang) ?? supportedLanguages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t("language", { ns: "navigation" })}
          className={className}
          size={size}
          variant={variant}
        >
          <Globe className="h-4 w-4" />
          {showLabel && <span className="ml-2">{currentLangObj.name}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            className="cursor-pointer"
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
          >
            <span>{lang.name}</span>
            {currentLang === lang.code && <span className="ml-auto font-bold">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function LanguageSelect({ className }: { className?: string }) {
  const { i18n } = useTranslation()
  const currentLang = (i18n.resolvedLanguage || i18n.language || "en") as SupportedLanguage

  return (
    <Select onValueChange={(val) => i18n.changeLanguage(val)} value={currentLang}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {supportedLanguages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default LanguageSwitcher
