import express from "express";

import {createUser, getUserByEmail, updateStreak} from "../controllers/userControllers.js";

const router = express.Router()

router.post("/", createUser)
router.get("/:email", getUserByEmail)
router.put("/streak/:id", updateStreak);
router.put("/", updateUser);

export default router;