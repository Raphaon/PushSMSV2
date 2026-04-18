import nodemailer from 'nodemailer';
import mailConfig from '../../shared/config/email/email.config.js';

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      auth: { user: mailConfig.user, pass: mailConfig.pass },
    });
  }
  return transporter;
};

const baseHtml = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px}
  .card{background:#fff;border-radius:12px;max-width:520px;margin:0 auto;padding:32px}
  .logo{font-size:20px;font-weight:bold;color:#dc2626;margin-bottom:24px}
  h2{color:#111;margin-top:0}
  p{color:#555;line-height:1.6}
  .btn{display:inline-block;background:#dc2626;color:#fff;padding:12px 24px;
       border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0}
  .footer{color:#999;font-size:12px;margin-top:24px}
</style></head>
<body><div class="card">
  <div class="logo">PushSMS</div>
  ${content}
  <div class="footer">© ${new Date().getFullYear()} PushSMS — Ne pas répondre à cet email</div>
</div></body></html>`;

export const sendMail = async ({ to, subject, text, html, cc, bcc, attachments = [] }) => {
  const info = await getTransporter().sendMail({
    from: mailConfig.from,
    to, cc, bcc, subject, text, html, attachments,
  });
  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
};

export const trySendMail = async (opts) => {
  try {
    if (!mailConfig.host || !mailConfig.user) return null;
    return await sendMail(opts);
  } catch (err) {
    console.error('[mail]', err.message);
    return null;
  }
};

export const sendWelcomeEmail = (to, firstName) =>
  trySendMail({
    to,
    subject: 'Bienvenue sur PushSMS !',
    text: `Bienvenue ${firstName} ! Votre compte PushSMS est prêt.`,
    html: baseHtml(`
      <h2>Bienvenue, ${firstName} !</h2>
      <p>Votre compte PushSMS a été créé avec succès. Vous pouvez maintenant vous connecter et commencer à envoyer vos SMS.</p>
    `),
  });

export const sendPasswordResetEmail = (to, firstName, resetUrl) =>
  trySendMail({
    to,
    subject: 'Réinitialisation de votre mot de passe',
    text: `Lien de réinitialisation (valable 24h) : ${resetUrl}`,
    html: baseHtml(`
      <h2>Réinitialisation du mot de passe</h2>
      <p>Bonjour ${firstName || ''},</p>
      <p>Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le bouton ci-dessous (valable 24h) :</p>
      <a href="${resetUrl}" class="btn">Réinitialiser le mot de passe</a>
      <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `),
  });

export const sendRechargeApprovedEmail = (to, firstName, credits) =>
  trySendMail({
    to,
    subject: '✅ Recharge de crédits approuvée',
    text: `Votre demande de ${credits} crédits a été approuvée.`,
    html: baseHtml(`
      <h2>Recharge approuvée</h2>
      <p>Bonjour ${firstName || ''},</p>
      <p>Votre demande de recharge de <strong>${credits} crédits</strong> a été approuvée et ajoutée à votre compte.</p>
    `),
  });

export const sendRechargeRejectedEmail = (to, firstName, reason) =>
  trySendMail({
    to,
    subject: '❌ Demande de recharge rejetée',
    text: `Votre demande de recharge a été rejetée.${reason ? ` Motif : ${reason}` : ''}`,
    html: baseHtml(`
      <h2>Demande de recharge rejetée</h2>
      <p>Bonjour ${firstName || ''},</p>
      <p>Votre demande de recharge a malheureusement été rejetée.</p>
      ${reason ? `<p><strong>Motif :</strong> ${reason}</p>` : ''}
      <p>Contactez le support si vous avez des questions.</p>
    `),
  });

export const verifyConnection = async () => {
  await getTransporter().verify();
  return { message: 'SMTP prêt' };
};
