import { z } from "zod";

export const CONSENT_TEXT =
  "Aceito receber as práticas gratuitas da semana e a reflexão mensal do Open For You, e aceito a política de privacidade.";

export const newsletterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Indica o teu nome.")
    .max(80, "O nome é demasiado longo."),
  email: z
    .string()
    .trim()
    .max(254, "O email é demasiado longo.")
    .email("Indica um email válido."),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Precisamos do teu consentimento para enviar emails." }),
  }),
  // Campo isco anti-spam: pessoas não o veem nem preenchem.
  website: z.string().max(200).optional(),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

const nameField = z
  .string()
  .trim()
  .min(1, "Indica o teu nome.")
  .max(80, "O nome é demasiado longo.");

const emailField = z
  .string()
  .trim()
  .max(254, "O email é demasiado longo.")
  .email("Indica um email válido.");

export const passwordSchema = z
  .string()
  .min(10, "A palavra-passe deve ter pelo menos 10 caracteres.")
  .max(128, "A palavra-passe é demasiado longa.");

export const registerSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordSchema,
  terms: z.literal(true, {
    errorMap: () => ({
      message: "Para criar conta, aceita os termos, a privacidade e as regras da comunidade.",
    }),
  }),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Indica a palavra-passe."),
});

export const forgotSchema = z.object({ email: emailField });

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "As palavras-passe não coincidem.",
  });

export const profileSchema = z.object({
  name: nameField,
  timezone: z.string().min(1, "Escolhe um fuso horário.").max(64),
});
