"use client";

import { ChartLine, Dumbbell, Ellipsis, House, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const MAIN = [
  { href: "/", label: "Hoje", icon: House },
  { href: "/refeicoes", label: "Refeições", icon: UtensilsCrossed },
  { href: "/treinos", label: "Treinos", icon: Dumbbell },
  { href: "/evolucao", label: "Evolução", icon: ChartLine },
  { href: "/mais", label: "Mais", icon: Ellipsis },
] as const;

const SECONDARY = [
  { href: "/acompanhamento", label: "Peso e água" },
  { href: "/alimentos", label: "Alimentos" },
  { href: "/preparacoes", label: "Preparações" },
  { href: "/exercicios", label: "Exercícios" },
] as const;

const MAIS_SECTIONS = ["/mais", "/acompanhamento", "/alimentos", "/preparacoes", "/exercicios", "/perfil"];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/mais") return MAIS_SECTIONS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Navegação inferior (celular). */
export function BottomNav() {
  return <BottomNavLinks pathname={usePathname()} />;
}

/** Sem destaque do item ativo: usado como fallback estático (Suspense). */
export function BottomNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {MAIN.map(({ href, label, icon: Icon }) => {
          const active = pathname != null && isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors",
                  active && "text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Navegação no cabeçalho (desktop). */
export function TopNav() {
  return <TopNavLinks pathname={usePathname()} />;
}

export function TopNavLinks({ pathname }: { pathname: string | null }) {
  const items = [...MAIN.filter((i) => i.href !== "/mais"), ...SECONDARY];
  return (
    <nav aria-label="Navegação principal" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {items.map(({ href, label }) => {
          const active = pathname != null && isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-muted text-foreground",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
