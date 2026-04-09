import { sendSMS, sendEmail } from './external-tools';

export async function sendBookingConfirmation(opts: {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  businessName: string;
  appointmentDate: string;
  appointmentTime: string;
  services: string;
  twilioNumber: string;
  fromEmail: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
}): Promise<{ smsSent: boolean; emailSent: boolean }> {
  let smsSent = false;
  let emailSent = false;

  const firstName = opts.clientName.split(' ')[0] || 'there';

  const smsBody = `Hi ${firstName}! Your appointment with ${opts.businessName} is confirmed for ${opts.appointmentDate} at ${opts.appointmentTime}. Services: ${opts.services}. Reply STOP to unsubscribe.`;

  const emailBody = `
    <h2>Appointment Confirmed</h2>
    <p>Hi ${firstName},</p>
    <p>Your appointment with <strong>${opts.businessName}</strong> has been confirmed:</p>
    <ul>
      <li><strong>Date:</strong> ${opts.appointmentDate}</li>
      <li><strong>Time:</strong> ${opts.appointmentTime}</li>
      <li><strong>Services:</strong> ${opts.services}</li>
    </ul>
    <p>See you then!</p>
  `;

  if (opts.smsEnabled && opts.twilioNumber && opts.clientPhone) {
    smsSent = await sendSMS(opts.twilioNumber, opts.clientPhone, smsBody);
  }

  if (opts.emailEnabled && opts.fromEmail && opts.clientEmail) {
    emailSent = await sendEmail({
      fromEmail: opts.fromEmail,
      fromName: opts.businessName,
      toEmail: opts.clientEmail,
      toName: opts.clientName,
      subject: `Appointment Confirmed — ${opts.businessName}`,
      content: emailBody
    });
  }

  return { smsSent, emailSent };
}

export async function sendAppointmentReminder(opts: {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  businessName: string;
  appointmentDate: string;
  appointmentTime: string;
  services: string;
  twilioNumber: string;
  fromEmail: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
}): Promise<{ smsSent: boolean; emailSent: boolean }> {
  let smsSent = false;
  let emailSent = false;

  const firstName = opts.clientName.split(' ')[0] || 'there';

  const smsBody = `Hey ${firstName}! Just a reminder — your appointment with ${opts.businessName} is tomorrow, ${opts.appointmentDate} at ${opts.appointmentTime}. See you then! Reply STOP to unsubscribe.`;

  const emailBody = `
    <h2>Appointment Reminder</h2>
    <p>Hi ${firstName},</p>
    <p>This is a friendly reminder that your appointment with <strong>${opts.businessName}</strong> is coming up:</p>
    <ul>
      <li><strong>Date:</strong> ${opts.appointmentDate}</li>
      <li><strong>Time:</strong> ${opts.appointmentTime}</li>
      <li><strong>Services:</strong> ${opts.services}</li>
    </ul>
    <p>See you tomorrow!</p>
  `;

  if (opts.smsEnabled && opts.twilioNumber && opts.clientPhone) {
    smsSent = await sendSMS(opts.twilioNumber, opts.clientPhone, smsBody);
  }

  if (opts.emailEnabled && opts.fromEmail && opts.clientEmail) {
    emailSent = await sendEmail({
      fromEmail: opts.fromEmail,
      fromName: opts.businessName,
      toEmail: opts.clientEmail,
      toName: opts.clientName,
      subject: `Appointment Reminder — ${opts.businessName}`,
      content: emailBody
    });
  }

  return { smsSent, emailSent };
}

export async function sendPostServiceFollowup(opts: {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  businessName: string;
  services: string;
  twilioNumber: string;
  fromEmail: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
}): Promise<{ smsSent: boolean; emailSent: boolean }> {
  let smsSent = false;
  let emailSent = false;

  const firstName = opts.clientName.split(' ')[0] || 'there';

  const smsBody = `Hey ${firstName}! Thanks for coming in to ${opts.businessName}! We hope you love how your ride looks. If you get a chance, we'd really appreciate a quick Google review — it helps us a ton! Reply STOP to unsubscribe.`;

  const emailBody = `
    <h2>Thanks for Visiting!</h2>
    <p>Hi ${firstName},</p>
    <p>Thank you for choosing <strong>${opts.businessName}</strong>! We hope you love the results.</p>
    <p>Services completed: <strong>${opts.services}</strong></p>
    <p>If you have a moment, we'd really appreciate a quick review — it helps us grow and serve you better!</p>
    <p>See you next time!</p>
  `;

  if (opts.smsEnabled && opts.twilioNumber && opts.clientPhone) {
    smsSent = await sendSMS(opts.twilioNumber, opts.clientPhone, smsBody);
  }

  if (opts.emailEnabled && opts.fromEmail && opts.clientEmail) {
    emailSent = await sendEmail({
      fromEmail: opts.fromEmail,
      fromName: opts.businessName,
      toEmail: opts.clientEmail,
      toName: opts.clientName,
      subject: `Thanks for visiting ${opts.businessName}!`,
      content: emailBody
    });
  }

  return { smsSent, emailSent };
}

export async function sendQuoteEmail(opts: {
  clientName: string;
  clientEmail: string;
  businessName: string;
  lineItems: Array<{ serviceName: string; price: number }>;
  total: number;
  fromEmail: string;
  fromName: string;
}): Promise<boolean> {
  if (!opts.clientEmail || !opts.fromEmail) return false;

  const firstName = opts.clientName.split(' ')[0] || 'there';
  const itemsHtml = opts.lineItems.map(li =>
    `<li>${li.serviceName} — $${li.price.toFixed(0)}</li>`
  ).join('');

  const emailBody = `
    <h2>Your Quote from ${opts.businessName}</h2>
    <p>Hi ${firstName},</p>
    <p>Here's the quote we put together for you:</p>
    <ul>${itemsHtml}</ul>
    <p><strong>Total: $${opts.total.toFixed(0)}</strong></p>
    <p>Ready to book? Just reply to this email or give us a call!</p>
    <p>— ${opts.businessName}</p>
  `;

  return await sendEmail({
    fromEmail: opts.fromEmail,
    fromName: opts.fromName,
    toEmail: opts.clientEmail,
    toName: opts.clientName,
    subject: `Your Quote — $${opts.total.toFixed(0)} — ${opts.businessName}`,
    content: emailBody
  });
}
