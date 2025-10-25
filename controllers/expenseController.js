import { supabase } from "../config/supabaseClient.js";

// Create expense
export const createExpense = async (req, res) => {
  try {
    const { group_id, creator_id, description, amount, split } = req.body;

    const { data, error } = await supabase
      .from("expenses")
      .insert([{ group_id, creator_id, description, amount, split }])
      .select("*");

    if (error) throw error;
    res.status(201).json({ message: "Expense added", expense: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all expenses for a group
export const getGroupExpenses = async (req, res) => {
  try {
    const { group_id } = req.params;
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("group_id", group_id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
