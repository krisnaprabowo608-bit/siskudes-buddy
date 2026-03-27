import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "siskeudes_session_id";

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function upsertSession(data: {
  user_name?: string;
  village_id?: string;
  village_name?: string;
  form_progress?: Record<string, boolean>;
  form_data?: Record<string, unknown>;
}) {
  const sessionId = getSessionId();
  
  // Try update first
  const { data: existing } = await supabase
    .from("user_sessions")
    .select("id, form_progress")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing) {
    const mergedProgress = {
      ...(typeof existing.form_progress === 'object' && existing.form_progress !== null ? existing.form_progress : {}),
      ...(data.form_progress || {}),
    };
    await supabase
      .from("user_sessions")
      .update({
        ...(data.user_name !== undefined && { user_name: data.user_name }),
        ...(data.village_id !== undefined && { village_id: data.village_id }),
        ...(data.village_name !== undefined && { village_name: data.village_name }),
        form_progress: mergedProgress,
        ...(data.form_data !== undefined && { form_data: data.form_data }),
        last_active: new Date().toISOString(),
      })
      .eq("session_id", sessionId);
  } else {
    await supabase.from("user_sessions").insert({
      session_id: sessionId,
      user_name: data.user_name || "",
      village_id: data.village_id || "",
      village_name: data.village_name || "",
      form_progress: data.form_progress || {},
      form_data: data.form_data || {},
    });
  }
}

export async function heartbeat() {
  const sessionId = getSessionId();
  await supabase
    .from("user_sessions")
    .update({ last_active: new Date().toISOString() })
    .eq("session_id", sessionId);
}

export async function getSiteSettings() {
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", "00000000-0000-0000-0000-000000000001")
    .single();
  return data;
}

export async function updateSiteSettings(updates: { is_locked?: boolean; max_users?: number }) {
  await supabase
    .from("site_settings")
    .update(updates)
    .eq("id", "00000000-0000-0000-0000-000000000001");
}

export async function getAllSessions() {
  const { data } = await supabase
    .from("user_sessions")
    .select("*")
    .order("last_active", { ascending: false });
  return data || [];
}

export async function deleteSession(sessionId: string) {
  await supabase.from("user_sessions").delete().eq("session_id", sessionId);
}

export async function getActiveSessions(minutesThreshold = 5) {
  const threshold = new Date(Date.now() - minutesThreshold * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("user_sessions")
    .select("*")
    .gte("last_active", threshold)
    .order("last_active", { ascending: false });
  return data || [];
}
