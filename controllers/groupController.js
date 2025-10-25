import { supabase } from "../config/supabaseClient.js";

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, creator_id, members } = req.body;

    // 1️⃣ Insert group
    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .insert([{ name, description, creator_id }])
      .select();

    if (groupError) throw groupError;
    const group_id = groupData[0].id;

    // 2️⃣ Add members including creator
    const memberInserts = members.map(user_id => ({ group_id, user_id }));
    memberInserts.push({ group_id, user_id: creator_id }); // ensure creator is added

    const { error: memberError } = await supabase.from("group_members").insert(memberInserts);
    if (memberError) throw memberError;

    res.status(201).json({ message: "Group created", group: groupData[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all groups for a user
export const getUserGroups = async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data, error } = await supabase
      .from("group_members")
      .select(`
        group_id (id, name, description, creator_id, created_at)
      `)
      .eq("user_id", user_id);

    if (error) throw error;
    const groups = data.map(item => item.group_id);
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
