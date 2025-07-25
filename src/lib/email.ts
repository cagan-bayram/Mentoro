import { Resend } from 'resend';

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set');
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  if (!html && !text) {
    throw new Error('Either html or text must be provided');
  }
  // 'as any' is used to bypass the react property type error for plain emails
  return resend.emails.send({
    from: 'Mentoro <noreply@mentoro.dev>',
    to,
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
  } as any);
} 