// userController.js
import { supabase } from "../config/supabaseClient.js";

/**
 * Create a new user in your 'users' table.
 * The user must be authenticated via Supabase Auth (token in headers).
 */
export const createUser = async (req, res) => {
  try {
    // Extract Supabase token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser.user) throw authError || new Error("Invalid token");

    const { username, avatar_url, bio, funny_tags } = req.body;

    // Check if user already exists in users table
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.user.id)
      .single();

    if (existingUser) {
      return res.status(200).json({ message: "User already exists", user: existingUser });
    }

    // Insert new user using Supabase Auth ID
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
      .select();

    if (error) throw error;
    res.status(201).json({ message: "User Created", user: data[0] });
  } catch (err) {
    console.error("Error creating user:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get a user by email.
 * Requires authentication via Supabase token.
 */
export const getUserByEmail = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser.user) throw authError || new Error("Invalid token");

    const { email } = req.params;
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching user:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update the user's streak.
 * Requires authentication via Supabase token.
 */
export const updateStreak = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser.user) throw authError || new Error("Invalid token");

    const today = new Date().toISOString().split("T")[0];

    // Fetch user's current streak
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("streak_count, last_meetup_date")
      .eq("id", authUser.user.id)
      .single();

    if (userError) throw userError;

    let newCount = user.streak_count || 0;

    // Only increment streak if last_meetup_date is not today
    if (user.last_meetup_date !== today) {
      newCount += 1;
    }

    // Update the user's streak
    const { data, error } = await supabase
      .from("users")
      .update({ streak_count: newCount, last_meetup_date: today })
      .eq("id", authUser.user.id)
      .select();

    if (error) throw error;
    res.status(200).json({ message: "Streak updated", user: data[0] });
  } catch (err) {
    console.error("Error updating streak:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser.user) throw authError;

    // --- THIS IS THE CHANGE ---
    // Get all fields that can be updated
    const { bio, funny_tags, avatar_url } = req.body;

    // Build an object with only the fields that were provided
    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (funny_tags !== undefined) updates.funny_tags = funny_tags;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    // --- END OF CHANGE ---

    const { data, error } = await supabase
      .from("users")
      .update(updates) // Update only the provided fields
      .eq("id", authUser.user.id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ message: "User updated", user: data });
  } catch (err) {
    console.error("Error updating user:", err.message);
    res.status(500).json({ error: err.message });
  }
};
