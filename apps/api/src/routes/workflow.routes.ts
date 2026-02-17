import express from "express";
import {
    createWorkflow, execute, getAll,
    getById,
    updateWorkflow,
    deleteWorkflow
} from "../controllers/workflow.controller";

const router = express.Router();

router.get("/", getAll);
router.get("/:id", getById);
router.put("/:id", updateWorkflow);
router.delete("/:id", deleteWorkflow);
router.post("/", createWorkflow);
router.post("/:id/execute", execute);


export default router;
