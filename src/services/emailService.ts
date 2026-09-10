import { config } from "@/config/envConfig";
import ejs from "ejs";
import nodemailer from "nodemailer";
import path from "node:path";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, unknown>;
  text?: string;
  from?: string;
}

export const sendEmail = async ({
  to,
  subject,
  template,
  data,
  text,
}: SendEmailOptions): Promise<void> => {
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(template)) {
    throw new Error("Email template name is invalid.");
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_TRANSPORT } = config;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  const templatePath = path.resolve(__dirname, `../templates/emails/${template}.ejs`);
  const html = await ejs.renderFile(templatePath, data);

  await transporter.sendMail({
    from: EMAIL_TRANSPORT,
    to,
    subject,
    ...(text ? { text } : {}),
    html,
  });
};
