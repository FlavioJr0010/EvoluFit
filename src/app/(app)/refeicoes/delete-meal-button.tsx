"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

import { deleteMeal } from "./actions";

export function DeleteMealButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Excluir ${label}`}
      disabled={pending}
      onClick={() => {
        if (window.confirm(`Excluir a refeição “${label}”?`)) startTransition(() => void deleteMeal(id));
      }}
    >
      <Trash2 />
    </Button>
  );
}
