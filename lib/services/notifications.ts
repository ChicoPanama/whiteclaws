/**
 * WhiteClaws Notification Service
 * 
 * Notifies protocols when findings are submitted.
 * Routes to Immunefi for triage when needed.
 * 
 * Email provider: Resend (set RESEND_API_KEY in env)
 * Fallback: console.log for development
 */

import { createClient } from '@/lib/supabase/admin';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'findings@whiteclaws.xyz';
const PLATFORM_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://whiteclaws.xyz';

// ── Send email via Resend ──
async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL-DEV] To: ${params.to}\n  Subject: ${params.subject}\n  ${params.text.slice(0, 200)}...`);
    return { success: true, id: 'dev-mode' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `WhiteClaws Security <${FROM_EMAIL}>`,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || res.statusText };
    return { success: true, id: data.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── Build notification email ──
function buildFindingEmail(params: {
  protocolName: string;
  severity: string;
  findingId: string;
  submittedAt: string;
  immunefiUrl?: string;
}): { subject: string; html: string; text: string } {
  const subject = `Vulnerability Report Submitted — ${params.protocolName}`;

  const severityColor: Record<string, string> = {
    critical: '#DC2626', high: '#EA580C', medium: '#D97706', low: '#2563EB',
  };
  const color = severityColor[params.severity] || '#6B7280';

  const immunefiSection = params.immunefiUrl
    ? `<p style="margin:16px 0">This finding has also been flagged for submission via <a href="${params.immunefiUrl}" style="color:#3B82F6">Immunefi</a> for formal triage.</p>`
    : '';

  const immunefiText = params.immunefiUrl
    ? `\nThis finding has also been flagged for submission via Immunefi:\n${params.immunefiUrl}\n`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0A0A0A;color:#E5E5E5;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:12px;padding:32px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">
      <span style="font-size:24px">🦞</span>
      <span style="font-size:18px;font-weight:700;color:#F5F5F5">WhiteClaws</span>
    </div>

    <h1 style="font-size:20px;color:#F5F5F5;margin:0 0 16px">Vulnerability Report Submitted</h1>

    <p style="color:#A3A3A3;margin:0 0 24px">
      A security researcher has submitted a vulnerability report for
      <strong style="color:#F5F5F5">${params.protocolName}</strong> through WhiteClaws.
    </p>

    <div style="background:#1A1A1A;border:1px solid #262626;border-radius:8px;padding:16px;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse;color:#D4D4D4;font-size:14px">
        <tr>
          <td style="padding:6px 0;color:#737373">Severity</td>
          <td style="padding:6px 0;text-align:right">
            <span style="background:${color}22;color:${color};padding:2px 10px;border-radius:4px;font-weight:600;text-transform:uppercase;font-size:12px">${params.severity}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#737373">Submitted</td>
          <td style="padding:6px 0;text-align:right;color:#D4D4D4">${new Date(params.submittedAt).toUTCString()}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#737373">Report ID</td>
          <td style="padding:6px 0;text-align:right;font-family:monospace;font-size:12px;color:#D4D4D4">${params.findingId.slice(0, 8)}...</td>
        </tr>
      </table>
    </div>

    <p style="color:#A3A3A3;font-size:14px">
      The report is stored encrypted on WhiteClaws. To review and respond, visit the platform.
    </p>

    ${immunefiSection}

    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #262626;color:#525252;font-size:12px">
      WhiteClaws — Decentralized Bug Bounty Platform<br>
      <a href="${PLATFORM_URL}" style="color:#3B82F6">${PLATFORM_URL}</a>
    </div>
  </div>
</body>
</html>`;

  const text = `Vulnerability Report Submitted — ${params.protocolName}

A security researcher has submitted a vulnerability report for ${params.protocolName} through WhiteClaws.

  Severity: ${params.severity.toUpperCase()}
  Submitted: ${new Date(params.submittedAt).toUTCString()}
  Report ID: ${params.findingId}

The report is stored encrypted on WhiteClaws.
${immunefiText}
—
WhiteClaws — Decentralized Bug Bounty Platform
${PLATFORM_URL}`;

  return { subject, html, text };
}

// ── Main: Notify protocol about a finding ──
// PRIORITY: Direct protocol email FIRST → Immunefi fallback SECOND
export async function notifyProtocolAboutFinding(params: {
  finding_id: string;
  protocol_id: string;
  protocol_name: string;
  severity: string;
  submitted_at: string;
}): Promise<{
  email_sent: boolean;
  immunefi_url: string | null;
  recipient: string | null;
  route: 'direct' | 'immunefi' | 'none';
}> {
  const supabase = createClient();

  // Look up protocol contact info
  const { data: protocol } = await supabase
    .from('protocols')
    .select('contact_email, security_email, immunefi_url, immunefi_slug')
    .eq('id', params.protocol_id)
    .single();

  const directEmail = protocol?.security_email || protocol?.contact_email || null;
  const immunefiUrl = protocol?.immunefi_url || null;

  let emailSent = false;
  let recipient: string | null = null;
  let route: 'direct' | 'immunefi' | 'none' = 'none';

  // PRIMARY: Email protocol directly
  if (directEmail) {
    const emailContent = buildFindingEmail({
      protocolName: params.protocol_name,
      severity: params.severity,
      findingId: params.finding_id,
      submittedAt: params.submitted_at,
    });

    const result = await sendEmail({ to: directEmail, ...emailContent });
    emailSent = result.success;
    recipient = directEmail;
    route = 'direct';

    await supabase.from('finding_notifications').insert({
      finding_id: params.finding_id,
      protocol_id: params.protocol_id,
      channel: 'email',
      recipient: directEmail,
      status: result.success ? 'sent' : 'failed',
      error: result.error || null,
    });

    // Mark notification sent on finding
    await supabase
      .from('findings')
      .update({ notification_sent: true })
      .eq('id', params.finding_id);
  }

  // SECONDARY: If no direct email, log Immunefi as the route
  if (!directEmail && immunefiUrl) {
    route = 'immunefi';

    await supabase.from('finding_notifications').insert({
      finding_id: params.finding_id,
      protocol_id: params.protocol_id,
      channel: 'immunefi_route',
      recipient: immunefiUrl,
      status: 'sent',
    });

    await supabase
      .from('findings')
      .update({ immunefi_routed: true, immunefi_routed_at: new Date().toISOString(), notification_sent: true })
      .eq('id', params.finding_id);
  }

  return { email_sent: emailSent, immunefi_url: immunefiUrl, recipient, route };
}
