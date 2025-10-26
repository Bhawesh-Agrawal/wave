// controllers/userController.js
import { supabase } from "../config/supabaseClient.js";

/**
 * Create a new user in your 'users' table.
 * The user must be authenticated via Supabase Auth (token in headers).
 */
export const createUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser?.user)
      return res.status(401).json({ error: "Invalid token" });

    const { username, avatar_url, bio, funny_tags } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.user.id)
      .maybeSingle();

    if (existingUser) {
      return res.status(200).json({ message: "User already exists", user: existingUser });
    }

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          id: authUser.user.id,
          username,
          email: authUser.user.email,
          avatar_url,
          bio,
          funny_tags,
        },
      ])
      .select()
      .maybeSingle();

    if (error) throw error;

    res.status(201).json({ message: "User created", user: data });
  } catch (err) {
    console.error("❌ Error creating user:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get a user by email.
 */
export const getUserByEmail = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser?.user)
      return res.status(401).json({ error: "Invalid token" });

    const { email } = req.params;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "User not found" });

    res.status(200).json(data);
  } catch (err) {
    console.error("❌ Error fetching user:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update user streak.
 */
export const updateStreak = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser?.user)
      return res.status(401).json({ error: "Invalid token" });

    const today = new Date().toISOString().split("T")[0];

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("streak_count, last_meetup_date")
      .eq("id", authUser.user.id)
      .maybeSingle();

    if (userError) throw userError;
    if (!user) return res.status(404).json({ error: "User not found" });

    let newCount = user.streak_count || 0;
    if (user.last_meetup_date !== today) newCount += 1;

    const { data, error } = await supabase
      .from("users")
      .update({ streak_count: newCount, last_meetup_date: today })
      .eq("id", authUser.user.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    res.status(200).json({ message: "Streak updated", user: data });
  } catch (err) {
    console.error("❌ Error updating streak:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update user profile (bio, avatar, funny_tags).
 */
export const updateUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser?.user)
      return res.status(401).json({ error: "Invalid token" });

    const { bio, funny_tags, avatar_url } = req.body;
    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (funny_tags !== undefined) updates.funny_tags = funny_tags;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", authUser.user.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ message: "User updated", user: data });
  } catch (err) {
    console.error("❌ Error updating user:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Search users by username or email.
 * FIXED: Removed .single() and .maybeSingle() calls that caused the error
 */
export const searchUsers = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser?.user)
      return res.status(401).json({ error: "Invalid token" });

    const currentUserId = authUser.user.id;
    const { q } = req.query;

    if (!q || typeof q !== "string" || q.trim().length === 0) {
      return res.status(400).json({ error: "Search query 'q' is required" });
    }

    const searchTerm = q.trim();

    // FIXED: Remove .single() or .maybeSingle() - these queries return arrays
    const [usernameRes, emailRes] = await Promise.all([
      supabase
        .from("users")
        .select("id, username, email, avatar_url")
        .ilike("username", `%${searchTerm}%`)
        .neq("id", currentUserId)
        .limit(10),
      supabase
        .from("users")
        .select("id, username, email, avatar_url")
        .ilike("email", `%${searchTerm}%`)
        .neq("id", currentUserId)
        .limit(10),
    ]);

    if (usernameRes.error) throw usernameRes.error;
    if (emailRes.error) throw emailRes.error;

    // Combine and deduplicate results
    const combined = [...(usernameRes.data || []), ...(emailRes.data || [])];
    const unique = Array.from(new Map(combined.map(u => [u.id, u])).values());

    // Return empty array if no results, not a 404
    res.status(200).json(unique);
  } catch (err) {
    console.error("❌ searchUsers: Unhandled exception:", err.message);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};