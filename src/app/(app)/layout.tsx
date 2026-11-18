import Link from "next/link";
import { Suspense } from "react";

import { BottomNav, BottomNavLinks, TopNav, TopNavLinks } from "@/components/app/nav";

import { UserMenu } from "./user-menu";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
          <Link href="/" className="font-semibold tracking-tight">
            EvoluFit
          </Link>
          <Suspense fallback={<TopNavLinks pathname={null} />}>
            <TopNav />
          </Suspense>
          <div className="ml-auto">
            <Suspense fallback={null}>
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-24 md:pb-10">{children}</main>
      <Suspense fallback={<BottomNavLinks pathname={null} />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
