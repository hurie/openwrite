import { createFileRoute } from "@tanstack/react-router"
import { Globe, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"
import { LanguageSelect } from "@/components/language-switcher"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

function OrganizationSettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="font-bold text-3xl">{t("settings", { ns: "settings" })}</h1>
        <p className="text-muted-foreground">{t("preferences", { ns: "settings" })}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <span>{t("language", { ns: "settings" })}</span>
          </CardTitle>
          <CardDescription>{t("languageDescription", { ns: "settings" })}</CardDescription>
        </CardHeader>
        <CardContent className="max-w-sm space-y-4">
          <div className="space-y-2">
            <Label>{t("selectLanguage", { ns: "settings" })}</Label>
            <LanguageSelect />
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          Organization settings are coming soon! You'll be able to configure themes, manage members,
          set permissions, and customize your workspace.
        </AlertDescription>
      </Alert>
    </div>
  )
}

export const Route = createFileRoute("/dashboard/settings")({
  component: OrganizationSettingsPage,
})
