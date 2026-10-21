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
