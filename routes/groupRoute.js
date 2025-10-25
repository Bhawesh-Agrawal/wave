import express from "express";
import { createGroup, getUserGroups } from "../controllers/groupController.js";

const router = express.Router();

router.post("/create", createGroup);
router.get("/user/:user_id", getUserGroups);

export default router;
