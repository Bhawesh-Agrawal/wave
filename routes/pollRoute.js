import express from "express";
import { createPoll, getPolls, votePoll } from "../controllers/pollControllers.js";

const router = express.Router();

router.post("/", createPoll);
router.get("/", getPolls);
router.put("/vote/:poll_id", votePoll);

export default router;
