import express from "express";
import { createSuggestion, getGroupSuggestions } from "../controllers/suggestionController.js";

const router = express.Router();

router.post("/create", createSuggestion);
router.get("/group/:group_id", getGroupSuggestions);

export default router;
