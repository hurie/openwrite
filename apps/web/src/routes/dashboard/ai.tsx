import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { CheckCircle, Plus, Trash2 } from "lucide-react"

// Reusable success icon for toast notifications
const successIcon = <CheckCircle className="h-4 w-4" />

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { OllamaSetup } from "@/components/ollama-setup"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { aiProvidersApi, type ProviderId } from "@/lib/api/ai-providers"
import { buildAuthURL, generatePKCEParams } from "@/lib/pkce"

interface AIProvider {
  description: string
  enabled: boolean
  id: ProviderId
  name: string
  recommended?: boolean
  supportsPKCE?: boolean
}

interface ProviderFormProps {
  apiKey: string
  availableProviders: AIProvider[]
  baseUrl: string
  handleOAuthLogin: () => void
  handleOllamaConnect?: (config: { apiUrl: string; connectionMethod: string }) => void
  handleSubmit: (e: React.FormEvent) => void
  loading: boolean
  model: string
  oauthLoading: boolean
  preSelectedProviderId?: string | null
  selectedProvider: string
  selectedProviderData: AIProvider | undefined
  selectedProviderSupportsPKCE: boolean
  setApiKey: (key: string) => void
  setBaseUrl: (url: string) => void
  setModel: (model: string) => void
  setSelectedProvider: (provider: string) => void
  setShowManualApiKey: (show: boolean) => void
  showManualApiKey: boolean
}

