import { db, emailOutboxTable } from "@workspace/db";
import { logger } from "./logger";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(msg: EmailMessage): Promise<void>;
}

class MockEmailProvider implements EmailProvider {
  readonly name = "mock";
  private readonly senderEmail: string;

  constructor(senderEmail: string) {
    this.senderEmail = senderEmail;
  }

  async send(msg: EmailMessage) {
    const [row] = await db
      .insert(emailOutboxTable)
      .values({
        toEmail: msg.to,
        fromEmail: this.senderEmail,
        subject: msg.subject,
        htmlBody: msg.html,
        textBody: msg.text ?? null,
        template: msg.template ?? null,
        status: "queued",
      })
      .returning({ id: emailOutboxTable.id });
    if (row?.id) {
      await db.update(emailOutboxTable).set({ status: "sent", sentAt: new Date() }).where(drizzleEq(emailOutboxTable.id, row.id));
    }
    logger.info({ to: msg.to, subject: msg.subject, template: msg.template }, "[email] sent (mock)");
  }
}

class BrevoEmailProvider implements EmailProvider {
  readonly name = "brevo";
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(apiKey: string, senderEmail: string, senderName: string) {
    this.apiKey = apiKey;
    this.senderEmail = senderEmail;
    this.senderName = senderName;
  }

  async send(msg: EmailMessage): Promise<void> {
    const [row] = await db
      .insert(emailOutboxTable)
      .values({
        toEmail: msg.to,
        fromEmail: this.senderEmail,
        subject: msg.subject,
        htmlBody: msg.html,
        textBody: msg.text ?? null,
        template: msg.template ?? null,
        status: "queued",
      })
      .returning({ id: emailOutboxTable.id });
    const outboxId = row?.id;

    try {
      const r = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { email: this.senderEmail, name: this.senderName },
          to: [{ email: msg.to }],
          subject: msg.subject,
          htmlContent: msg.html,
          ...(msg.text ? { textContent: msg.text } : {}),
          ...(msg.template ? { tags: [msg.template] } : {}),
        }),
      });

      if (!r.ok) {
        const text = await r.text();
        logger.error(
          { status: r.status, to: msg.to, template: msg.template, body: text.slice(0, 500) },
          "[email:brevo] send failed",
        );
        if (outboxId) {
          await db.update(emailOutboxTable).set({ status: "failed", errorMessage: text.slice(0, 1000) }).where(eqOutbox(outboxId));
        }
        throw new Error(`Brevo error ${r.status}: ${text.slice(0, 200)}`);
      }

      const json = (await r.json().catch(() => ({}))) as { messageId?: string };
      if (outboxId) {
        await db
          .update(emailOutboxTable)
          .set({ status: "sent", sentAt: new Date() })
          .where(eqOutbox(outboxId));
      }
      logger.info(
        { to: msg.to, subject: msg.subject, template: msg.template, messageId: json.messageId },
        "[email:brevo] sent",
      );
    } catch (err) {
      if (outboxId) {
        await db
          .update(emailOutboxTable)
          .set({ status: "failed", errorMessage: err instanceof Error ? err.message.slice(0, 1000) : String(err) })
          .where(eqOutbox(outboxId))
          .catch(() => undefined);
      }
      throw err;
    }
  }
}

import { eq as drizzleEq } from "drizzle-orm";
const eqOutbox = (id: number) => drizzleEq(emailOutboxTable.id, id);

const brevoApiKey = process.env["BREVO_API_KEY"];
const brevoSenderEmail = process.env["BREVO_SENDER_EMAIL"] ?? "contact@cannazen.fr";
const brevoSenderName = process.env["BREVO_SENDER_NAME"] ?? "CannaZen";

export const emailProvider: EmailProvider = brevoApiKey
  ? new BrevoEmailProvider(brevoApiKey, brevoSenderEmail, brevoSenderName)
  : new MockEmailProvider(brevoSenderEmail);

export const isBrevoActive = emailProvider.name === "brevo";

logger.info(
  { provider: emailProvider.name, sender: brevoSenderEmail, senderName: brevoSenderName },
  "[email] provider initialized",
);

const APP_URL = process.env.APP_URL ?? "http://localhost:80";

const baseTemplate = (title: string, body: string) => `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0b0b0b;font-family:'DM Sans',Arial,sans-serif;color:#e6e6e6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#141414;">
    <tr><td style="padding:40px 30px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.2);">
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;color:#C9A84C;font-style:italic;font-size:32px;margin:0;letter-spacing:2px;">CannaZen</h1>
    </td></tr>
    <tr><td style="padding:40px 30px;line-height:1.6;color:#e6e6e6;">${body}</td></tr>
    <tr><td style="padding:30px;text-align:center;background:#0b0b0b;font-size:12px;color:#888;border-top:1px solid rgba(201,168,76,0.1);">
      <p style="margin:0;">CannaZen — CBD légal &lt; 0,3% THC — Réservé aux +18 ans</p>
      <p style="margin:8px 0 0;">&copy; ${new Date().getFullYear()} CannaZen. Ne pas conduire sous influence.</p>
    </td></tr>
  </table>
</body></html>`;

