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

export const checkoutSchema = z.object({
  terms: z.literal(true),
  immediate: z.literal(true),
});

const optionalText = (max: number) => z.string().trim().max(max, "Texto demasiado longo.").optional();

export const contentSchema = z.object({
  kind: z.enum(["yoga", "meditation", "sound"]),
  title: z.string().trim().min(1, "Indica o título.").max(120, "O título é demasiado longo."),
  description: optionalText(2000),
  duration: z
    .string()
    .trim()
    .regex(/^\d{0,4}$/, "A duração tem de ser um número de minutos.")
    .optional(),
  teacher: optionalText(80),
  level: optionalText(40),
  intensity: optionalText(40),
  goal: optionalText(80),
  materials: optionalText(500),
  transcript: optionalText(20000),
  access: z.enum(["free", "premium"]),
  status: z.enum(["draft", "review", "published", "archived"]),
  publishAt: z.string().trim().optional(),
});

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Indica uma data válida.");

export const weeklySchema = z
  .object({
    startsOn: dateField,
    endsOn: dateField,
    theme: optionalText(120),
    reflection: optionalText(1000),
    yogaId: z.string().optional(),
    meditationId: z.string().optional(),
    soundId: z.string().optional(),
  })
  .refine((v) => v.endsOn >= v.startsOn, {
    path: ["endsOn"],
    message: "A data de fim tem de ser igual ou posterior à de início.",
  });
