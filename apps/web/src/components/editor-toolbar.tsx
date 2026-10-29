import type { Editor } from "@tiptap/react"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Pilcrow,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"

interface EditorToolbarProps {
  editor: Editor
}

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#fef08a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Blue", value: "#bfdbfe" },
  { name: "Pink", value: "#fbcfe8" },
  { name: "Purple", value: "#e9d5ff" },
]

const HEADINGS = [
  { level: 1, icon: Heading1, label: "Heading 1" },
  { level: 2, icon: Heading2, label: "Heading 2" },
  { level: 3, icon: Heading3, label: "Heading 3" },
] as const

function ToolbarSeparator() {
  return <Separator className="mx-1 h-6 shrink-0" orientation="vertical" />
}

function HeadingMenu({ editor }: EditorToolbarProps) {
  const active = HEADINGS.find((h) => editor.isActive("heading", { level: h.level }))
  const ActiveIcon = active?.icon ?? Pilcrow

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-8 w-8 p-0" size="sm" title="Text style" variant="ghost">
          <ActiveIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
          <Pilcrow className="mr-2 h-4 w-4" /> Paragraph
        </DropdownMenuItem>
        {HEADINGS.map(({ level, icon: Icon, label }) => (
          <DropdownMenuItem
            key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          >
            <Icon className="mr-2 h-4 w-4" /> {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function HighlightMenu({ editor }: EditorToolbarProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Toggle
          className="h-8 w-8 p-0"
          pressed={editor.isActive("highlight")}
          size="sm"
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </Toggle>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {HIGHLIGHT_COLORS.map((color) => (
          <DropdownMenuItem
            key={color.value}
            onClick={() => editor.chain().focus().toggleHighlight({ color: color.value }).run()}
          >
            <span
              className="mr-2 inline-block h-4 w-4 rounded-sm border"
              style={{ backgroundColor: color.value }}
            />
            {color.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={() => editor.chain().focus().unsetHighlight().run()}>
          <span className="mr-2 inline-block h-4 w-4 rounded-sm border bg-background" />
          None
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LinkControl({ editor }: EditorToolbarProps) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")

  const isActive = editor.isActive("link")

  const handleToggle = () => {
    if (isActive) {
      editor.chain().focus().unsetLink().run()
      return
    }
    setUrl(editor.getAttributes("link").href ?? "")
    setOpen(true)
  }

  const applyLink = () => {
    const trimmed = url.trim()
    if (trimmed) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run()
    }
    setOpen(false)
    setUrl("")
  }

  return (
    <>
      <Toggle
        className="h-8 w-8 p-0"
        onPressedChange={handleToggle}
        pressed={isActive}
        size="sm"
        title={isActive ? "Remove link" : "Add link"}
      >
        <LinkIcon className="h-4 w-4" />
      </Toggle>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add link</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  applyLink()
                }
              }}
              placeholder="https://example.com"
              value={url}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={!url.trim()} onClick={applyLink} type="button">
              Add link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const { t } = useTranslation()

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b bg-background px-2 py-1.5 [&>button]:shrink-0"
      data-testid="editor-toolbar"
    >
      <Button
        className="h-8 w-8 p-0"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
        size="sm"
        title={t("formatting.undo", { defaultValue: "Undo", ns: "editor" })}
        type="button"
        variant="ghost"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        className="h-8 w-8 p-0"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
        size="sm"
        title={t("formatting.redo", { defaultValue: "Redo", ns: "editor" })}
        type="button"
        variant="ghost"
      >
        <Redo2 className="h-4 w-4" />
      </Button>

      <ToolbarSeparator />

      <HeadingMenu editor={editor} />

      <ToolbarSeparator />

      <Toggle
        className="h-8 w-8 p-0"
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        pressed={editor.isActive("bold")}
        size="sm"
        title={t("formatting.bold", { defaultValue: "Bold", ns: "editor" })}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        className="h-8 w-8 p-0"
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        pressed={editor.isActive("italic")}
        size="sm"
        title={t("formatting.italic", { defaultValue: "Italic", ns: "editor" })}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        className="h-8 w-8 p-0"
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        pressed={editor.isActive("underline")}
        size="sm"
        title={t("formatting.underline", { defaultValue: "Underline", ns: "editor" })}
      >
        <Underline className="h-4 w-4" />
      </Toggle>
      <Toggle
        className="h-8 w-8 p-0"
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        pressed={editor.isActive("strike")}
        size="sm"
        title={t("formatting.strikethrough", { defaultValue: "Strikethrough", ns: "editor" })}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Toggle
        className="h-8 w-8 p-0"
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
        pressed={editor.isActive("code")}
        size="sm"
        title={t("formatting.code", { defaultValue: "Inline code", ns: "editor" })}
      >
        <Code className="h-4 w-4" />
      </Toggle>
      <HighlightMenu editor={editor} />

      <ToolbarSeparator />

      <Toggle
        className="h-8 w-8 p-0"
        onPressedChange={() => editor.chain().focus().setTextAlign("left").run()}
        pressed={editor.isActive({ textAlign: "left" })}
        size="sm"
        title={t("formatting.alignLeft", { defaultValue: "Align left", ns: "editor" })}
      >
        <AlignLeft className="h-4 w-4" />
      </Toggle>
      <Toggle
        className="h-8 w-8 p-0"
        onPressedChange={() => editor.chain().focus().setTextAlign("center").run()}
        pressed={editor.isActive({ textAlign: "center" })}
        size="sm"
        title={t("formatting.alignCenter", { defaultValue: "Align center", ns: "editor" })}
      >
        <AlignCenter className="h-4 w-4" />
      </Toggle>
      <Toggle
        className="h-8 w-8 p-0"
        onPressedChange={() => editor.chain().focus().setTextAlign("right").run()}
        pressed={editor.isActive({ textAlign: "right" })}
        size="sm"
        title={t("formatting.alignRight", { defaultValue: "Align right", ns: "editor" })}
      >
        <AlignRight className="h-4 w-4" />
      </Toggle>
      <Toggle
        className="h-8 w-8 p-0"
        onPressedChange={() => editor.chain().focus().setTextAlign("justify").run()}
        pressed={editor.isActive({ textAlign: "justify" })}
        size="sm"
        title={t("formatting.alignJustify", { defaultValue: "Justify", ns: "editor" })}
      >
        <AlignJustify className="h-4 w-4" />
      </Toggle>

      <ToolbarSeparator />

      <Toggle
        className="h-8 w-8 p-0"
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        pressed={editor.isActive("bulletList")}
        size="sm"
        title={t("formatting.bulletList", { defaultValue: "Bullet list", ns: "editor" })}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        className="h-8 w-8 p-0"
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        pressed={editor.isActive("orderedList")}
        size="sm"
        title={t("formatting.numberedList", { defaultValue: "Numbered list", ns: "editor" })}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle
        className="h-8 w-8 p-0"
        onPressedChange={() => editor.chain().focus().toggleTaskList().run()}
        pressed={editor.isActive("taskList")}
        size="sm"
        title={t("formatting.taskList", { defaultValue: "Task list", ns: "editor" })}
      >
        <ListTodo className="h-4 w-4" />
      </Toggle>
      <Toggle
        className="h-8 w-8 p-0"
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        pressed={editor.isActive("blockquote")}
        size="sm"
        title={t("formatting.quote", { defaultValue: "Blockquote", ns: "editor" })}
      >
        <Quote className="h-4 w-4" />
      </Toggle>
      <Toggle
        className="h-8 w-8 p-0"
        onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        pressed={editor.isActive("codeBlock")}
        size="sm"
        title={t("formatting.code", { defaultValue: "Code block", ns: "editor" })}
      >
        <SquareCode className="h-4 w-4" />
      </Toggle>

      <ToolbarSeparator />

      <LinkControl editor={editor} />
    </div>
  )
}
