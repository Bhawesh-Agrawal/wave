import express from "express";

import {createUser, getUserByEmail, updateStreak, updateUser, searchUsers} from "../controllers/userControllers.js";

const router = express.Router()

router.post("/", createUser)
router.get("/:email", getUserByEmail)
router.put("/streak/:id", updateStreak);
router.put("/update", updateUser);
router.get("/search", searchUsers);

export default router;