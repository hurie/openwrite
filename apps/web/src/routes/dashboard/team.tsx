import { createFileRoute } from "@tanstack/react-router"
import { Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Alert, AlertDescription } from "@/components/ui/alert"

function TeamPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="font-bold text-3xl">
          {t("team", { defaultValue: "Team", ns: "settings" })}
        </h1>
        <p className="text-muted-foreground">
          {t("teamDesc", { defaultValue: "Manage team members and collaboration", ns: "settings" })}
        </p>
      </div>

      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription>
          {t("teamComingSoon", {
            defaultValue:
              "Team management features are coming soon! You'll be able to invite members, assign roles, and collaborate on your projects.",
            ns: "settings",
          })}
        </AlertDescription>
      </Alert>
    </div>
  )
}

export const Route = createFileRoute("/dashboard/team")({
  component: TeamPage,
})
