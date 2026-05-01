/** Admin client tags — create, edit, and delete contact tags. */
"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ChevronLeft, Pencil, Plus, Trash2 } from "lucide-react";

import { CrudModal } from "@/components/admin/crud-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getCssVarColor } from "@/lib/css-vars";
import { createTag, listTags, updateTag } from "@/lib/services/tags";
import type { ContactTag } from "@/lib/types";

const TAG_DEFAULT_COLOR_VAR = "--tag-default-color";

export default function AdminClientTagsPage() {
  const [tags, setTags] = useState<ContactTag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);
  const [defaultTagColor, setDefaultTagColor] = useState("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIsAuto, setNewIsAuto] = useState(false);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIsAuto, setEditIsAuto] = useState(false);

  useEffect(() => {
    const resolvedTagColor = getCssVarColor(TAG_DEFAULT_COLOR_VAR);
    if (!resolvedTagColor) {
      return;
    }

    setDefaultTagColor(resolvedTagColor);
    setNewColor((prev) => prev || resolvedTagColor);
    setEditColor((prev) => prev || resolvedTagColor);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadTags(): Promise<void> {
      setIsLoadingTags(true);
      setTagsError(null);

      try {
        const { tags: fetchedTags } = await listTags({ page: 1, limit: 20 });
        if (!isMounted) {
          return;
        }
        setTags(fetchedTags);
      } catch {
        if (!isMounted) {
          return;
        }
        setTagsError("Failed to load tags. Please try again.");
      } finally {
        if (isMounted) {
          setIsLoadingTags(false);
        }
      }
    }

    void loadTags();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newName.trim()) {
      return;
    }

    setIsCreatingTag(true);
    setTagsError(null);

    try {
      const createdTag = await createTag({
        name: newName.trim(),
        color: newColor,
        isAuto: newIsAuto,
      });

      const tag: ContactTag = {
        ...createdTag,
        description: newDesc.trim() || undefined,
      };
      setTags((prev) => [tag, ...prev]);
      setNewName("");
      setNewDesc("");
      setNewColor(defaultTagColor);
      setNewIsAuto(false);
      setCreating(false);
    } catch {
      setTagsError("Failed to create tag. Please try again.");
    } finally {
      setIsCreatingTag(false);
    }
  }

  function confirmDelete() {
    if (deleteId) {
      setTags((prev) => prev.filter((tag) => tag.id !== deleteId));
      setDeleteId(null);
    }
  }

  function openEditModal(tag: ContactTag): void {
    setEditingTagId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
    setEditDesc(tag.description ?? "");
    setEditIsAuto(tag.isAuto ?? false);
  }

  async function handleSaveTagEdits(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!editingTagId || !editName.trim()) {
      return;
    }

    setIsUpdatingTag(true);
    setTagsError(null);

    try {
      const updated = await updateTag(editingTagId, {
        name: editName.trim(),
        color: editColor,
        isAuto: editIsAuto,
      });
      setTags((prev) =>
        prev.map((item) =>
          item.id === editingTagId
            ? {
                ...item,
                ...updated,
                description: editDesc.trim() || undefined,
              }
            : item,
        ),
      );
      setEditingTagId(null);
    } catch {
      setTagsError("Failed to update tag. Please try again.");
    } finally {
      setIsUpdatingTag(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/clients"
            className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            All clients
          </Link>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-barlow)" }}
          >
            Tags
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Colour-coded labels for segments and automation.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="gap-2"
          onClick={() => setCreating(true)}
        >
          <Plus className="h-4 w-4" />
          New tag
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoadingTags ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="py-6 text-sm text-muted-foreground">
              Loading tags...
            </CardContent>
          </Card>
        ) : null}
        {tagsError ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="py-6 text-sm text-destructive">
              {tagsError}
            </CardContent>
          </Card>
        ) : null}
        {tags.map((tag) => (
          <Card key={tag.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div
                className="h-10 w-10 shrink-0 rounded-lg border border-border"
                style={{ backgroundColor: tag.color }}
                aria-hidden
              />
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => openEditModal(tag)}
                  aria-label={`Edit ${tag.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive"
                  onClick={() => setDeleteId(tag.id)}
                  aria-label={`Delete ${tag.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor={`name-${tag.id}`}>Name</Label>
                <Input
                  id={`name-${tag.id}`}
                  value={tag.name}
                  readOnly
                />
                <p className="text-xs text-muted-foreground">
                  {`${tag.contactCount ?? 0} contact${(tag.contactCount ?? 0) === 1 ? '' : 's'}`}
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`color-${tag.id}`}>Colour</Label>
                <Input
                  id={`color-${tag.id}`}
                  type="color"
                  className="h-10 w-full cursor-pointer"
                  value={tag.color}
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`desc-${tag.id}`}>Description</Label>
                <Textarea
                  id={`desc-${tag.id}`}
                  rows={2}
                  value={tag.description ?? ""}
                  readOnly
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <Label htmlFor={`auto-${tag.id}`} className="text-xs">
                  Auto tag
                </Label>
                <Switch
                  id={`auto-${tag.id}`}
                  checked={tag.isAuto ?? false}
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CrudModal
        open={creating}
        onOpenChange={setCreating}
        title="New tag"
        description="Create a colour-coded label for contacts."
        size="sm"
        variant="create"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreating(false)}
              disabled={isCreatingTag}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="admin-tag-create-form"
              disabled={isCreatingTag}
            >
              {isCreatingTag ? "Creating..." : "Create"}
            </Button>
          </>
        }
      >
        <form
          id="admin-tag-create-form"
          onSubmit={handleCreate}
          className="space-y-3"
        >
          <div className="space-y-2">
            <Label htmlFor="nt-name">Name</Label>
            <Input
              id="nt-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nt-color">Colour</Label>
            <Input
              id="nt-color"
              type="color"
              className="h-10 w-full cursor-pointer"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nt-desc">Description</Label>
            <Textarea
              id="nt-desc"
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor="nt-auto" className="text-xs">
              Auto tag
            </Label>
            <Switch
              id="nt-auto"
              checked={newIsAuto}
              onCheckedChange={setNewIsAuto}
            />
          </div>
        </form>
      </CrudModal>

      <CrudModal
        open={editingTagId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTagId(null);
          }
        }}
        title="Edit tag"
        description="Update tag details."
        size="sm"
        variant="edit"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingTagId(null)}
              disabled={isUpdatingTag}
            >
              Cancel
            </Button>
            <Button type="submit" form="admin-tag-edit-form" disabled={isUpdatingTag}>
              {isUpdatingTag ? "Saving..." : "Save changes"}
            </Button>
          </>
        }
      >
        <form id="admin-tag-edit-form" onSubmit={handleSaveTagEdits} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="et-name">Name</Label>
            <Input
              id="et-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="et-color">Colour</Label>
            <Input
              id="et-color"
              type="color"
              className="h-10 w-full cursor-pointer"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="et-desc">Description</Label>
            <Textarea
              id="et-desc"
              rows={2}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor="et-auto" className="text-xs">
              Auto tag
            </Label>
            <Switch
              id="et-auto"
              checked={editIsAuto}
              onCheckedChange={setEditIsAuto}
            />
          </div>
        </form>
      </CrudModal>

      <CrudModal
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete tag?"
        description="This removes the tag from the directory. Assignments on contacts will be cleared."
        size="sm"
        variant="delete"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
