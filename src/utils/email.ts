// Lightweight email helper. Uses dynamic import of nodemailer so code runs even if nodemailer
// is not installed. Configure SMTP via env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
export async function sendEmail(to: string, subject: string, text: string) {
  // don't crash if nodemailer not present
  try {
    // dynamic import; if nodemailer isn't installed the import will fail and we fallback to logging
    // @ts-ignore: dynamic import of optional dependency
    const nodemailer = await import("nodemailer");
    const host = process.env.SMTP_HOST;
    if (!host) {
      console.log("SMTP not configured; skipping email to", to);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    await transporter.sendMail({ from, to, subject, text });
    return true;
  } catch (err: any) {
    console.log("Email send failed or nodemailer missing:", err?.message || err);
    return false;
  }
}
