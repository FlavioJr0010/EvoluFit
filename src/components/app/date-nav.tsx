"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDays, formatDateLong, isDateString } from "@/lib/dates";

/** Navegação por data via ?data=YYYY-MM-DD. */
export function DateNav({ date, today }: { date: string; today: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const go = (next: string) => {
    if (!isDateString(next)) return;
    router.push(next === today ? pathname : `${pathname}?data=${next}`);
  };

  return (
    <div className="mb-5 flex items-center gap-2">
      <Button variant="outline" size="icon-lg" aria-label="Dia anterior" onClick={() => go(addDays(date, -1))}>
        <ChevronLeft />
      </Button>
      <div className="flex min-w-0 flex-1 flex-col items-center">
        <Input
          type="date"
          aria-label="Data"
          value={date}
          max={addDays(today, 365)}
          onChange={(e) => go(e.target.value)}
          className="h-9 w-auto text-center"
        />
        <span className="mt-1 text-xs capitalize text-muted-foreground">
          {date === today ? "Hoje" : formatDateLong(date)}
        </span>
      </div>
      <Button variant="outline" size="icon-lg" aria-label="Próximo dia" onClick={() => go(addDays(date, 1))}>
        <ChevronRight />
      </Button>
    </div>
  );
}
