import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { Globe, Monitor, Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/components/theme-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supportedLanguages } from "@/lib/i18n"
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"

async function fetchSession() {
  const baseUrl =
    import.meta.env.DEV && import.meta.env.VITE_SERVER_URL
      ? import.meta.env.VITE_SERVER_URL
      : window.location.origin

  const response = await fetch(`${baseUrl}/api/session`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch session")
  }

  return response.json()
}

async function signOut() {
  const baseUrl =
    import.meta.env.DEV && import.meta.env.VITE_SERVER_URL
      ? import.meta.env.VITE_SERVER_URL
      : window.location.origin

  const response = await fetch(`${baseUrl}/api/auth/sign-out`, {
    method: "POST",
    credentials: "include",
  })

  return response.ok
}

export default function UserMenu() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setTheme, theme } = useTheme()
  const { i18n, t } = useTranslation()
  const currentLang = i18n.resolvedLanguage || i18n.language || "en"

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    retry: 2,
    staleTime: 0, // Always consider stale
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const handleSignOut = async () => {
    try {
      await signOut()
      // Invalidate session query to refresh UI
      queryClient.invalidateQueries({ queryKey: ["session"] })
      navigate({ to: "/" })
    } catch {
      // Ignore logout errors - user will be redirected anyway
    }
  }

  if (sessionQuery.isLoading) {
    return <Skeleton className="h-9 w-24" />
  }

  if (!sessionQuery.data?.authenticated) {
    return (
      <Button asChild variant="outline">
        <Link to="/login">{t("signIn", { ns: "auth" })}</Link>
      </Button>
    )
  }

  const session = sessionQuery.data.session

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-full" variant="outline">
          {session.user.name || "User"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card">
        <DropdownMenuLabel>{t("myAccount", { ns: "navigation" })}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>{session.user.email}</DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Theme Selection */}
        <DropdownMenuLabel>{t("theme", { ns: "navigation" })}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          {t("themeLight", { ns: "navigation" })}
          {theme === "light" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          {t("themeDark", { ns: "navigation" })}
          {theme === "dark" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          {t("themeSystem", { ns: "navigation" })}
          {theme === "system" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Language Selection */}
        <DropdownMenuLabel>{t("language", { ns: "navigation" })}</DropdownMenuLabel>
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem key={lang.code} onClick={() => i18n.changeLanguage(lang.code)}>
            <Globe className="mr-2 h-4 w-4" />
            {lang.name}
            {currentLang === lang.code && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button className="w-full" onClick={handleSignOut} variant="destructive">
            {t("signOut", { ns: "auth" })}
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
