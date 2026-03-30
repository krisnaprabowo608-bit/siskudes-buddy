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
  work_mode?: string;
  group_id?: string;
}) {
  const sessionId = getSessionId();
  
  const { data: existing } = await supabase
    .from("user_sessions")
    .select("id, form_progress")
    .eq("session_id", sessionId)
    .maybeSingle();

  const updateObj: Record<string, unknown> = {
    last_active: new Date().toISOString(),
  };
  if (data.user_name !== undefined) updateObj.user_name = data.user_name;
  if (data.village_id !== undefined) updateObj.village_id = data.village_id;
  if (data.village_name !== undefined) updateObj.village_name = data.village_name;
  if (data.form_data !== undefined) updateObj.form_data = JSON.parse(JSON.stringify(data.form_data));
  if (data.work_mode !== undefined) updateObj.work_mode = data.work_mode;
  if (data.group_id !== undefined) updateObj.group_id = data.group_id;

  if (existing) {
    const mergedProgress = {
      ...(typeof existing.form_progress === 'object' && existing.form_progress !== null ? existing.form_progress : {}),
      ...(data.form_progress || {}),
    };
    updateObj.form_progress = mergedProgress as unknown;
    await supabase
      .from("user_sessions")
      .update(updateObj as never)
      .eq("session_id", sessionId);
  } else {
    await supabase.from("user_sessions").insert([{
      session_id: sessionId,
      user_name: data.user_name || "",
      village_id: data.village_id || "",
      village_name: data.village_name || "",
      form_progress: (data.form_progress || {}) as unknown as Record<string, never>,
      form_data: (data.form_data ? JSON.parse(JSON.stringify(data.form_data)) : {}) as unknown as Record<string, never>,
      work_mode: data.work_mode || "individual",
      group_id: data.group_id || null,
    }]);
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

export async function trackFormProgress(formKey: string) {
  const sessionId = getSessionId();
  const groupId = localStorage.getItem("siskeudes_group_id");
  
  // Update own session
  await upsertSession({ form_progress: { [formKey]: true } });

  // If in group mode, update all group members' progress too
  if (groupId) {
    const { data: members } = await supabase
      .from("group_members")
      .select("session_id")
      .eq("group_id", groupId);
    
    if (members) {
      for (const member of members) {
        if (member.session_id !== sessionId) {
          const { data: memberSession } = await supabase
            .from("user_sessions")
            .select("form_progress")
            .eq("session_id", member.session_id)
            .maybeSingle();
          
          const merged = {
            ...(typeof memberSession?.form_progress === 'object' && memberSession?.form_progress !== null ? memberSession.form_progress : {}),
            [formKey]: true,
          };
          await supabase
            .from("user_sessions")
            .update({ form_progress: merged as never, last_active: new Date().toISOString() })
            .eq("session_id", member.session_id);
        }
      }
    }
  }
}

// ============ GROUP FUNCTIONS ============

export async function getGroupForVillage(villageId: string) {
  const { data } = await supabase
    .from("groups")
    .select("*")
    .eq("village_id", villageId);
  return data || [];
}

export async function getGroupMembers(groupId: string) {
  const { data } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });
  return data || [];
}

