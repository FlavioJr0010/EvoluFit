import { Apple, ChevronRight, CookingPot, Dumbbell, LogOut, Scale, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";

import { logout } from "../../(auth)/actions";

export const metadata: Metadata = { title: "Mais" };

const LINKS = [
  { href: "/acompanhamento", label: "Peso e água", description: "Registro diário", icon: Scale },
  { href: "/alimentos", label: "Alimentos", description: "Cadastro e nutrientes", icon: Apple },
  { href: "/preparacoes", label: "Preparações", description: "Receitas compostas", icon: CookingPot },
  { href: "/exercicios", label: "Exercícios", description: "Catálogo pessoal", icon: Dumbbell },
  { href: "/perfil", label: "Perfil", description: "Nome e fuso horário", icon: User },
];

export default function MorePage() {
  return (
    <>
      <PageHeader title="Mais" />
      <Card className="gap-0 divide-y py-0">
        {LINKS.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50">
            <Icon className="size-5 text-muted-foreground" aria-hidden />
            <span className="flex-1">
              <span className="block font-medium">{label}</span>
              <span className="block text-sm text-muted-foreground">{description}</span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
          </Link>
        ))}
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-destructive hover:bg-muted/50">
            <LogOut className="size-5" aria-hidden />
            <span className="font-medium">Sair</span>
          </button>
        </form>
      </Card>
    </>
  );
}
