import express from "express";
import {
  sendMessage,
  getMessages,
  searchMessages,
  reactToMessage,
  deleteMessage,
} from "../controllers/messageControllers.js";

const router = express.Router();

// Send new message (group or direct)
router.post("/send", sendMessage);

// Get all messages (group or DM)
router.get("/", getMessages);

// Search messages in chat
router.get("/search", searchMessages);

// React to message
router.patch("/react/:id", reactToMessage);

// Delete message
router.delete("/:id", deleteMessage);

export default router;