export async function createOrJoinGroup(villageId: string, villageName: string, userName: string): Promise<string> {
  const sessionId = getSessionId();
  
  // Check existing groups for this village
  const groups = await getGroupForVillage(villageId);
  
  let groupId: string;
  
  // Find a group with < 10 members
  let joinableGroup: string | null = null;
  for (const g of groups) {
    const members = await getGroupMembers(g.id);
    // Already a member?
    if (members.find(m => m.session_id === sessionId)) {
      localStorage.setItem("siskeudes_group_id", g.id);
      return g.id;
    }
    if (members.length < 10) {
      joinableGroup = g.id;
      break;
    }
  }
  
  if (joinableGroup) {
    groupId = joinableGroup;
    // Join existing group
    await supabase.from("group_members").insert({
      group_id: groupId,
      session_id: sessionId,
      user_name: userName,
      is_leader: false,
    });
    // Randomly reassign leader
    await randomizeLeader(groupId);
  } else {
    // Create new group
    const { data: newGroup } = await supabase.from("groups").insert({
      village_id: villageId,
      village_name: villageName,
    }).select().single();
    
    if (!newGroup) throw new Error("Gagal membuat kelompok");
    groupId = newGroup.id;
    
    // Add as first member and leader
    await supabase.from("group_members").insert({
      group_id: groupId,
      session_id: sessionId,
      user_name: userName,
      is_leader: true,
    });
  }
  
  // Update session
  await supabase.from("user_sessions")
    .update({ group_id: groupId, work_mode: "group" } as never)
    .eq("session_id", sessionId);
  
  localStorage.setItem("siskeudes_group_id", groupId);
  return groupId;
}

async function randomizeLeader(groupId: string) {
  const { data: members } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId);
  
  if (!members || members.length === 0) return;
  
  // Reset all
  await supabase.from("group_members")
    .update({ is_leader: false })
    .eq("group_id", groupId);
  
  // Pick random
  const randomIndex = Math.floor(Math.random() * members.length);
  await supabase.from("group_members")
    .update({ is_leader: true })
    .eq("id", members[randomIndex].id);
}

export async function isCurrentUserLeader(): Promise<boolean> {
  const sessionId = getSessionId();
  const groupId = localStorage.getItem("siskeudes_group_id");
  if (!groupId) return false;
  
  const { data } = await supabase
    .from("group_members")
    .select("is_leader")
    .eq("group_id", groupId)
    .eq("session_id", sessionId)
    .maybeSingle();
  
  return data?.is_leader || false;
}

export async function submitReport(reportData: Record<string, unknown>) {
  const sessionId = getSessionId();
  const groupId = localStorage.getItem("siskeudes_group_id");
  const villageName = localStorage.getItem("siskeudes_desa_profile") 
    ? JSON.parse(localStorage.getItem("siskeudes_desa_profile")!).namaDesa || ""
    : "";
  const villageId = localStorage.getItem("siskeudes_selected_village") || "";
  const userName = localStorage.getItem("siskeudes_user_name") || "";
  
  await supabase.from("report_submissions").insert({
    group_id: groupId,
    session_id: sessionId,
    submitted_by: userName,
    village_id: villageId,
    village_name: villageName,
    report_data: reportData as never,
  });
}

export async function getSubmittedReports() {
  const { data } = await supabase
    .from("report_submissions")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function syncFormDataToGroup() {
  const groupId = localStorage.getItem("siskeudes_group_id");
  if (!groupId) return;
  
  const sessionId = getSessionId();
  const appState = localStorage.getItem('siskeudes_app_state');
  if (!appState) return;
  
  const parsedState = JSON.parse(appState);
  
  // Save to own session
  await supabase.from("user_sessions")
    .update({ form_data: parsedState as never })
    .eq("session_id", sessionId);
  
  // Get all group members and update their form_data
  const { data: members } = await supabase
    .from("group_members")
    .select("session_id")
    .eq("group_id", groupId);
  
  if (!members) return;
  
  for (const member of members) {
    if (member.session_id !== sessionId) {
      await supabase.from("user_sessions")
        .update({ form_data: parsedState as never })
        .eq("session_id", member.session_id);
    }
  }
}

export async function loadGroupFormData(): Promise<Record<string, unknown> | null> {
  const sessionId = getSessionId();
  const { data: session } = await supabase
    .from("user_sessions")
    .select("group_id, form_data")
    .eq("session_id", sessionId)
    .maybeSingle();
  
  if (!session?.group_id) return null;
  
  if (session.form_data && typeof session.form_data === 'object' && Object.keys(session.form_data as object).length > 0) {
    return session.form_data as Record<string, unknown>;
  }
  return null;
}
