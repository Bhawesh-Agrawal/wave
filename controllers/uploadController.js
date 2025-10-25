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