const button = (label: string, url: string) =>
  `<p style="text-align:center;margin:32px 0;"><a href="${url}" style="display:inline-block;padding:16px 36px;background:transparent;border:1px solid #C9A84C;color:#C9A84C;text-decoration:none;letter-spacing:2px;font-size:13px;text-transform:uppercase;border-radius:999px;">${label}</a></p>`;

export const templates = {
  verifyEmail: (firstName: string, token: string) => ({
    subject: "Confirmez votre adresse email — CannaZen",
    template: "verify-email",
    html: baseTemplate("Vérification email", `
      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;color:#C9A84C;font-style:italic;">Bienvenue dans le jardin, ${firstName}</h2>
      <p>Merci pour votre inscription. Pour activer votre compte, confirmez votre adresse email en cliquant sur le bouton ci-dessous.</p>
      ${button("Vérifier mon email", `${APP_URL}/verifier-email?token=${token}`)}
      <p style="font-size:13px;color:#888;">Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.</p>
    `),
  }),
  resetPassword: (firstName: string, token: string) => ({
    subject: "Réinitialisation de votre mot de passe — CannaZen",
    template: "reset-password",
    html: baseTemplate("Réinitialisation", `
      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;color:#C9A84C;font-style:italic;">Bonjour ${firstName}</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe. Ce lien expire dans 1 heure.</p>
      ${button("Choisir un nouveau mot de passe", `${APP_URL}/reinitialiser-mdp?token=${token}`)}
      <p style="font-size:13px;color:#888;">Si vous n'avez rien demandé, ignorez ce message.</p>
    `),
  }),
  orderConfirmation: (firstName: string, orderNumber: string, total: string) => ({
    subject: `Commande ${orderNumber} confirmée — CannaZen`,
    template: "order-confirmation",
    html: baseTemplate("Commande confirmée", `
      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;color:#C9A84C;font-style:italic;">Merci ${firstName}</h2>
      <p>Votre commande <strong style="color:#C9A84C;">${orderNumber}</strong> est confirmée. Total : <strong>${total} €</strong>.</p>
      <p>Nous préparons votre colis avec soin. Vous recevrez un email dès l'expédition avec le numéro de suivi.</p>
      ${button("Voir ma commande", `${APP_URL}/mes-commandes`)}
    `),
  }),
  orderShipped: (firstName: string, orderNumber: string, trackingNumber: string, trackingUrl: string) => ({
    subject: `Votre commande ${orderNumber} est en route`,
    template: "order-shipped",
    html: baseTemplate("Commande expédiée", `
      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;color:#C9A84C;font-style:italic;">${firstName}, votre colis voyage</h2>
      <p>Numéro de suivi : <strong style="color:#C9A84C;">${trackingNumber}</strong></p>
      ${button("Suivre mon colis", trackingUrl)}
    `),
  }),
  orderDelivered: (firstName: string, orderNumber: string, productSlug: string) => ({
    subject: "Comment s'est passée votre expérience ?",
    template: "order-delivered",
    html: baseTemplate("Donnez votre avis", `
      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;color:#C9A84C;font-style:italic;">Bonjour ${firstName}</h2>
      <p>Votre commande ${orderNumber} a été livrée. Quelques mots sur votre expérience aideront grandement notre communauté.</p>
      ${button("Laisser un avis", `${APP_URL}/boutique/${productSlug}#avis`)}
    `),
  }),
  abandonedCart: (firstName: string) => ({
    subject: "Votre panier vous attend — CannaZen",
    template: "abandoned-cart",
    html: baseTemplate("Panier abandonné", `
      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;color:#C9A84C;font-style:italic;">Vous avez oublié quelque chose, ${firstName} ?</h2>
      <p>Votre sélection patiente dans votre panier. Profitez de la livraison offerte dès 49€.</p>
      ${button("Reprendre ma commande", `${APP_URL}/panier`)}
    `),
  }),
  birthday: (firstName: string, code: string) => ({
    subject: "Joyeux anniversaire — un cadeau pour vous",
    template: "birthday",
    html: baseTemplate("Anniversaire", `
      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;color:#C9A84C;font-style:italic;">Joyeux anniversaire ${firstName}</h2>
      <p>Pour célébrer votre journée, voici un code promo de -15% sur votre prochaine commande :</p>
      <p style="text-align:center;font-size:28px;letter-spacing:4px;color:#C9A84C;margin:24px 0;font-family:'Cormorant Garamond',Georgia,serif;">${code}</p>
    `),
  }),
  newsletter: (subject: string, content: string) => ({
    subject,
    template: "newsletter",
    html: baseTemplate(subject, content),
  }),
};

export async function sendTemplate(
  to: string,
  tmpl: { subject: string; html: string; template: string },
): Promise<void> {
  try {
    await emailProvider.send({ to, ...tmpl });
  } catch (err) {
    logger.error(
      { err, to, template: tmpl.template, provider: emailProvider.name },
      "[email] send failed",
    );
  }
}
