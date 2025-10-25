import { supabase } from "../config/supabaseClient.js";

export const createUser = async (req, res) => {
    try {
        const {username, email, avatar_url, bio, funny_tags} = req.body;

        const {data, error} = await supabase
        .from("users")
        .insert([
            {username, email, avatar_url, bio, funny_tags}
        ])
        .select();

        if (error) throw error;
        res.status(201).json({message: "User Created", user: data[0] })
    } catch(err) {
        console.error("Error creating user:", err.message);
        res.status(500).json({error : err.message});
    }
};

export const getUserByEmail = async (req, res) => {
  try {
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

export const updateStreak = async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().split("T")[0];

    const { data: user } = await supabase
      .from("users")
      .select("streak_count, last_meetup_date")
      .eq("id", id)
      .single();

    let newCount = user.streak_count;

    if (user.last_meetup_date !== today) {
      newCount += 1;
    }

    const { data, error } = await supabase
      .from("users")
      .update({ streak_count: newCount, last_meetup_date: today })
      .eq("id", id)
      .select();

    if (error) throw error;
    res.status(200).json({ message: "Streak updated", user: data[0] });
  } catch (err) {
    console.error("Error updating streak:", err.message);
    res.status(500).json({ error: err.message });
  }
};