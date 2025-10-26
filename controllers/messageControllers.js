// controllers/messageController.js
import { supabase } from "../config/supabaseClient.js";

/**
 * Send a new message (group or direct)
 * Supports text, media, and different message types
 */
export const sendMessage = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser?.user)
      return res.status(401).json({ error: "Invalid token" });

    const { receiver_id, group_id, content, media_url, message_type } = req.body;
    const sender_id = authUser.user.id;

    if (!sender_id || (!receiver_id && !group_id)) {
      return res.status(400).json({ error: "Provide either receiver_id or group_id" });
    }

    // Validate message has content or media
    if (!content && !media_url) {
      return res.status(400).json({ error: "Message must have content or media" });
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([{ 
        sender_id, 
        receiver_id, 
        group_id, 
        content, 
        media_url, 
        message_type: message_type || 'text' 
      }])
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, username, avatar_url)
      `);

    if (error) throw error;
    res.status(201).json({ message: "Message sent successfully", data: data[0] });
  } catch (err) {
    console.error("Error sending message:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get messages (for direct or group chat)
 * Query params: ?group_id=uuid OR ?user1=uuid&user2=uuid
 */
export const getMessages = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser?.user)
      return res.status(401).json({ error: "Invalid token" });

    const { user1, user2, group_id } = req.query;

    let query = supabase.from("messages").select(`
      *,
      sender:users!messages_sender_id_fkey(id, username, avatar_url)
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
    res.status(200).json(data || []);
  } catch (err) {
    console.error("Error fetching messages:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Search messages by content
 */
export const searchMessages = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser?.user)
      return res.status(401).json({ error: "Invalid token" });

    const { user1, user2, group_id, q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: "Search query required" });
    }

    let query = supabase.from("messages").select(`
      *,
      sender:users!messages_sender_id_fkey(id, username, avatar_url)
    `);

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
    res.status(200).json(data || []);
  } catch (err) {
    console.error("Error searching messages:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Add or update reaction to a message
 * Supports emoji reactions
 */
export const reactToMessage = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser?.user)
      return res.status(401).json({ error: "Invalid token" });

    const { id } = req.params;
    const { reaction } = req.body;

    if (!reaction) {
      return res.status(400).json({ error: "Reaction is required" });
    }

    // Get current message to update reactions
    const { data: message, error: fetchError } = await supabase
      .from("messages")
      .select("reaction")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Parse existing reactions (stored as JSONB)
    const reactions = message.reaction || {};
    const userId = authUser.user.id;

    // Toggle reaction: if user already reacted with same emoji, remove it
    if (reactions[userId] === reaction) {
      delete reactions[userId];
    } else {
      reactions[userId] = reaction;
    }

    const { data, error } = await supabase
      .from("messages")
      .update({ reaction: reactions })
      .eq("id", id)
      .select();

    if (error) throw error;
    res.status(200).json({ message: "Reaction updated", data: data[0] });
  } catch (err) {
    console.error("Error reacting to message:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a specific message
 */
export const deleteMessage = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser?.user)
      return res.status(401).json({ error: "Invalid token" });

    const { id } = req.params;

    // Verify user owns the message
    const { data: message, error: fetchError } = await supabase
      .from("messages")
      .select("sender_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (message.sender_id !== authUser.user.id) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) throw error;
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error("Error deleting message:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GROUP MEMORY: Upload a memory (photo/video) to a group
 * This creates a special message with type 'memory'
 */
export const uploadGroupMemory = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser?.user)
      return res.status(401).json({ error: "Invalid token" });

    const { group_id, media_url, caption, memory_date } = req.body;

    if (!group_id || !media_url) {
      return res.status(400).json({ error: "group_id and media_url are required" });
    }

    // Verify user is member of the group
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", group_id)
      .eq("user_id", authUser.user.id)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!membership) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // Create a memory message
    const { data, error } = await supabase
      .from("messages")
      .insert([{
        sender_id: authUser.user.id,
        group_id,
        content: caption || "Shared a memory",
        media_url,
        message_type: 'memory',
        created_at: memory_date || new Date().toISOString()
      }])
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, username, avatar_url)
      `);

    if (error) throw error;
    res.status(201).json({ message: "Memory uploaded", data: data[0] });
  } catch (err) {
    console.error("Error uploading group memory:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get all memories for a group
 */
export const getGroupMemories = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser?.user)
      return res.status(401).json({ error: "Invalid token" });

    const { group_id } = req.params;

    // Verify user is member of the group
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", group_id)
      .eq("user_id", authUser.user.id)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!membership) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, username, avatar_url)
      `)
      .eq("group_id", group_id)
      .eq("message_type", "memory")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (err) {
    console.error("Error fetching group memories:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * JOURNAL: Create a journal entry
 * Journal entries are personal or group-specific
 */
export const createJournalEntry = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser?.user)
      return res.status(401).json({ error: "Invalid token" });

    const { group_id, title, content, mood, media_url } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    // If group_id is provided, verify membership
    if (group_id) {
      const { data: membership, error: memberError } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", group_id)
        .eq("user_id", authUser.user.id)
        .maybeSingle();

      if (memberError) throw memberError;
      if (!membership) {
        return res.status(403).json({ error: "You are not a member of this group" });
      }
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([{
        sender_id: authUser.user.id,
        group_id: group_id || null,
        content: JSON.stringify({ title, content, mood }),
        media_url,
        message_type: 'journal'
      }])
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, username, avatar_url)
      `);

    if (error) throw error;
    res.status(201).json({ message: "Journal entry created", data: data[0] });
  } catch (err) {
    console.error("Error creating journal entry:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get journal entries (personal or group)
 */
export const getJournalEntries = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser?.user)
      return res.status(401).json({ error: "Invalid token" });

    const { group_id } = req.query;

    let query = supabase
      .from("messages")
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, username, avatar_url)
      `)
      .eq("message_type", "journal");

    if (group_id) {
      // Get group journal entries
      query = query.eq("group_id", group_id);
    } else {
      // Get personal journal entries
      query = query
        .eq("sender_id", authUser.user.id)
        .is("group_id", null);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (err) {
    console.error("Error fetching journal entries:", err.message);
    res.status(500).json({ error: err.message });
  }
};