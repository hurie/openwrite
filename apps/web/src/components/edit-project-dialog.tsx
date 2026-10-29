import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

interface EditProjectForm {
  description: string
  genre: string
  targetWordCount: string
  title: string
  type: "novel" | "trilogy" | "series" | "short_story_collection" | "graphic_novel" | "screenplay"
  visibility: "private" | "organization" | "public"
}

interface EditProjectDialogProps {
  onOpenChange: (open: boolean) => void
  open: boolean
  project: Project
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editForm, setEditForm] = useState<EditProjectForm>({
    title: project.title,
    description: project.description || "",
    type: project.type,
    genre: project.genre || "",
    targetWordCount: project.targetWordCount?.toString() || "",
    visibility: project.visibility,
  })

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (data: EditProjectForm) => {
      if (!api.projects.update) {
        throw new Error("Update method not available")
      }
      const result = await api.projects.update(project.id, {
        title: data.title,
        description: data.description || null,
        type: data.type,
        genre: data.genre || null,
        targetWordCount: data.targetWordCount ? Number.parseInt(data.targetWordCount, 10) : null,
        visibility: data.visibility,
      })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      onOpenChange(false)
      toast.success(
        t("updateSuccess", { defaultValue: "Project updated successfully! ✨", ns: "projects" }),
        {
          description: t("updateSuccessDesc", {
            defaultValue: "Your changes have been saved.",
            ns: "projects",
          }),
        }
      )
    },
    onError: (error) => {
      toast.error(t("updateError", { defaultValue: "Failed to update project", ns: "projects" }), {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    },
  })

  const handleUpdateProject = () => {
    if (!editForm.title.trim()) {
      toast.error(t("titleRequired", { defaultValue: "Title is required", ns: "projects" }))
      return
    }
    updateProjectMutation.mutate(editForm)
  }

  const handleCancel = () => {
    // Reset form to original values
    setEditForm({
      title: project.title,
      description: project.description || "",
      type: project.type,
      genre: project.genre || "",
      targetWordCount: project.targetWordCount?.toString() || "",
      visibility: project.visibility,
    })
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("editProject", { defaultValue: "Edit Project", ns: "projects" })}
          </DialogTitle>
          <DialogDescription>
            {t("editProjectDesc", {
              defaultValue: "Update your project details. Changes will be saved immediately.",
              ns: "projects",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">
              {t("title", { defaultValue: "Title", ns: "projects" })} *
            </Label>
            <Input
              id="edit-title"
              onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder={t("titlePlaceholder", {
                defaultValue: "The Great Adventure",
                ns: "projects",
              })}
              value={editForm.title}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">
              {t("description", { defaultValue: "Description", ns: "projects" })}
            </Label>
            <Textarea
              id="edit-description"
              onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t("descriptionPlaceholder", {
                defaultValue: "A brief description of your project...",
                ns: "projects",
              })}
              value={editForm.description}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type">
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
                ) => setEditForm((prev) => ({ ...prev, type: value }))}
                value={editForm.type}
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
                    {t("types.graphic_novel", { defaultValue: "Graphic Novel", ns: "projects" })}
                  </SelectItem>
                  <SelectItem value="screenplay">
                    {t("types.screenplay", { defaultValue: "Screenplay", ns: "projects" })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-genre">
                  {t("genre", { defaultValue: "Genre", ns: "projects" })}
                </Label>
                <Input
                  id="edit-genre"
                  onChange={(e) => setEditForm((prev) => ({ ...prev, genre: e.target.value }))}
                  placeholder={t("genrePlaceholder", {
                    defaultValue: "e.g., Fantasy, Sci-Fi",
                    ns: "projects",
                  })}
                  value={editForm.genre}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-targetWordCount">
                  {t("targetWordCount", { defaultValue: "Target Words", ns: "projects" })}
                </Label>
                <Input
                  id="edit-targetWordCount"
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, targetWordCount: e.target.value }))
                  }
                  placeholder="50000"
                  type="number"
                  value={editForm.targetWordCount}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-visibility">
                {t("visibility", { defaultValue: "Visibility", ns: "projects" })}
              </Label>
              <Select
                onValueChange={(value: "private" | "organization" | "public") =>
                  setEditForm((prev) => ({ ...prev, visibility: value }))
                }
                value={editForm.visibility}
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
          <Button onClick={handleCancel} variant="outline">
            {t("actions.cancel", { defaultValue: "Cancel", ns: "common" })}
          </Button>
          <Button disabled={updateProjectMutation.isPending} onClick={handleUpdateProject}>
            {updateProjectMutation.isPending
              ? t("updating", { defaultValue: "Updating...", ns: "projects" })
              : t("updateProject", { defaultValue: "Update Project", ns: "projects" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
