"use client";

import { Search, X } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";

export type PickerOption = { value: string; label: string; hint?: string; group?: string };

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Campo de busca com lista de resultados (bom para listas longas no celular). */
export function SearchPicker({
  options,
  onPick,
  placeholder = "Buscar…",
  label,
  emptyText = "Nada encontrado.",
}: {
  options: PickerOption[];
  onPick: (option: PickerOption) => void;
  placeholder?: string;
  label: string;
  emptyText?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const listId = useId();

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    const list = q ? options.filter((o) => normalize(o.label).includes(q)) : options;
    return list.slice(0, 30);
  }, [options, query]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={listId}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter") {
              e.preventDefault();
              if (matches[0]) {
                onPick(matches[0]);
                setQuery("");
                setOpen(false);
              }
            }
          }}
          className="h-10 pr-9 pl-8"
        />
        {query ? (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-md"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</li>
          ) : (
            matches.map((o) => (
              <li key={o.value} role="option" aria-selected={false}>
                <button
                  type="button"
                  className="flex w-full items-baseline justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick(o);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span>
                    {o.label}
                    {o.group ? <span className="ml-2 text-xs text-muted-foreground">{o.group}</span> : null}
                  </span>
                  {o.hint ? <span className="shrink-0 text-xs text-muted-foreground">{o.hint}</span> : null}
                </button>
              </li>
            ))
          )}
          <li>
            <button type="button" className="w-full px-3 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
