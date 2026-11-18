import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfile } from "@/lib/data/context";

import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Perfil" };

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Perfil" description="O fuso horário define qual é o “hoje” dos seus registros." backHref="/mais" />
      <Card className="max-w-lg">
        <CardContent>
          <Suspense fallback={<Skeleton className="h-40" />}>
            <ProfileContent />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
}

async function ProfileContent() {
  const profile = await getProfile();
  const timezones = Intl.supportedValuesOf("timeZone");
  return <ProfileForm profile={profile} timezones={timezones} />;
}
