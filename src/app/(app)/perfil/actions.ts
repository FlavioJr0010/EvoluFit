"use server";

import { refresh } from "next/cache";

import { authed } from "@/lib/data/context";
import { dbErrorMessage } from "@/lib/data/errors";
import { fieldErrorsFrom, formString, type FormState } from "@/lib/forms";
import { profileSchema } from "@/lib/validation/profile";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = profileSchema.safeParse({
    display_name: formString(formData, "display_name"),
    timezone: formString(formData, "timezone"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };

  const { supabase, user } = await authed();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { status: "error", message: dbErrorMessage(error) };

  refresh();
  return { status: "success", message: "Perfil atualizado." };
}
