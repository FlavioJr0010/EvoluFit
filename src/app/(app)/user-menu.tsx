import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";

import { logout } from "../(auth)/actions";

export async function UserMenu() {
  const user = await getCurrentUser();

  return (
    <form action={logout} className="flex items-center gap-3">
      <Link href="/perfil" className="hidden max-w-48 truncate text-sm text-muted-foreground hover:text-foreground md:inline">
        {user.email}
      </Link>
      <Button type="submit" variant="outline" size="sm" className="hidden md:inline-flex">
        Sair
      </Button>
    </form>
  );
}
