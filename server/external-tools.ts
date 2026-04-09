import { execSync } from 'child_process';

function callExternalTool(sourceId: string, toolName: string, args: Record<string, any>): any {
  try {
    const params = JSON.stringify({ source_id: sourceId, tool_name: toolName, arguments: args });
    const escaped = params.replace(/'/g, "'\\''");
    const result = execSync(`external-tool call '${escaped}'`, {
      timeout: 30000,
      encoding: 'utf-8'
    });
    return JSON.parse(result);
  } catch (error: any) {
    console.error(`External tool error [${sourceId}/${toolName}]:`, error.message);
    return null;
  }
}

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone.startsWith('+') && digits.length >= 10) return `+${digits}`;
  return null;
}

export async function sendSMS(from: string, to: string, body: string): Promise<boolean> {
  const normalizedTo = normalizePhone(to);
  if (!normalizedTo) {
    console.error(`Invalid phone number: ${to}`);
    return false;
  }
  const normalizedFrom = normalizePhone(from);
  if (!normalizedFrom) {
    console.error(`Invalid from phone number: ${from}`);
    return false;
  }

  console.log(`Sending SMS from ${normalizedFrom} to ${normalizedTo}: ${body.substring(0, 50)}...`);
  const result = callExternalTool('twilio__pipedream', 'twilio-send-message', {
    from: normalizedFrom,
    to: normalizedTo,
    body
  });
  if (result !== null) {
    console.log('SMS sent successfully');
    return true;
  }
  console.error('SMS send failed');
  return false;
}

export async function sendEmail(opts: {
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName?: string;
  subject: string;
  content: string;
}): Promise<boolean> {
  if (!opts.toEmail || !opts.fromEmail) {
    console.error('Missing email addresses');
    return false;
  }

  console.log(`Sending email from ${opts.fromEmail} to ${opts.toEmail}: ${opts.subject}`);
  const result = callExternalTool('sendgrid__pipedream', 'sendgrid-send-email-single-recipient', {
    fromEmail: opts.fromEmail,
    fromName: opts.fromName,
    toEmail: opts.toEmail,
    toName: opts.toName || '',
    subject: opts.subject,
    content: opts.content
  });
  if (result !== null) {
    console.log('Email sent successfully');
    return true;
  }
  console.error('Email send failed');
  return false;
}
