import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { BookOpen, Clock, Plus, TrendingUp, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { EditProjectDialog } from "@/components/edit-project-dialog"
import { ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { api, type Project } from "@/lib/api"

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
})

function DashboardHome() {
  const { t } = useTranslation()
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  // Fetch projects for overview
  const {
    data: projects,
    isError,
    error,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const result = await api.projects.list()
      return result
    },
    retry: 2,
    retryDelay: 1000,
  })

  // Handle error with toast notification
  useEffect(() => {
    if (isError && error) {
      toast.error(
        t("dashboard.loadErrorToast", {
          defaultValue: "Failed to load projects. Please try refreshing the page.",
          ns: "projects",
        })
      )
    }
  }, [isError, error, t])

  const totalWords = projects?.reduce((sum, project) => sum + project.currentWordCount, 0) || 0
  const activeProjects =
    projects?.filter((project) => project.status === "in_progress" || project.status === "draft") ||
    []
  const recentProjects = projects?.slice(0, 3) || []

  // Handle error state
  if (isError) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h2 className="mb-2 font-semibold text-2xl text-destructive">
                {t("dashboard.loadErrorTitle", {
                  defaultValue: "Unable to load dashboard",
                  ns: "projects",
                })}
              </h2>
              <p className="mb-4 text-muted-foreground">
                {t("dashboard.loadErrorDesc", {
                  defaultValue:
                    "There was a problem loading your writing data. Please try refreshing the page.",
                  ns: "projects",
                })}
              </p>
              <Button onClick={() => window.location.reload()}>
                {t("dashboard.refreshPage", {
                  defaultValue: "Refresh Page",
                  ns: "projects",
                })}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="font-bold text-3xl">
            {t("dashboard.welcomeBack", { defaultValue: "Welcome back!", ns: "projects" })}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("dashboard.welcomeDesc", {
              defaultValue: "Here's what's happening with your writing.",
              ns: "projects",
            })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                {t("dashboard.totalProjects", {
                  defaultValue: "Total Projects",
                  ns: "projects",
                })}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{projects?.length || 0}</div>
              <p className="text-muted-foreground text-xs">
                {t("dashboard.activeProjects", {
                  count: activeProjects.length,
                  defaultValue: `${activeProjects.length} active projects`,
                  ns: "projects",
                })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                {t("dashboard.totalWords", {
                  defaultValue: "Total Words",
                  ns: "projects",
                })}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{totalWords.toLocaleString()}</div>
              <p className="text-muted-foreground text-xs">
                {t("dashboard.acrossAllProjects", {
                  defaultValue: "Across all projects",
                  ns: "projects",
                })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                {t("dashboard.thisWeek", {
                  defaultValue: "This Week",
                  ns: "projects",
                })}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">0</div>
              <p className="text-muted-foreground text-xs">
                {t("dashboard.wordsWritten", {
                  defaultValue: "Words written",
                  ns: "projects",
                })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                {t("dashboard.organization", {
                  defaultValue: "Organization",
                  ns: "projects",
                })}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">1</div>
              <p className="text-muted-foreground text-xs">
                {t("dashboard.teamMember", {
                  count: 1,
                  defaultValue: "Team member",
                  ns: "projects",
                })}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Novels */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {t("dashboard.recentProjects", {
                    defaultValue: "Recent Projects",
                    ns: "projects",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("dashboard.recentProjectsDesc", {
                    defaultValue: "Your latest writing projects",
                    ns: "projects",
                  })}
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/dashboard/projects">
                  {t("actions.viewAll", { defaultValue: "View All", ns: "common" })}
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project: Project) => (
                    <ProjectCard key={project.id} onEdit={setEditingProject} project={project} />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p className="mb-4 text-muted-foreground">
                    {t("noProjects", { defaultValue: "No projects yet", ns: "projects" })}
                  </p>
                  <Button asChild>
                    <Link to="/dashboard/projects">
                      <Plus className="mr-2 h-4 w-4" />
                      {t("createFirstProject", {
                        defaultValue: "Create Your First Project",
                        ns: "projects",
                      })}
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Writing Progress */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("dashboard.writingProgress", {
                  defaultValue: "Writing Progress",
                  ns: "projects",
                })}
              </CardTitle>
              <CardDescription>
                {t("dashboard.goalCompletion", {
                  defaultValue: "Goal completion across projects",
                  ns: "projects",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeProjects.slice(0, 3).map((project: Project) => {
                  const progress = project.targetWordCount
                    ? Math.min((project.currentWordCount / project.targetWordCount) * 100, 100)
                    : 0

                  return (
                    <div className="space-y-2" key={project.id}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{project.title}</p>
                        <p className="text-muted-foreground text-sm">{Math.round(progress)}%</p>
                      </div>
                      <Progress className="h-2" value={progress} />
                      <p className="text-muted-foreground text-xs">
                        {project.currentWordCount.toLocaleString()} /{" "}
                        {project.targetWordCount?.toLocaleString() || "∞"}{" "}
                        {t("words", { defaultValue: "words", ns: "editor" })}
                      </p>
                    </div>
                  )
                })}

                {activeProjects.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>
                      {t("dashboard.noActiveGoals", {
                        defaultValue: "No active projects with word goals",
                        ns: "projects",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Project Dialog */}
        {editingProject && (
          <EditProjectDialog
            onOpenChange={(open) => {
              if (!open) {
                setEditingProject(null)
              }
            }}
            open={!!editingProject}
            project={editingProject}
          />
        )}
      </div>
    </div>
  )
}
