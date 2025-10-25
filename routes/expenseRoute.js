import express from "express";
import { createExpense, getGroupExpenses } from "../controllers/expenseController.js";

const router = express.Router();

router.post("/create", createExpense);
router.get("/group/:group_id", getGroupExpenses);

export default router;
