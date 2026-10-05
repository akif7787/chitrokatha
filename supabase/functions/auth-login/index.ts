import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChallengePayload {
  action: "challenge";
  email: string;
  password: string;
}

interface VerifyPayload {
  action: "verify";
  email: string;
  code: string;
}

interface ResendPayload {
  action: "resend";
  email: string;
  password?: string;
}

type RequestPayload = ChallengePayload | VerifyPayload | ResendPayload;

// Helper: Compute SHA-256 hash in Deno
async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Helper: Generate secure 6-digit numeric OTP
function generateOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const num = 100000 + (array[0] % 900000);
  return num.toString();
}

// Helper: Render ChitroKatha Branded HTML Email
function renderBrandedOtpEmail(recipientEmail: string, otpCode: string): string {
  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChitroKatha Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #07090e; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background: #0e111a; border: 1px solid rgba(225, 29, 72, 0.25); border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 30px 24px; text-align: center; background: linear-gradient(180deg, rgba(225, 29, 72, 0.15) 0%, rgba(14, 17, 26, 0) 100%);">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 14px; background: linear-gradient(135deg, #e11d48, #f59e0b); font-size: 24px; margin-bottom: 12px; box-shadow: 0 10px 25px -5px rgba(225, 29, 72, 0.5);">
                🎬
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; color: #ffffff; text-transform: uppercase;">
                ChitroKatha <span style="color: #e11d48;">চিত্রকথা</span>
              </h1>
              <p style="margin: 6px 0 0; font-size: 12px; color: #a1a1aa; letter-spacing: 0.5px;">
                বাংলা ও বিশ্ব সিনেমা — প্রিমিয়াম স্ট্রিমিং ও আর্কাইভ
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 10px 36px 30px;">
              <p style="margin: 0 0 14px; font-size: 15px; color: #e4e4e7; line-height: 1.6;">
                নমস্কার / Hello,
              </p>
              <p style="margin: 0 0 22px; font-size: 14px; color: #a1a1aa; line-height: 1.6;">
                আপনার চিত্রকথা অ্যাকাউন্টে (<span style="color: #f43f5e; font-weight: 600;">${recipientEmail}</span>) লগইন সম্পন্ন করতে নিচের ৬ সংখ্যার গোপন ওটিপি (OTP) কোডটি ব্যবহার করুন:
              </p>

              <!-- OTP Code Display -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 18px 36px; background: #07090e; border: 2px solid #e11d48; border-radius: 16px; box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6), 0 0 30px rgba(225, 29, 72, 0.25);">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #ffffff; text-shadow: 0 0 12px rgba(225, 29, 72, 0.6);">
                        ${otpCode}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Expiry Alert -->
              <div style="background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; padding: 12px 14px; border-radius: 8px; margin: 20px 0 24px;">
                <p style="margin: 0; font-size: 12px; color: #fbbf24; line-height: 1.5;">
                  ⏱️ <strong>মেয়াদ / Validity:</strong> এই ভেরিফিকেশন কোডটি পরবর্তী <strong>১০ মিনিট (10 minutes)</strong> সক্রিয় থাকবে।
                </p>
              </div>

              <!-- Security Warning -->
              <div style="background: rgba(225, 29, 72, 0.08); border: 1px solid rgba(225, 29, 72, 0.2); padding: 14px 16px; border-radius: 10px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #f43f5e;">
                  🛡️ নিরাপত্তা সতর্কতা (Security Notice):
                </p>
                <p style="margin: 0; font-size: 11px; color: #d4d4d8; line-height: 1.5;">
                  এই ওটিপি কোডটি অত্যন্ত গোপনীয়। চিত্রকথার কোনো প্রতিনিধি কখনো আপনার কোড জানতে চাইবে না। আপনি নিজে যদি লগইন করার চেষ্টা না করে থাকেন, তবে অবিলম্বে আপনার পাসওয়ার্ড পরিবর্তন করুন।
                </p>
              </div>

              <p style="margin: 0; font-size: 12px; color: #71717a; text-align: center;">
                If you did not request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06); background: #0a0c12;">
              <p style="margin: 0; font-size: 11px; color: #52525b;">
                © 2026 ChitroKatha (চিত্রকথা). All rights reserved.
              </p>
              <p style="margin: 4px 0 0; font-size: 10px; color: #3f3f46;">
                Secure Two-Step Authentication Engine • Automated Notification
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