function AIProvidersPage() {
  const { t } = useTranslation()
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [_oauthProcessing, setOauthProcessing] = useState(false)
  const queryClient = useQueryClient()

  // Prevent double OAuth execution in React StrictMode
  const oauthHandled = useRef(false)

  const { data: providers, error } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: () => aiProvidersApi.list(),
  })

  if (error) {
    toast.error(
      t("toasts.loadFailed", {
        defaultValue: `Failed to load AI providers: ${error.message}`,
        error: error.message,
        ns: "settings",
      })
    )
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aiProvidersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] })
      toast.success(
        t("toasts.providerDisconnected", {
          defaultValue: "Provider disconnected successfully",
          ns: "settings",
        })
      )
    },
    onError: (deleteError: Error) => {
      toast.error(
        t("toasts.disconnectFailed", {
          defaultValue: `Failed to disconnect provider: ${deleteError.message}`,
          error: deleteError.message,
          ns: "settings",
        })
      )
    },
  })

  const oauthMutation = useMutation({
    mutationFn: (params: {
      code: string
      codeVerifier: string
      codeChallengeMethod: "S256" | "plain"
      provider: ProviderId
    }) => aiProvidersApi.exchangeOAuth(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] })
      toast.success(
        t("toasts.providerConnectedOAuth", {
          defaultValue: "Provider connected successfully via OAuth",
          ns: "settings",
        }),
        {
          icon: successIcon,
        }
      )
      setOauthProcessing(false)
    },
    onError: (oauthError: Error) => {
      toast.error(
        t("toasts.oauthFailed", {
          defaultValue: `OAuth connection failed: ${oauthError.message}`,
          error: oauthError.message,
          ns: "settings",
        })
      )
      setOauthProcessing(false)
    },
  })

  const handleOAuthCallback = useCallback(
    (code: string) => {
      try {
        setOauthProcessing(true)

        // Find PKCE params for any provider
        let storedParams: string | null = null
        let pkceKey: string | null = null

        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key?.endsWith("-pkce")) {
            storedParams = sessionStorage.getItem(key)
            pkceKey = key
            break
          }
        }

        if (!(storedParams && pkceKey)) {
          toast.error("No PKCE parameters found in session storage")
          setOauthProcessing(false)
          return
        }

        const {
          codeVerifier,
          codeChallengeMethod,
          providerId,
        }: {
          codeVerifier: string
          codeChallengeMethod: "S256" | "plain"
          providerId: ProviderId
        } = JSON.parse(storedParams)
        sessionStorage.removeItem(pkceKey)

        oauthMutation.mutate({
          code,
          codeVerifier,
          codeChallengeMethod,
          provider: providerId,
        })
      } catch (callbackError) {
        toast.error(
          `OAuth callback failed: ${callbackError instanceof Error ? callbackError.message : "Unknown error"}`
        )
        setOauthProcessing(false)
      }
    },
    [oauthMutation]
  )

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get("code")

    if (code && !oauthHandled.current) {
      oauthHandled.current = true
      // OAuth flow - handleOAuthCallback will invalidate and refetch providers
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
      handleOAuthCallback(code)
    }
    // No else block needed - TanStack Query handles normal loading
  }, [handleOAuthCallback])

  const availableProviders: AIProvider[] = [
    {
      id: "openrouter",
      name: "OpenRouter",
      description: "Access 200+ models through one API",
      recommended: true,
      enabled: true,
      supportsPKCE: true,
    },
    {
      id: "openai",
      name: "OpenAI",
      description: "GPT models",
      enabled: true,
      supportsPKCE: false,
    },
    {
      id: "anthropic",
      name: "Anthropic",
      description: "Claude models",
      enabled: true,
      supportsPKCE: false,
    },
    {
      id: "groq",
      name: "Groq",
      description: "Fast inference for open-weight models",
      enabled: true,
      supportsPKCE: false,
    },
    {
      id: "gemini",
      name: "Google Gemini",
      description: "Gemini models",
      enabled: true,
      supportsPKCE: false,
    },
    {
      id: "cohere",
      name: "Cohere",
      description: "Command models",
      enabled: true,
      supportsPKCE: false,
    },
    {
      id: "ollama",
      name: "Ollama",
      description: "Run models locally on your device",
      enabled: true,
      supportsPKCE: false,
    },
    {
      id: "custom",
      name: "Custom (OpenAI-compatible)",
      description: "Any OpenAI-compatible endpoint — LM Studio, vLLM, DeepSeek, a gateway",
      enabled: true,
      supportsPKCE: false,
    },
  ]

  // Performance optimization: Create Map for O(1) provider lookups
  const providersMap = useMemo(
    () => new Map(availableProviders.map((provider) => [provider.id, provider])),
    [availableProviders.map]
  )

  const getConnectedProvider = useCallback(
    (providerId: string) => providers?.find((p) => p.provider === providerId),
    [providers]
  )

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl sm:text-3xl">
          {t("aiProviders", { defaultValue: "AI Providers", ns: "settings" })}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t("aiProvidersDesc", {
            defaultValue: "Connect your AI providers to start generating content",
            ns: "settings",
          })}
        </p>
      </div>

      {providers && providers.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg sm:text-xl">
            {t("connectedProviders", { defaultValue: "Connected Providers", ns: "settings" })}
          </h2>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-32">
                    {t("table.provider", { defaultValue: "Provider", ns: "settings" })}
                  </TableHead>
                  <TableHead className="min-w-48">
                    {t("table.description", { defaultValue: "Description", ns: "settings" })}
                  </TableHead>
                  <TableHead className="w-24">
                    {t("table.status", { defaultValue: "Status", ns: "settings" })}
                  </TableHead>
                  <TableHead className="w-16 text-right">
                    {t("table.actions", { defaultValue: "Actions", ns: "settings" })}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => {
                  const providerData = providersMap.get(provider.provider)
                  return (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {providerData?.name || provider.provider}
                          </span>
                          {providerData?.recommended && (
                            <Badge className="text-xs" variant="secondary">
                              {t("badges.recommended", {
                                defaultValue: "Recommended",
                                ns: "settings",
                              })}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {providerData?.description || "AI Provider"}
                      </TableCell>
                      <TableCell>
                        <Badge className="text-xs" variant="default">
                          {t("badges.connected", { defaultValue: "Connected", ns: "settings" })}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ConfirmDialog
                          confirmText={t("actions.delete", { ns: "common" })}
                          description={t("deleteProviderDesc", {
                            defaultValue:
                              "Are you sure you want to delete this AI provider? This action cannot be undone.",
                            ns: "settings",
                          })}
                          onConfirm={() => deleteMutation.mutate(provider.id)}
                          title={t("deleteProviderTitle", {
                            defaultValue: "Delete AI Provider",
                            ns: "settings",
                          })}
                          variant="destructive"
                        >
                          <Button className="h-6 px-2 text-xs" variant="destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </ConfirmDialog>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {availableProviders.some((p) => p.enabled) && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg sm:text-xl">
            {t("availableProviders", { defaultValue: "Available Providers", ns: "settings" })}
          </h2>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-32">
                    {t("table.provider", { defaultValue: "Provider", ns: "settings" })}
                  </TableHead>
                  <TableHead className="min-w-48">
                    {t("table.description", { defaultValue: "Description", ns: "settings" })}
                  </TableHead>
                  <TableHead className="w-24">
                    {t("table.status", { defaultValue: "Status", ns: "settings" })}
                  </TableHead>
                  <TableHead className="w-16 text-right">
                    {t("table.actions", { defaultValue: "Actions", ns: "settings" })}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableProviders
                  .filter((p) => p.enabled && !getConnectedProvider(p.id)) // Only show non-connected providers
                  .sort((a, b) => {
                    // Sort by recommended status first, then alphabetically
                    if (a.recommended && !b.recommended) {
                      return -1
                    }
                    if (!a.recommended && b.recommended) {
                      return 1
                    }

                    // Finally alphabetically
                    return a.name.localeCompare(b.name)
                  })
                  .map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{provider.name}</span>
                          {provider.recommended && (
                            <Badge className="text-xs" variant="secondary">
                              {t("badges.recommended", {
                                defaultValue: "Recommended",
                                ns: "settings",
                              })}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {provider.description}
                      </TableCell>
                      <TableCell>
                        <Badge className="text-xs" variant="outline">
                          {t("badges.available", { defaultValue: "Available", ns: "settings" })}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              className="h-6 px-2 text-xs"
                              onClick={() => setSelectedProviderId(provider.id)}
                              variant="default"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                {t("connectProviderName", {
                                  defaultValue: `Connect ${provider.name}`,
                                  name: provider.name,
                                  ns: "settings",
                                })}
                              </DialogTitle>
                              <DialogDescription>
                                {t("connectProviderDesc", {
                                  defaultValue: `Connect to ${provider.name} to access their models`,
                                  name: provider.name,
                                  ns: "settings",
                                })}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[calc(90vh-8rem)] overflow-y-auto pr-2">
                              {selectedProviderId === provider.id && (
                                <AddProviderForm
                                  availableProviders={[provider].filter((p) => p.enabled)}
                                  onSuccess={() => {
                                    setSelectedProviderId(null)
                                    queryClient.invalidateQueries({
                                      queryKey: ["ai-providers"],
                                    })
                                  }}
                                  preSelectedProviderId={provider.id}
                                />
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

function useOAuthLogin(options: {
  providerId: string
  setOauthLoading: (loading: boolean) => void
}) {
  const { providerId, setOauthLoading } = options

  return async () => {
    try {
      setOauthLoading(true)

      const pkceParams = await generatePKCEParams()

      sessionStorage.setItem(
        `${providerId}-pkce`,
        JSON.stringify({
          codeVerifier: pkceParams.codeVerifier,
          codeChallengeMethod: pkceParams.codeChallengeMethod,
          providerId,
        })
      )

      const callbackUrl = `${window.location.origin}/dashboard/ai`
      const authUrl = buildAuthURL({
        callbackUrl,
        codeChallenge: pkceParams.codeChallenge,
        codeChallengeMethod: pkceParams.codeChallengeMethod,
      })

      window.location.href = authUrl
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to initiate OAuth"
      toast.error(errorMessage)
      setOauthLoading(false)
    }
  }
}

function useProviderSubmit(options: {
  selectedProvider: string
  selectedProviderSupportsPKCE: boolean
  showManualApiKey: boolean
  apiKey: string
  baseUrl: string
  model: string
  onSuccess: () => void
  setLoading: (loading: boolean) => void
  setSelectedProvider: (provider: string) => void
  setApiKey: (key: string) => void
  availableProviders: AIProvider[]
}) {
  const { t } = useTranslation()
  const {
    selectedProvider,
    selectedProviderSupportsPKCE,
    showManualApiKey,
    apiKey,
    baseUrl,
    model,
    onSuccess,
    setLoading,
    setSelectedProvider,
    setApiKey,
    availableProviders,
  } = options
  return async (e: React.FormEvent) => {
    e.preventDefault()

    const keylessProvider = selectedProvider === "ollama" || selectedProvider === "custom"
    const requiresApiKey = !selectedProviderSupportsPKCE || showManualApiKey
    if (!selectedProvider || (requiresApiKey && !apiKey && !keylessProvider)) {
      return
    }

    try {
      setLoading(true)
      await aiProvidersApi.create({
        provider: selectedProvider as ProviderId,
        apiKey,
        ...(selectedProvider === "custom" ? { apiUrl: baseUrl.trim() } : {}),
        ...(model.trim() ? { providerConfig: { defaultModel: model.trim() } } : {}),
      })
      // Get provider name for the toast
      const providerData = availableProviders.find((p) => p.id === selectedProvider)
      const providerName = providerData?.name || "AI Provider"
      toast.success(
        t("toasts.providerConnected", {
          defaultValue: `${providerName} connected successfully`,
          name: providerName,
          ns: "settings",
        }),
        {
          icon: successIcon,
        }
      )
      onSuccess()
      setSelectedProvider("")
      setApiKey("")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect provider"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }
}

function AddProviderForm({
  availableProviders,
  preSelectedProviderId,
  onSuccess,
}: {
  availableProviders: AIProvider[]
  preSelectedProviderId?: string | null
  onSuccess: () => void
}) {
  const { t } = useTranslation()
  const [selectedProvider, setSelectedProvider] = useState(preSelectedProviderId || "")
  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [model, setModel] = useState("")
  const [loading, setLoading] = useState(false)
  const [showManualApiKey, setShowManualApiKey] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  useEffect(() => {
    setSelectedProvider(preSelectedProviderId || "")
  }, [preSelectedProviderId])

  // Performance optimization: Create Map for O(1) provider lookups
  const providersMap = useMemo(
    () => new Map(availableProviders.map((provider) => [provider.id, provider])),
    [availableProviders]
  )

  const selectedProviderData = providersMap.get(selectedProvider as ProviderId)
  const selectedProviderSupportsPKCE = selectedProviderData?.supportsPKCE ?? false

  const handleOllamaConnect = async (config: { apiUrl: string; connectionMethod: string }) => {
    try {
      setLoading(true)
      await aiProvidersApi.create({
        provider: "ollama",
        apiKey: "", // Ollama doesn't require API key
        apiUrl: config.apiUrl,
        configuration: {
          connectionMethod: config.connectionMethod,
          ...(model.trim() ? { defaultModel: model.trim() } : {}),
        },
      })
      toast.success(
        t("toasts.ollamaConnected", {
          defaultValue: "Ollama connected successfully",
          ns: "settings",
        }),
        {
          icon: successIcon,
        }
      )
      onSuccess()
      setSelectedProvider("")
      setApiKey("")
    } catch (error) {
      toast.error(
        `Failed to connect Ollama: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    } finally {
      setLoading(false)
    }
  }
  const handleOAuthLogin = useOAuthLogin({
    providerId: selectedProvider,
    setOauthLoading,
  })
  const handleSubmit = useProviderSubmit({
    selectedProvider,
    selectedProviderSupportsPKCE,
    showManualApiKey,
    apiKey,
    baseUrl,
    model,
    onSuccess,
    setLoading,
    setSelectedProvider,
    setApiKey,
    availableProviders,
  })

  return (
    <ProviderForm
      apiKey={apiKey}
      availableProviders={availableProviders}
      baseUrl={baseUrl}
      handleOAuthLogin={handleOAuthLogin}
      handleOllamaConnect={handleOllamaConnect}
      handleSubmit={handleSubmit}
      loading={loading}
      model={model}
      oauthLoading={oauthLoading}
      preSelectedProviderId={preSelectedProviderId}
      selectedProvider={selectedProvider}
      selectedProviderData={selectedProviderData}
      selectedProviderSupportsPKCE={selectedProviderSupportsPKCE}
      setApiKey={setApiKey}
      setBaseUrl={setBaseUrl}
      setModel={setModel}
      setSelectedProvider={setSelectedProvider}
      setShowManualApiKey={setShowManualApiKey}
      showManualApiKey={showManualApiKey}
    />
  )
}

function ProviderSelector({
  selectedProvider,
  setSelectedProvider,
  availableProviders,
  selectedProviderData,
}: {
  selectedProvider: string
  setSelectedProvider: (provider: string) => void
  availableProviders: AIProvider[]
  selectedProviderData: AIProvider | undefined
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <Label htmlFor="provider">
        {t("selectProvider", { defaultValue: "Select Provider", ns: "settings" })}
      </Label>
      <Select onValueChange={setSelectedProvider} value={selectedProvider}>
        <SelectTrigger>
          <SelectValue
            placeholder={t("chooseAiProvider", {
              defaultValue: "Choose an AI provider",
              ns: "settings",
            })}
          />
        </SelectTrigger>
        <SelectContent>
          {availableProviders.map((provider) => (
            <SelectItem key={provider.id} value={provider.id}>
              <div className="flex items-center gap-2">
                {provider.name}
                {provider.recommended && (
                  <Badge className="text-xs" variant="secondary">
                    {t("badges.recommended", { defaultValue: "Recommended", ns: "settings" })}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedProviderData && (
        <p className="mt-1 text-muted-foreground text-sm">{selectedProviderData.description}</p>
      )}
    </div>
  )
}

function ProviderInfo({ selectedProviderData }: { selectedProviderData: AIProvider }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <Label>
        {t("connectingToProvider", { defaultValue: "Connecting to Provider", ns: "settings" })}
      </Label>
      <div className="flex items-center gap-3 rounded-md border p-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{selectedProviderData.name}</span>
            {selectedProviderData.recommended && (
              <Badge variant="secondary">
                {t("badges.recommended", { defaultValue: "Recommended", ns: "settings" })}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{selectedProviderData.description}</p>
        </div>
      </div>
    </div>
  )
}

function OAuthSection({
  oauthLoading,
  showManualApiKey,
  setShowManualApiKey,
  handleOAuthLogin,
}: {
  oauthLoading: boolean
  showManualApiKey: boolean
  setShowManualApiKey: (show: boolean) => void
  handleOAuthLogin: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <Separator />
      {!showManualApiKey && (
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={oauthLoading}
            onClick={handleOAuthLogin}
            type="button"
            variant="default"
          >
            {oauthLoading
              ? t("connecting", { defaultValue: "Connecting...", ns: "settings" })
              : t("oauthLoginRecommended", {
                  defaultValue: "OAuth Login (Recommended)",
                  ns: "settings",
                })}
          </Button>
          <Button
            className="flex-1"
            onClick={() => setShowManualApiKey(true)}
            type="button"
            variant="outline"
          >
            {t("manualApiKey", { defaultValue: "Manual API Key", ns: "settings" })}
          </Button>
        </div>
      )}
    </div>
  )
}

function ApiKeySection({
  apiKey,
  setApiKey,
  selectedProviderSupportsPKCE,
  showManualApiKey,
  setShowManualApiKey,
  optional = false,
}: {
  apiKey: string
  setApiKey: (key: string) => void
  selectedProviderSupportsPKCE: boolean
  showManualApiKey: boolean
  setShowManualApiKey: (show: boolean) => void
  optional?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="apiKey">
          {t("apiKeys", { defaultValue: "API Key", ns: "settings" })}
          {optional ? ` (${t("status.optional", { defaultValue: "optional", ns: "common" })})` : ""}
        </Label>
        {selectedProviderSupportsPKCE && showManualApiKey && (
          <Button
            onClick={() => setShowManualApiKey(false)}
            size="sm"
            type="button"
            variant="ghost"
          >
            {t("backToOAuth", { defaultValue: "← Back to OAuth", ns: "settings" })}
          </Button>
        )}
      </div>
      <Input
        id="apiKey"
        onChange={(e) => setApiKey(e.target.value)}
        placeholder={
          optional
            ? t("keylessPlaceholder", {
                defaultValue: "Leave blank if the endpoint needs no key",
                ns: "settings",
              })
            : t("enterApiKey", { defaultValue: "Enter your API key", ns: "settings" })
        }
        required={!optional}
        type="password"
        value={apiKey}
      />
      <p className="mt-1 text-muted-foreground text-sm">
        {t("apiKeySecureNote", {
          defaultValue: "Your API key will be encrypted and stored securely",
          ns: "settings",
        })}
      </p>
    </div>
  )
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "::1"])

// Completions are requested by the server, so a loopback URL only resolves when
// the server runs on the same machine — not on the hosted Worker.
function isLoopbackUrl(value: string): boolean {
  try {
    return LOOPBACK_HOSTS.has(new URL(value.trim()).hostname)
  } catch {
    return false
  }
}

function BaseUrlSection({
  baseUrl,
  setBaseUrl,
}: {
  baseUrl: string
  setBaseUrl: (url: string) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <Label htmlFor="baseUrl">{t("baseUrl", { defaultValue: "Base URL", ns: "settings" })}</Label>
      <Input
        id="baseUrl"
        onChange={(e) => setBaseUrl(e.target.value)}
        placeholder="https://api.example.com/v1"
        required
        type="url"
        value={baseUrl}
      />
      {isLoopbackUrl(baseUrl) ? (
        <p className="mt-1 text-amber-600 text-sm dark:text-amber-500">
          {t("loopbackWarning", {
            defaultValue:
              "Requests are made by the OpenWrite server, which cannot reach your machine's localhost. Expose the endpoint with a tunnel (ngrok, cloudflared) and paste that URL instead — unless you are self-hosting the server locally.",
            ns: "settings",
          })}
        </p>
      ) : (
        <p className="mt-1 text-muted-foreground text-sm">
          {t("baseUrlDesc", {
            defaultValue: "The OpenAI-compatible base URL. /chat/completions is appended for you.",
            ns: "settings",
          })}
        </p>
      )}
    </div>
  )
}

function ModelSection({
  model,
  setModel,
  required,
}: {
  model: string
  setModel: (model: string) => void
  required: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <Label htmlFor="model">
        {t("model", { defaultValue: "Model", ns: "settings" })}
        {required ? "" : ` (${t("status.optional", { defaultValue: "optional", ns: "common" })})`}
      </Label>
      <Input
        id="model"
        onChange={(e) => setModel(e.target.value)}
        placeholder="e.g. z-ai/glm-5.2:free"
        required={required}
        type="text"
        value={model}
      />
      <p className="mt-1 text-muted-foreground text-sm">
        {required
          ? t("modelIdRequiredDesc", {
              defaultValue: "The model ID this endpoint serves.",
              ns: "settings",
            })
          : t("modelIdOptionalDesc", {
              defaultValue:
                "Leave blank to use the provider's default. On OpenRouter, a :free model costs nothing.",
              ns: "settings",
            })}
      </p>
    </div>
  )
}

function ProviderForm({
  selectedProvider,
  setSelectedProvider,
  apiKey,
  setApiKey,
  baseUrl,
  setBaseUrl,
  model,
  setModel,
  loading,
  oauthLoading,
  showManualApiKey,
  setShowManualApiKey,
  availableProviders,
  preSelectedProviderId,
  selectedProviderData,
  selectedProviderSupportsPKCE,
  handleSubmit,
  handleOAuthLogin,
  handleOllamaConnect,
}: ProviderFormProps) {
  const { t } = useTranslation()
  // Extract button state logic for better readability
  const hasSelectedProvider = !!selectedProvider
  const canUseOAuth = selectedProviderSupportsPKCE && !showManualApiKey
  const hasApiKeyForNonPKCE =
    !selectedProviderSupportsPKCE && apiKey && selectedProvider !== "ollama"
  const hasApiKeyForManualMode = selectedProviderSupportsPKCE && showManualApiKey && apiKey
  const isOllama = selectedProvider === "ollama"
  const isCustom = selectedProvider === "custom"
  // A custom endpoint may be keyless (local vLLM, LM Studio) but always needs
  // somewhere to send the request and a model to name.
  const hasCustomEndpoint = isCustom && !!baseUrl.trim() && !!model.trim()

  const isFormValid =
    hasSelectedProvider &&
    (isCustom
      ? hasCustomEndpoint
      : canUseOAuth || hasApiKeyForNonPKCE || hasApiKeyForManualMode || isOllama)
  const isSubmitDisabled = !isFormValid || loading || oauthLoading
  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {!preSelectedProviderId && (
        <ProviderSelector
          availableProviders={availableProviders}
          selectedProvider={selectedProvider}
          selectedProviderData={selectedProviderData}
          setSelectedProvider={setSelectedProvider}
        />
      )}

      {preSelectedProviderId && selectedProviderData && (
        <ProviderInfo selectedProviderData={selectedProviderData} />
      )}

      {isCustom && <BaseUrlSection baseUrl={baseUrl} setBaseUrl={setBaseUrl} />}

      {selectedProvider && <ModelSection model={model} required={isCustom} setModel={setModel} />}

      {selectedProvider === "ollama" && handleOllamaConnect && (
        <div className="space-y-3">
          <Separator />
          <OllamaSetup loading={loading} onConnect={handleOllamaConnect} />
        </div>
      )}

      {selectedProviderSupportsPKCE && (
        <OAuthSection
          handleOAuthLogin={handleOAuthLogin}
          oauthLoading={oauthLoading}
          setShowManualApiKey={setShowManualApiKey}
          showManualApiKey={showManualApiKey}
        />
      )}

      {selectedProvider &&
        selectedProvider !== "ollama" &&
        (!selectedProviderSupportsPKCE || showManualApiKey) && (
          <ApiKeySection
            apiKey={apiKey}
            optional={isCustom}
            selectedProviderSupportsPKCE={selectedProviderSupportsPKCE}
            setApiKey={setApiKey}
            setShowManualApiKey={setShowManualApiKey}
            showManualApiKey={showManualApiKey}
          />
        )}

      {selectedProvider !== "ollama" && (
        <div className="flex gap-2 pt-4">
          <Button disabled={isSubmitDisabled} type="submit">
            {loading
              ? t("connecting", { defaultValue: "Connecting...", ns: "settings" })
              : t("connectProvider", { defaultValue: "Connect Provider", ns: "settings" })}
          </Button>
        </div>
      )}
    </form>
  )
}

export const Route = createFileRoute("/dashboard/ai")({
  component: AIProvidersPage,
})
