import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import workflowRoutes from "./routes/workflow.routes";



dotenv.config({ path: "./.env" });
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Workflow API running" });
});

app.use("/api/workflows", workflowRoutes);

app.listen(4000, () => {
    console.log("Server running on port 4000");
});
