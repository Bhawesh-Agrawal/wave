import { supabase } from "../config/supabaseClient.js";
import fetch from "node-fetch";

export const createSuggestion = async (req, res) => {
  try {
    const { creator_id, group_id, prompt, locations } = req.body;

    if (!group_id) {
      return res.status(400).json({ error: "group_id is required" });
    }

    let suggestionText = `Based on "${prompt}"...`;
    let bestLocation = null;
    let lat = null;
    let lng = null;

    // 1️⃣ Try Google Gemini AI (Free tier available)
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are a helpful assistant suggesting fun hangout ideas. Based on this request: "${prompt}", suggest 2-3 specific places or activities with brief descriptions. Keep it casual and fun. Format: "How about [place/activity]? [1-2 sentence description]"`
                }]
              }]
            })
          }
        );

        const geminiData = await geminiResponse.json();
        if (geminiData.candidates && geminiData.candidates[0]) {
          suggestionText = geminiData.candidates[0].content.parts[0].text;
        }
      } catch (geminiError) {
        console.error("Gemini API error:", geminiError);
        // Fallback to default
        suggestionText = `Here's an idea based on "${prompt}": Find a cozy spot nearby that matches your vibe! Check out local cafes, parks, or activity centers in your area.`;
      }
    } else {
      // Fallback suggestions without AI
      suggestionText = `Here's an idea for "${prompt}": Check out local spots in your area that match this vibe!`;
    }

    // 2️⃣ Get location suggestions (if Maps API is available)
    if (locations && locations.length > 0 && process.env.MAPS_API_KEY) {
      try {
        // Use Places API to find nearby spots
        const placesResponse = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${locations[0].lat},${locations[0].lng}&radius=5000&type=cafe|restaurant|park&key=${process.env.MAPS_API_KEY}`
        );
        const placesData = await placesResponse.json();
        
        if (placesData.results && placesData.results.length > 0) {
          const topPlace = placesData.results[0];
          bestLocation = topPlace.name + " - " + topPlace.vicinity;
          lat = topPlace.geometry.location.lat;
          lng = topPlace.geometry.location.lng;
        }
      } catch (mapError) {
        console.error("Maps API error:", mapError);
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
      .select(`
        *,
        users:creator_id (
          username,
          avatar_url
        )
      `);

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