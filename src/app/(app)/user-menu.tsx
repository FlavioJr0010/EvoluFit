import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";

import { logout } from "../(auth)/actions";

export async function UserMenu() {
  const user = await getCurrentUser();

  return (
    <form action={logout} className="flex items-center gap-3">
      <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
      <Button type="submit" variant="outline" size="sm">
        Sair
      </Button>
    </form>
  );
}
