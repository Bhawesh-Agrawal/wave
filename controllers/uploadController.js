import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import fs from "fs";

// Temporary storage for multer
const upload = multer({ dest: "/tmp/" });

export const uploadSingle = upload.single("file");

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "wave_app", // optional folder
      resource_type: "auto", // auto detect image/video/gif
    });

    // Delete temp file
    fs.unlinkSync(req.file.path);

    res.status(200).json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser.user) throw authError;

    // Get the fields to update from the body
    const { bio, funny_tags } = req.body;

    const { data, error } = await supabase
      .from("users")
      .update({ bio, funny_tags }) // Only update these fields
      .eq("id", authUser.user.id)
      .select()
      .single(); // Use .single() to get one object back

    if (error) throw error;
    res.status(200).json({ message: "User updated", user: data });
  } catch (err) {
    console.error("Error updating user:", err.message);
    res.status(500).json({ error: err.message });
  }
};
