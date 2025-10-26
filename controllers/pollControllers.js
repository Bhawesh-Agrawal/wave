import { supabase } from "../config/supabaseClient.js";

export const createPoll = async (req, res) => {
  try {
    const { creator_id, group_id, question, options } = req.body; // Add group_id

    const { data, error } = await supabase
      .from("polls")
      .insert([{ creator_id, group_id, question, options }]) // Include group_id
      .select();

    if (error) throw error;
    res.status(201).json({ message: "Poll created", poll: data[0] });
  } catch (err) {
    console.error("Error creating poll:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getPolls = async (req, res) => {
  try {
    const { group_id } = req.query; // Get from query params
    
    let query = supabase
      .from("polls")
      .select("*, users(username, avatar_url)")
      .order("created_at", { ascending: false });
    
    if (group_id) {
      query = query.eq("group_id", group_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching polls:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// 🗳️ Vote on a poll
export const votePoll = async (req, res) => {
  try {
    const { poll_id } = req.params;
    const { user_id, option } = req.body;

    const { data: pollData, error: pollError } = await supabase
      .from("polls")
      .select("votes")
      .eq("id", poll_id)
      .single();

    if (pollError) throw pollError;

    const votes = pollData.votes || {};
    votes[user_id] = option;

    const { data, error } = await supabase
      .from("polls")
      .update({ votes })
      .eq("id", poll_id)
      .select();

    if (error) throw error;
    res.status(200).json({ message: "Vote updated", poll: data[0] });
  } catch (err) {
    console.error("Error voting on poll:", err.message);
    res.status(500).json({ error: err.message });
  }
};
