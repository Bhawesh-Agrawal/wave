import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoute from "./routes/userRoute.js"
import pollRoute from "./routes/pollRoute.js"
import messageRoute from "./routes/messageRoute.js"
import groupRoutes from "./routes/groupRoute.js";
import expenseRoutes from "./routes/expenseRoute.js";
import uploadRoutes from "./routes/uploadRoute.js";
import suggestionRoutes from "./routes/suggestionRoutes.js";



dotenv.config();
const app = express();

app.use(cors({
  origin: "*", 
  credentials: true,
}));
app.use(express.json());

app.get("/", (req, res) => res.send("Wave backend running 🌊"));

app.use("/api/users", userRoute);
app.use("/api/polls", pollRoute);
app.use("/api/messages", messageRoute);
app.use("/api/groups", groupRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/suggestions", suggestionRoutes);


app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);


