import express from "express";
import { uploadSingle, uploadFile } from "../controllers/uploadController.js";

const router = express.Router();

router.post("/file", uploadSingle, uploadFile);

export default router;
