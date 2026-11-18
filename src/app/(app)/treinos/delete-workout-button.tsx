"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

import { deleteWorkout } from "./actions";

export function DeleteWorkoutButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="destructive"
      size="lg"
      disabled={pending}
      onClick={() => {
        if (window.confirm("Excluir este treino e todas as séries?")) startTransition(() => void deleteWorkout(id));
      }}
    >
      Excluir
    </Button>
  );
}
