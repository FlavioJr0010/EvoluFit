import { LinkButton } from "@/components/app/link-button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">O registro não existe ou foi removido.</p>
      <LinkButton href="/" variant="outline">
        Voltar para o início
      </LinkButton>
    </main>
  );
}
