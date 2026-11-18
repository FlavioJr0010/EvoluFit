"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { deleteFood, setFoodArchived } from "./actions";

export function FoodActions({ id, archived, used }: { id: string; archived: boolean; used: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await setFoodArchived(id, !archived);
              setMessage(r.message ?? null);
            })
          }
        >
          {archived ? "Restaurar alimento" : "Arquivar alimento"}
        </Button>
        {!used ? (
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => {
              if (!window.confirm("Excluir este alimento definitivamente?")) return;
              startTransition(async () => {
                const r = await deleteFood(id);
                setMessage(r?.message ?? null);
              });
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
