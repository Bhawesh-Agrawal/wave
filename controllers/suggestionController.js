import { supabase } from "../config/supabaseClient.js";
import fetch from "node-fetch";

/**
 * Create suggestion using Gemini + Maps API
 */
export const createSuggestion = async (req, res) => {
  try {
    const { creator_id, group_id, prompt, locations } = req.body;

    // 1️⃣ Gemini API call (AI suggestion)
    const geminiResponse = await fetch("https://api.gemini.com/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify({ prompt }),
    });
    const geminiData = await geminiResponse.json();
    const suggestionText = geminiData.result || prompt;

    // 2️⃣ Maps API to calculate best meetup location
    // `locations` is array of {lat, lng} for all group members
    const mapsResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${locations[0].lat},${locations[0].lng}&key=${process.env.MAPS_API_KEY}`);
    const mapsData = await mapsResponse.json();
    const bestLocation = mapsData.results[0]?.formatted_address || null;
    const lat = locations[0].lat;
    const lng = locations[0].lng;

    // 3️⃣ Save suggestion
    const { data, error } = await supabase
      .from("suggestions")
      .insert([{ creator_id, group_id, content: suggestionText, suggested_place: bestLocation, lat, lng }])
      .select("*");

    if (error) throw error;
    res.status(201).json({ message: "Suggestion created", suggestion: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get suggestions for a group
 */
export const getGroupSuggestions = async (req, res) => {
  try {
    const { group_id } = req.params;
    const { data, error } = await supabase
      .from("suggestions")
      .select("*")
      .eq("group_id", group_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
