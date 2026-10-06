import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserPayload {
  action: "create_user";
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: "user" | "admin";
  status?: "active" | "suspended";
  plan?: "free" | "standard" | "vip";
}

interface ResetPasswordPayload {
  action: "reset_password";
  userId: string;
  newPassword: string;
}

interface UpdateUserPayload {
  action: "update_user";
  userId: string;
  email?: string;
  fullName?: string;
  phone?: string;
  role?: "user" | "admin";
  status?: "active" | "suspended";
  plan?: "free" | "standard" | "vip";
}

type AdminUserRequest = CreateUserPayload | ResetPasswordPayload | UpdateUserPayload;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Verify caller is an authenticated admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    // Allow service_role key itself for automated testing
    let callerAdminId: string | null = null;

    if (token === serviceRoleKey) {
      // Direct service_role caller
      const { data: superAdmin } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("role", "super_admin")
        .limit(1)
        .maybeSingle();
      callerAdminId = superAdmin?.id || null;
    } else {
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (userError || !userData?.user) {
        return new Response(
          JSON.stringify({ error: "Invalid user token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      callerAdminId = userData.user.id;
      const { data: callerProfile, error: profileErr } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", callerAdminId)
        .single();

      if (profileErr || !callerProfile || !["admin", "super_admin"].includes(callerProfile.role)) {
        return new Response(
          JSON.stringify({ error: "Forbidden: Admin privileges required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const payload: AdminUserRequest = await req.json();

    // -------------------------------------------------------------
    // ACTION: CREATE USER
    // -------------------------------------------------------------
    if (payload.action === "create_user") {
      const { email, password, fullName, phone, role = "user", status = "active", plan = "free" } = payload;

      if (!email || !password || !fullName) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: email, password, and fullName" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create user in Supabase Auth
      const { data: createdAuth, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName.trim(),
          phone: phone?.trim() || null,
        },
      });

      if (authError || !createdAuth?.user) {
        return new Response(
          JSON.stringify({ error: authError?.message || "Failed to create user in Auth" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newUserId = createdAuth.user.id;

      // Upsert profile
      const { error: profileUpsertErr } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: newUserId,
          full_name: fullName.trim(),
          phone: phone?.trim() || null,
          role: role,
          status: status,
          updated_at: new Date().toISOString(),
        });

      if (profileUpsertErr) {
        console.error("Profile upsert error:", profileUpsertErr);
      }

      // Handle subscription if specified
      if (plan && plan !== "free") {
        const startDate = new Date();
        const endDate = new Date();
        if (plan === "vip") {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setDate(endDate.getDate() + 30);
        }

        await supabaseAdmin
          .from("user_subscriptions")
          .upsert({
            user_id: newUserId,
            tier: plan,
            status: "active",
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            updated_at: new Date().toISOString(),
          });
      }

      // Audit Log
      await supabaseAdmin.from("admin_activity_logs").insert({
        admin_user_id: callerAdminId,
        action: "create_user",
        entity_type: "user",
        entity_id: newUserId,
        metadata: {
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          role,
          status,
          plan,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: newUserId,
            email: email.trim().toLowerCase(),
            fullName: fullName.trim(),
            phone: phone || null,
            role,
            status,
            plan,
            createdAt: createdAuth.user.created_at,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -------------------------------------------------------------
    // ACTION: RESET / SET PASSWORD
    // -------------------------------------------------------------
    if (payload.action === "reset_password") {
      const { userId, newPassword } = payload;
      if (!userId || !newPassword || newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: resetErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (resetErr) {
        return new Response(
          JSON.stringify({ error: resetErr.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Audit log
      await supabaseAdmin.from("admin_activity_logs").insert({
        admin_user_id: callerAdminId,
        action: "reset_user_password",
        entity_type: "user",
        entity_id: userId,
        metadata: { timestamp: new Date().toISOString() },
      });

      return new Response(
        JSON.stringify({ success: true, message: "User password updated successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -------------------------------------------------------------
    // ACTION: UPDATE USER DETAILS
    // -------------------------------------------------------------
    if (payload.action === "update_user") {
      const { userId, email, fullName, phone, role, status, plan } = payload;
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "userId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 1. If email is provided, securely update in Supabase Auth
      if (email && email.trim()) {
        const normalizedEmail = email.trim().toLowerCase();
        const { error: authEmailErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          email: normalizedEmail,
          email_confirm: true,
        });

        if (authEmailErr) {
          return new Response(
            JSON.stringify({ error: `Auth Email update failed: ${authEmailErr.message}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (fullName !== undefined) updates.full_name = fullName.trim();
      if (phone !== undefined) updates.phone = phone.trim();
      if (role !== undefined) updates.role = role;
      if (status !== undefined) updates.status = status;

      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (updateErr) {
        return new Response(
          JSON.stringify({ error: updateErr.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update subscription if changed
      if (plan !== undefined) {
        if (plan === "free") {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({ status: "canceled", updated_at: new Date().toISOString() })
            .eq("user_id", userId);
        } else {
          const startDate = new Date();
          const endDate = new Date();
          if (plan === "vip") {
            endDate.setFullYear(endDate.getFullYear() + 1);
          } else {
            endDate.setDate(endDate.getDate() + 30);
          }

          await supabaseAdmin
            .from("user_subscriptions")
            .upsert({
              user_id: userId,
              tier: plan,
              status: "active",
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              updated_at: new Date().toISOString(),
            });
        }
      }

      // Audit log
      await supabaseAdmin.from("admin_activity_logs").insert({
        admin_user_id: callerAdminId,
        action: "update_user",
        entity_type: "user",
        entity_id: userId,
        metadata: { updates, plan },
      });

      return new Response(
        JSON.stringify({ success: true, message: "User updated successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("admin-users edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