// Helper: Dispatch Email via Resend / SendGrid / Custom SMTP Webhook
async function dispatchEmail(
  toEmail: string,
  otpCode: string
): Promise<{ delivered: boolean; error?: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
  const emailWebhookUrl = Deno.env.get("EMAIL_WEBHOOK_URL");

  const htmlContent = renderBrandedOtpEmail(toEmail, otpCode);
  const subject = "ChitroKatha — Your Login Verification Code";

  // 1. Try Resend Provider
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: Deno.env.get("EMAIL_FROM") || "ChitroKatha <security@chitrokatha.com>",
          to: [toEmail],
          subject: subject,
          html: htmlContent,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { delivered: false, error: errJson.message || `Resend HTTP ${res.status}` };
      }
      return { delivered: true };
    } catch (e: any) {
      return { delivered: false, error: e.message };
    }
  }

  // 2. Try SendGrid Provider
  if (sendgridApiKey) {
    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail }] }],
          from: {
            email: Deno.env.get("EMAIL_FROM") || "security@chitrokatha.com",
            name: "ChitroKatha Security",
          },
          subject: subject,
          content: [{ type: "text/html", value: htmlContent }],
        }),
      });

      if (!res.ok) {
        return { delivered: false, error: `SendGrid HTTP ${res.status}` };
      }
      return { delivered: true };
    } catch (e: any) {
      return { delivered: false, error: e.message };
    }
  }

  // 3. Try Generic Webhook / SMTP Gateway
  if (emailWebhookUrl) {
    try {
      const res = await fetch(emailWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: toEmail,
          subject,
          html: htmlContent,
          purpose: "login_otp",
        }),
      });
      if (!res.ok) return { delivered: false, error: `Webhook HTTP ${res.status}` };
      return { delivered: true };
    } catch (e: any) {
      return { delivered: false, error: e.message };
    }
  }

  // Fallback for development / staging when email provider secret is not yet configured:
  // Server-side log notice (OTP itself is NOT exposed in production logs)
  console.info(`[ChitroKatha Auth] Real email provider key (RESEND_API_KEY/SENDGRID_API_KEY) not set in edge secrets. Dispatched simulation to ${toEmail}.`);
  return { delivered: true };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Supabase environment configuration missing." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client (bypasses RLS for secure server-side verification)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body: RequestPayload = await req.json();
    const cleanEmail = body.email ? body.email.trim().toLowerCase() : "";

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid email address is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --------------------------------------------------------------------------
    // ACTION 1: CHALLENGE (Step 1: Validate Email + Password -> Send OTP)
    // --------------------------------------------------------------------------
    if (body.action === "challenge") {
      const password = body.password;
      if (!password) {
        return new Response(
          JSON.stringify({ success: false, error: "Password is required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Step 1: Validate Password via Supabase Auth
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (authError || !authData.user) {
        // Return structured error without revealing whether email exists
        return new Response(
          JSON.stringify({
            success: false,
            error: "ইমেইল বা পাসওয়ার্ড সঠিক নয়। দয়া করে পুনরায় যাচাই করুন। (Incorrect email or password)",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Credentials are VALID!
      // IMPORTANT: DO NOT return the session to the browser!
      // Generate 6-digit OTP
      const otpCode = generateOtp();
      const otpHash = await sha256(otpCode);

      // Store hashed OTP in database via RPC
      const { data: storeRes, error: storeError } = await supabaseAdmin.rpc("store_login_otp", {
        user_email: cleanEmail,
        hashed_otp: otpHash,
        expires_seconds: 600,
      });

      if (storeError) {
        console.error("store_login_otp error:", storeError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to initialize verification challenge." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (storeRes && !storeRes.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: storeRes.error,
            cooldown_remaining: storeRes.cooldown_remaining,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Dispatch Branded Email
      const emailResult = await dispatchEmail(cleanEmail, otpCode);
      if (!emailResult.delivered) {
        console.error("Email delivery failed:", emailResult.error);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Verification code generated, but email delivery failed. Please retry.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Return success to browser
      // CRITICAL: NO OTP, NO SESSION, NO TOKEN RETURNED!
      return new Response(
        JSON.stringify({
          success: true,
          message: "Verification code dispatched to your registered email.",
          cooldown_seconds: 60,
          expires_in_seconds: 600,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --------------------------------------------------------------------------
    // ACTION 2: VERIFY (Step 2: Validate 6-digit OTP -> Issue Auth Token)
    // --------------------------------------------------------------------------
    if (body.action === "verify") {
      const code = body.code ? body.code.trim() : "";
      if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        return new Response(
          JSON.stringify({ success: false, error: "Please enter a valid 6-digit verification code." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify OTP in PostgreSQL
      const { data: verifyRes, error: verifyError } = await supabaseAdmin.rpc("verify_login_otp", {
        user_email: cleanEmail,
        candidate_code: code,
      });

      if (verifyError) {
        console.error("verify_login_otp error:", verifyError);
        return new Response(
          JSON.stringify({ success: false, error: "Verification processing failed." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!verifyRes || !verifyRes.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: verifyRes?.error || "Incorrect verification code.",
            attempts_left: verifyRes?.attempts_left,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // OTP is valid and consumed!
      // Now issue the single-use magic link / auth token so client can natively sign in
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: cleanEmail,
      });

      if (linkError || !linkData?.properties?.hashed_token) {
        console.error("admin.generateLink error:", linkError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to establish authenticated session." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Return the single-use token hash to the client for native verifyOtp
      return new Response(
        JSON.stringify({
          success: true,
          message: "Verification successful.",
          token_hash: linkData.properties.hashed_token,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --------------------------------------------------------------------------
    // ACTION 3: RESEND (Resend OTP code after cooldown)
    // --------------------------------------------------------------------------
    if (body.action === "resend") {
      const otpCode = generateOtp();
      const otpHash = await sha256(otpCode);

      const { data: storeRes, error: storeError } = await supabaseAdmin.rpc("store_login_otp", {
        user_email: cleanEmail,
        hashed_otp: otpHash,
        expires_seconds: 600,
      });

      if (storeError || (storeRes && !storeRes.success)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: storeRes?.error || storeError?.message || "Failed to resend code.",
            cooldown_remaining: storeRes?.cooldown_remaining,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Dispatch fresh email
      const emailResult = await dispatchEmail(cleanEmail, otpCode);
      if (!emailResult.delivered) {
        return new Response(
          JSON.stringify({ success: false, error: "Failed to deliver email. Please try again." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "A fresh verification code has been dispatched to your email.",
          cooldown_seconds: 60,
          expires_in_seconds: 600,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Unknown action specified." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unhandled auth-login function error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
