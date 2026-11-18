"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

import { deleteCheckin } from "./actions";

export function DeleteCheckinButton({ date }: { date: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (window.confirm("Excluir o registro deste dia?")) startTransition(() => void deleteCheckin(date));
      }}
    >
      Excluir registro do dia
    </Button>
  );
}
