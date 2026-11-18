import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Informe o e-mail.")
  .pipe(z.email("E-mail inválido."));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Informe a senha."),
});

export const forgotPasswordSchema = z.object({ email });

/** Espelha a política do Supabase Auth: mínimo 8, letras e números. */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .regex(/[A-Za-z]/, "A senha deve conter letras.")
      .regex(/\d/, "A senha deve conter números."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
