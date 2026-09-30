import nodemailer from "nodemailer";
import { normalizeEmail } from "@/modules/appointments/domain/appointment";
import type { Mail, MailTransport } from "../application/ports";
export type SmtpConfiguration = { host: string; port: number; from: string; secure: boolean; user?: string; password?: string; allowLocalPlaintext: boolean };
export function smtpConfiguration(env: NodeJS.ProcessEnv = process.env): SmtpConfiguration {
  const host = env.MAIL_HOST ?? "", port = Number(env.MAIL_PORT), secure = port === 465;
  const local = ["localhost", "127.0.0.1", "::1"].includes(host);
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !!env.MAIL_USER !== !!env.MAIL_PASSWORD) throw new Error("Invalid SMTP configuration");
  return { host, port, from: normalizeEmail(env.MAIL_FROM), secure, user: env.MAIL_USER, password: env.MAIL_PASSWORD, allowLocalPlaintext: env.NODE_ENV !== "production" && local && env.MAIL_LOCAL_PLAINTEXT === "true" };
}
export function smtpMessage(mail: Mail, from: string) {
  const sender = normalizeEmail(from), to = normalizeEmail(mail.to);
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(mail.id)) throw new Error("Invalid message identity");
  return { from: { name: "", address: sender }, to: { name: "", address: to }, subject: mail.subject, text: mail.text, messageId: `<${mail.id}@${sender.split("@")[1]}>`,
    headers: { "Content-Language": "de" }, disableFileAccess: true, disableUrlAccess: true,
    ...(mail.ics && mail.method ? { icalEvent: { method: mail.method, content: mail.ics } } : {}) };
}
export function smtpTransport(config: SmtpConfiguration): MailTransport {
  return { async send(mail) {
    const transport = nodemailer.createTransport({ host: config.host, port: config.port, secure: config.secure, requireTLS: !config.allowLocalPlaintext,
      ignoreTLS: config.allowLocalPlaintext, auth: config.user ? { user: config.user, pass: config.password } : undefined,
      tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
      logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true });
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const info = await Promise.race([transport.sendMail(smtpMessage(mail, config.from)), new Promise<never>((_, reject) => { timer = setTimeout(() => { transport.close(); reject(new Error("Delivery timeout")); }, 25000); })]);
      if (!info.accepted.length || info.rejected.length) throw new Error("Delivery rejected");
    } catch { throw new Error("DELIVERY_FAILED"); }
    finally { if (timer) clearTimeout(timer); transport.close(); }
  } };
}
