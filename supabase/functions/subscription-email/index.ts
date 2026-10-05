import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionEmailPayload {
  recipientEmail: string;
  recipientName?: string;
  planName?: string;
  tier?: string;
  amount?: number;
  trxId?: string;
  startDate?: string;
  endDate?: string;
  idempotencyKey?: string;
}

// In-memory idempotency cache for duplicate prevention
const sentConfirmationKeys = new Set<string>();

function renderSubscriptionEmail(payload: SubscriptionEmailPayload): string {
  const name = payload.recipientName?.trim() || "সম্মানিত দর্শক (Valued Member)";
  const planDisplay = payload.planName || (payload.tier === 'vip' ? 'ChitroKatha VIP All-Access Pass (৪কে ও অ্যাড-ফ্রি)' : 'ChitroKatha Standard Pass');
  const amountDisplay = payload.amount !== undefined ? (payload.amount === 0 ? '৳০ (১০০% ফ্রি স্পেশাল অফার)' : `৳${payload.amount}`) : 'পরিশোধিত (Paid)';
  const trxDisplay = payload.trxId ? payload.trxId.toUpperCase() : 'সিস্টেম যাচাইকৃত (System Verified)';
  const startDateDisplay = payload.startDate || new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
  const endDateDisplay = payload.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChitroKatha — Your Subscription is Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #07090e; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background: #0e111a; border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 30px 24px; text-align: center; background: linear-gradient(180deg, rgba(245, 158, 11, 0.15) 0%, rgba(225, 29, 72, 0.1) 50%, rgba(14, 17, 26, 0) 100%);">
              <div style="display: inline-block; width: 52px; height: 52px; line-height: 52px; border-radius: 16px; background: linear-gradient(135deg, #f59e0b, #e11d48); font-size: 26px; margin-bottom: 12px; box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.5);">
                👑
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; color: #ffffff; text-transform: uppercase;">
                ChitroKatha <span style="color: #f59e0b;">চিত্রকথা</span>
              </h1>
              <p style="margin: 6px 0 0; font-size: 12px; color: #fbbf24; letter-spacing: 0.5px; font-weight: 600;">
                ★ VIP মেম্বারশিপ কনফার্মেশন ★
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 10px 36px 30px;">
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 14px 18px; margin-bottom: 22px; text-align: center;">
                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #34d399;">
                  🎉 আপনার সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে!
                </p>
                <p style="margin: 4px 0 0; font-size: 12px; color: #a7f3d0;">
                  Your subscription is active. Welcome to ChitroKatha VIP!
                </p>
              </div>

              <p style="margin: 0 0 14px; font-size: 15px; color: #e4e4e7; line-height: 1.6;">
                নমস্কার / Hello <strong>${name}</strong>,
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; color: #a1a1aa; line-height: 1.6;">
                চিত্রকথায় যুক্ত হওয়ার জন্য ধন্যবাদ। আপনার ভিআইপি সাবস্ক্রিপশন অ্যাক্টিভেট করা হয়েছে। এখন আপনি বাংলা ও বিশ্ব চলচ্চিত্রের বিস্তৃত ক্যাটালগ ১০০% বিজ্ঞাপন ছাড়া ৪কে আল্ট্রা এইচডি কোয়ালিটিতে উপভোগ করতে পারবেন।
              </p>

              <!-- Subscription Details Table -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; margin: 20px 0; overflow: hidden;">
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; color: #a1a1aa;">
                    প্ল্যানের নাম (Plan Name):
                  </td>
                  <td style="padding: 12px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; color: #ffffff; font-weight: 700; text-align: right;">
                    ${planDisplay}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; color: #a1a1aa;">
                    পরিশোধের পরিমাণ (Amount Paid):
                  </td>
                  <td style="padding: 12px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; color: #fbbf24; font-weight: 700; text-align: right; font-family: monospace;">
                    ${amountDisplay}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; color: #a1a1aa;">
                    ট্রানজেকশন রেফারেন্স (TrxID):
                  </td>
                  <td style="padding: 12px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; color: #e4e4e7; font-family: monospace; text-align: right;">
                    ${trxDisplay}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; color: #a1a1aa;">
                    শুরুর তারিখ (Start Date):
                  </td>
                  <td style="padding: 12px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; color: #ffffff; text-align: right;">
                    ${startDateDisplay}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 12px; color: #a1a1aa;">
                    মেয়াদ শেষ (Expiry Date):
                  </td>
                  <td style="padding: 12px 18px; font-size: 12px; color: #34d399; font-weight: 700; text-align: right;">
                    ${endDateDisplay}
                  </td>
                </tr>
              </table>

              <!-- Watch Now Action Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 24px;">
                <tr>
                  <td align="center">
                    <a href="https://chitrokatha.online" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f59e0b 0%, #e11d48 100%); color: #000000; font-size: 14px; font-weight: 900; text-decoration: none; border-radius: 14px; letter-spacing: 0.5px; box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.5); text-transform: uppercase;">
                      Watch on ChitroKatha • সিনেমা দেখুন
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Support Note -->
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px 16px; border-radius: 10px; margin-top: 24px;">
                <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #fbbf24;">
                  💬 কাস্টমার সাপোর্ট ও হেল্প (Customer Support):
                </p>
                <p style="margin: 0; font-size: 11px; color: #d4d4d8; line-height: 1.5;">
                  সাবস্ক্রিপশন সংক্রান্ত যেকোনো প্রয়োজনে সরাসরি আমাদের ওয়েবসাইটে অ্যাডমিন সাপোর্ট চ্যাট করুন অথবা ইমেইল করুন: <a href="mailto:security@chitrokatha.online" style="color: #f43f5e; text-decoration: underline;">security@chitrokatha.online</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06); background: #0a0c12;">
              <p style="margin: 0; font-size: 11px; color: #52525b;">
                © 2026 ChitroKatha (চিত্রকথা). All rights reserved.
              </p>
              <p style="margin: 4px 0 0; font-size: 10px; color: #3f3f46;">
                Automated Transaction Receipt • Official Billing Notification
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: SubscriptionEmailPayload = await req.json();

    if (!payload.recipientEmail || !payload.recipientEmail.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid recipient email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Idempotency check: Prevent duplicate confirmation emails
    const idempotencyKey = payload.idempotencyKey || `${payload.recipientEmail}_${payload.trxId || 'sub'}_${payload.tier || 'vip'}`;
    if (sentConfirmationKeys.has(idempotencyKey)) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Confirmation email already dispatched for this transaction (idempotent skip).",
          delivered: true,
          duplicatePrevented: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const htmlContent = renderSubscriptionEmail(payload);
    const subject = "ChitroKatha — Your Subscription is Confirmed / আপনার সাবস্ক্রিপশন নিশ্চিত হয়েছে";

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("EMAIL_FROM") || "ChitroKatha <security@chitrokatha.online>";

    let delivered = false;
    let provider = "simulation";

    if (resendApiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [payload.recipientEmail],
            subject: subject,
            html: htmlContent,
          }),
        });

        if (res.ok) {
          delivered = true;
          provider = "resend";
          sentConfirmationKeys.add(idempotencyKey);
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("Resend API error:", errData);
        }
      } catch (sendErr) {
        console.error("Failed to send via Resend:", sendErr);
      }
    } else {
      // Dev / testing mode without live API key
      console.log(`[Dev Simulation] Subscription confirmation email queued for ${payload.recipientEmail}`);
      delivered = true;
      sentConfirmationKeys.add(idempotencyKey);
    }

    return new Response(
      JSON.stringify({
        success: true,
        delivered,
        provider,
        idempotencyKey,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unexpected error in subscription-email edge function:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
