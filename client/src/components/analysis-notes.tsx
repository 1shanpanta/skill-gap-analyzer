"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { AnalysisNote } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquarePlus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface AnalysisNotesProps {
  analysisId: string;
}

export function AnalysisNotes({ analysisId }: AnalysisNotesProps) {
  const [notes, setNotes] = useState<AnalysisNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const fetchNotes = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/analyses/${analysisId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function handleAdd() {
    if (!newNote.trim()) return;
    setIsAdding(true);
    try {
      const res = await apiFetch(`/api/analyses/${analysisId}/notes`, {
        method: "POST",
        body: JSON.stringify({ content: newNote.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
      setNewNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleUpdate(noteId: string) {
    if (!editContent.trim()) return;
    try {
      const res = await apiFetch(
        `/api/analyses/${analysisId}/notes/${noteId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ content: editContent.trim() }),
        }
      );
      if (!res.ok) throw new Error("Failed to update note");
      const updated = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      setEditingId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleDelete(noteId: string) {
    try {
      const res = await apiFetch(
        `/api/analyses/${analysisId}/notes/${noteId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete note");
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Note deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquarePlus className="h-4 w-4" />
          Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add note */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note about this analysis..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            className="resize-y"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={isAdding || !newNote.trim()}
            >
              {isAdding && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Add Note
            </Button>
          </div>
        </div>

        {/* Notes list */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No notes yet. Add one above.
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border p-3 space-y-2"
              >
                {editingId === note.id ? (
                  <>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="resize-y"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(note.id)}
                        disabled={!editContent.trim()}
                      >
                        Save
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {note.updated_at !== note.created_at && " (edited)"}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingId(note.id);
                            setEditContent(note.content);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
