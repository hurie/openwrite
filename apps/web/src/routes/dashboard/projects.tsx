import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { BookOpen, Plus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { EditProjectDialog } from "@/components/edit-project-dialog"
import { ProjectCard } from "@/components/project-card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea"
import { api, type Project } from "@/lib/api"

export const Route = createFileRoute("/dashboard/projects")({
  component: ProjectsPage,
})

interface CreateProjectForm {
  description: string
  genre: string
  targetWordCount: string
  title: string
  type: "novel" | "trilogy" | "series" | "short_story_collection" | "graphic_novel" | "screenplay"
  visibility: "private" | "organization" | "public"
}

function ProjectsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [createForm, setCreateForm] = useState<CreateProjectForm>({
    title: "",
    description: "",
    type: "novel",
    genre: "",
    targetWordCount: "",
    visibility: "private",
  })

  // Fetch projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const result = await api.projects.list()
      return result
    },
  })

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectForm) => {
      const result = await api.projects.create({
        title: data.title,
        description: data.description || null,
        type: data.type,
        genre: data.genre || null,
        targetWordCount: data.targetWordCount ? Number.parseInt(data.targetWordCount, 10) : null,
        visibility: data.visibility,
      })
      return result
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      setIsCreateDialogOpen(false)
      setCreateForm({
        title: "",
        description: "",
        type: "novel",
        genre: "",
        targetWordCount: "",
        visibility: "private",
      })
      // Drop new writers straight into the editor instead of back on the list
      navigate({ to: "/projects/$projectId/write", params: { projectId: result.id } })
    },
    onError: (_error) => {
      toast.error(t("createError", { defaultValue: "Failed to create project", ns: "projects" }))
    },
  })

  const handleCreateProject = () => {
    if (!createForm.title.trim()) {
      toast.error(t("titleRequired", { defaultValue: "Title is required", ns: "projects" }))
      return
    }
    createProjectMutation.mutate(createForm)
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-lg">{t("actions.loading", { ns: "common" })}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{t("projects", { ns: "projects" })}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Title and Action */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl">{t("myProjects", { ns: "projects" })}</h1>
              <p className="mt-2">{t("projectDescription", { ns: "projects" })}</p>
            </div>

            <Dialog onOpenChange={setIsCreateDialogOpen} open={isCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  {t("newProject", { ns: "projects" })}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {t("createNewProject", { defaultValue: "Create New Project", ns: "projects" })}
                  </DialogTitle>
                  <DialogDescription>
                    {t("createProjectDesc", {
                      defaultValue:
                        "Start your next writing project. You can always edit these details later.",
                      ns: "projects",
                    })}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      {t("title", { defaultValue: "Title", ns: "projects" })} *
                    </Label>
                    <Input
                      id="title"
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder={t("titlePlaceholder", {
                        defaultValue: "The Great Adventure",
                        ns: "projects",
                      })}
                      value={createForm.title}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      {t("description", { defaultValue: "Description", ns: "projects" })}
                    </Label>
                    <Textarea
                      id="description"
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder={t("descriptionPlaceholder", {
                        defaultValue: "A brief description of your project...",
                        ns: "projects",
                      })}
                      value={createForm.description}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">
                        {t("projectType", { defaultValue: "Project Type", ns: "projects" })}
                      </Label>
                      <Select
                        onValueChange={(
                          value:
                            | "novel"
                            | "trilogy"
                            | "series"
                            | "short_story_collection"
                            | "graphic_novel"
                            | "screenplay"
                        ) => setCreateForm((prev) => ({ ...prev, type: value }))}
                        value={createForm.type}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novel">
                            {t("types.novel", { defaultValue: "Novel", ns: "projects" })}
                          </SelectItem>
                          <SelectItem value="trilogy">
                            {t("types.trilogy", { defaultValue: "Trilogy", ns: "projects" })}
                          </SelectItem>
                          <SelectItem value="series">
                            {t("types.series", { defaultValue: "Series", ns: "projects" })}
                          </SelectItem>
                          <SelectItem value="short_story_collection">
                            {t("types.short_story_collection", {
                              defaultValue: "Short Story Collection",
                              ns: "projects",
                            })}
                          </SelectItem>
                          <SelectItem value="graphic_novel">
                            {t("types.graphic_novel", {
                              defaultValue: "Graphic Novel",
                              ns: "projects",
                            })}
                          </SelectItem>
                          <SelectItem value="screenplay">
                            {t("types.screenplay", { defaultValue: "Screenplay", ns: "projects" })}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="genre">
                          {t("genre", { defaultValue: "Genre", ns: "projects" })}
                        </Label>
                        <Input
                          id="genre"
                          onChange={(e) =>
                            setCreateForm((prev) => ({ ...prev, genre: e.target.value }))
                          }
                          placeholder={t("genrePlaceholder", {
                            defaultValue: "e.g., Fantasy, Sci-Fi",
                            ns: "projects",
                          })}
                          value={createForm.genre}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="targetWordCount">
                          {t("targetWordCount", { defaultValue: "Target Words", ns: "projects" })}
                        </Label>
                        <Input
                          id="targetWordCount"
                          onChange={(e) =>
                            setCreateForm((prev) => ({ ...prev, targetWordCount: e.target.value }))
                          }
                          placeholder="50000"
                          type="number"
                          value={createForm.targetWordCount}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="visibility">
                        {t("visibility", { defaultValue: "Visibility", ns: "projects" })}
                      </Label>
                      <Select
                        onValueChange={(value: "private" | "organization" | "public") =>
                          setCreateForm((prev) => ({ ...prev, visibility: value }))
                        }
                        value={createForm.visibility}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">
                            {t("visibilities.private", { defaultValue: "Private", ns: "projects" })}
                          </SelectItem>
                          <SelectItem value="organization">
                            {t("visibilities.organization", {
                              defaultValue: "Organization",
                              ns: "projects",
                            })}
                          </SelectItem>
                          <SelectItem value="public">
                            {t("visibilities.public", { defaultValue: "Public", ns: "projects" })}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={() => setIsCreateDialogOpen(false)} variant="outline">
                    {t("actions.cancel", { defaultValue: "Cancel", ns: "common" })}
                  </Button>
                  <Button disabled={createProjectMutation.isPending} onClick={handleCreateProject}>
                    {createProjectMutation.isPending
                      ? t("creating", { defaultValue: "Creating...", ns: "projects" })
                      : t("createProject", { defaultValue: "Create Project", ns: "projects" })}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Projects Grid */}
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: Project) => (
              <ProjectCard key={project.id} onEdit={setEditingProject} project={project} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <BookOpen className="mx-auto mb-4 h-16 w-16 opacity-50" />
            <h3 className="mb-2 font-medium text-xl">
              {t("noProjects", { defaultValue: "No projects yet", ns: "projects" })}
            </h3>
            <p className="mb-6">
              {t("noProjectsDesc", {
                defaultValue: "Create your first project to get started writing!",
                ns: "projects",
              })}
            </p>
            <Button className="flex items-center gap-2" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("createFirstProject", {
                defaultValue: "Create Your First Project",
                ns: "projects",
              })}
            </Button>
          </div>
        )}

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
