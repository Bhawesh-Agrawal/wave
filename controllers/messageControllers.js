import { supabase } from "../config/supabaseClient.js";

/**
 * Send a new message (group or direct)
 */
export const sendMessage = async (req, res) => {
  try {
    const { sender_id, receiver_id, group_id, content, media_url, message_type } = req.body;

    if (!sender_id || (!receiver_id && !group_id)) {
      return res.status(400).json({ error: "Provide either receiver_id or group_id" });
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([{ sender_id, receiver_id, group_id, content, media_url, message_type }])
      .select("*");

    if (error) throw error;
    res.status(201).json({ message: "Message sent successfully", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get messages (for direct or group chat)
 * - Query params: ?group_id=uuid  OR  ?user1=uuid&user2=uuid
 */
export const getMessages = async (req, res) => {
  try {
    const { user1, user2, group_id } = req.query;

    let query = supabase.from("messages").select(`
      id, sender_id, receiver_id, group_id, content, media_url, message_type, reaction, created_at, updated_at
    `);

    if (group_id) {
      query = query.eq("group_id", group_id);
    } else if (user1 && user2) {
      query = query.or(
        `and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`
      );
    } else {
      return res.status(400).json({ error: "Provide either group_id or user pair" });
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Search messages by content
 * - Works in group or direct chat
 */
export const searchMessages = async (req, res) => {
  try {
    const { user1, user2, group_id } = req.query;
    const { q } = req.query;

    let query = supabase.from("messages").select("*");

    if (group_id) {
      query = query.eq("group_id", group_id).ilike("content", `%${q}%`);
    } else if (user1 && user2) {
      query = query
        .or(
          `and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`
        )
        .ilike("content", `%${q}%`);
    } else {
      return res.status(400).json({ error: "Provide group_id or user pair" });
    }

    const { data, error } = await query.order("created_at", { ascending: true });
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Add or update reaction to a message
 */
export const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction } = req.body;

    const { data, error } = await supabase
      .from("messages")
      .update({ reaction })
      .eq("id", id)
      .select();

    if (error) throw error;
    res.status(200).json({ message: "Reaction updated", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a specific message
 */
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) throw error;
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
