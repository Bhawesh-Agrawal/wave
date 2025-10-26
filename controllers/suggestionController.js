import { supabase } from "../config/supabaseClient.js";
import fetch from "node-fetch";

export const createSuggestion = async (req, res) => {
  try {
    const { creator_id, group_id, prompt, locations } = req.body;

    if (!group_id) {
      return res.status(400).json({ error: "group_id is required" });
    }

    // For now, just use the prompt as content
    // You can add Gemini API integration later
    const suggestionText = `Suggestion: ${prompt}`;
    
    // Optional: Maps API integration
    let bestLocation = null;
    let lat = null;
    let lng = null;
    
    if (locations && locations.length > 0 && process.env.MAPS_API_KEY) {
      try {
        const mapsResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${locations[0].lat},${locations[0].lng}&key=${process.env.MAPS_API_KEY}`
        );
        const mapsData = await mapsResponse.json();
        bestLocation = mapsData.results[0]?.formatted_address || null;
        lat = locations[0].lat;
        lng = locations[0].lng;
      } catch (mapError) {
        console.error("Maps API error:", mapError);
        // Continue without location data
      }
    }

    const { data, error } = await supabase
      .from("suggestions")
      .insert([{ 
        creator_id, 
        group_id, 
        content: suggestionText, 
        suggested_place: bestLocation, 
        lat, 
        lng 
      }])
      .select();

    if (error) throw error;
    res.status(201).json({ message: "Suggestion created", suggestion: data[0] });
  } catch (err) {
    console.error("Error creating suggestion:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getGroupSuggestions = async (req, res) => {
  try {
    const { group_id } = req.params;

    const { data, error } = await supabase
      .from("suggestions")
      .select(`
        *,
        users:creator_id (
          username,
          avatar_url
        )
      `)
      .eq("group_id", group_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (err) {
    console.error("Error fetching suggestions:", err.message);
    res.status(500).json({ error: err.message });
  }
};