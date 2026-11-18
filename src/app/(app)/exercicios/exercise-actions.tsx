"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { deleteExercise, setExerciseArchived } from "./actions";

export function ExerciseActions({ id, archived, used }: { id: string; archived: boolean; used: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={pending} onClick={() => startTransition(async () => setMessage((await setExerciseArchived(id, !archived)).message ?? null))}>
          {archived ? "Restaurar" : "Arquivar"}
        </Button>
        {!used ? (
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => {
              if (!window.confirm("Excluir este exercício definitivamente?")) return;
              startTransition(async () => setMessage((await deleteExercise(id))?.message ?? null));
            }}
          >
            Excluir
          </Button>
        ) : null}
      </div>
      {message ? <p className="text-sm text-muted-foreground" role="status">{message}</p> : null}
    </div>
  );
}
